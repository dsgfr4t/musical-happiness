/**
 * packages/core/src/keyring.ts
 *
 * Key hierarchy:
 *
 *   Data Encryption Key (DEK, random 256-bit)
 *     ├─ encrypts: secrets.bin, bookmarks/history/session (*.enc), encrypted stores
 *     └─ is itself stored ONLY in wrapped form in config/keyring.bin, mode "os":
 *          wrapped with Windows DPAPI (Electron safeStorage), bound to the Windows
 *          user account, so it unlocks automatically with no user interaction.
 *
 * There is NO master password. Nothing the user has to remember stands between
 * them and the app: if the DPAPI blob cannot be read any more (different Windows
 * account, restored machine, damaged file) the app quarantines it and starts with
 * a fresh key instead of refusing to open - see resetToNewKey() below.
 *
 * Profile data that must survive such a reset is protected separately with the
 * profile's own 12-word passphrase (see mnemonic.ts / profiles.ts).
 *
 * The DEK lives in memory only while unlocked and is wiped on lock().
 *
 * NOTE shown to users: local encryption does NOT protect against malware
 * running on an unlocked computer under the same account.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { atomicWriteFile } from './fsutil';
import { DecryptionError, generateKey, wipe } from './crypto';

/** Abstraction over OS-level secret protection (DPAPI via Electron safeStorage on Windows). */
export interface OsProtector {
  readonly name: string;
  available(): boolean;
  protect(data: Buffer): Buffer;
  unprotect(data: Buffer): Buffer;
}

/**
 * 'os' is the only mode current builds create. 'password' can still appear in a
 * keyring.bin written by an old build that had a master password; it is detected
 * only so the file can be quarantined and replaced.
 */
export type KeyringMode = 'os' | 'password';

interface KeyringFile {
  schema: 1;
  mode: KeyringMode;
  osBlob?: string; // base64, DPAPI-wrapped DEK
  pwdBlob?: string; // base64, OCTP blob containing the DEK
  createdAt: string;
  changedAt: string;
}

const MAGIC = Buffer.from('OCKR1\n', 'ascii');

export class Keyring {
  private dek: Buffer | null = null;

  constructor(
    private readonly file: string,
    private readonly os: OsProtector,
  ) {}

  exists(): boolean {
    return fs.existsSync(this.file);
  }

  isUnlocked(): boolean {
    return this.dek !== null;
  }

  private readFile(): KeyringFile {
    const raw = fs.readFileSync(this.file);
    if (!raw.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Keyring file damaged (bad header)');
    const obj = JSON.parse(raw.subarray(MAGIC.length).toString('utf8')) as KeyringFile;
    if (obj.schema !== 1 || (obj.mode !== 'os' && obj.mode !== 'password')) throw new Error('Keyring file damaged');
    return obj;
  }

  private writeFile(obj: KeyringFile): void {
    atomicWriteFile(this.file, Buffer.concat([MAGIC, Buffer.from(JSON.stringify(obj), 'utf8')]));
  }

  mode(): KeyringMode | null {
    if (!this.exists()) return null;
    return this.readFile().mode;
  }

  /** Create a new keyring with a fresh DEK, protected by DPAPI. */
  async create(): Promise<void> {
    if (this.exists()) throw new Error('Keyring already exists');
    const dek = generateKey();
    try {
      if (!this.os.available()) throw new Error(`${this.os.name} is not available on this system`);
      const now = new Date().toISOString();
      this.writeFile({ schema: 1, mode: 'os', osBlob: this.os.protect(dek).toString('base64'), createdAt: now, changedAt: now });
      this.dek = Buffer.from(dek);
    } finally {
      wipe(dek);
    }
  }

  /** Unlock. Never asks for anything; throws DecryptionError when DPAPI refuses the blob. */
  async unlock(): Promise<void> {
    const f = this.readFile();
    let dek: Buffer;
    if (f.mode !== 'os' || !f.osBlob) {
      // Legacy master-password keyring, or a damaged file: cannot be opened here.
      throw new DecryptionError('This keyring was not created by this version and cannot be opened automatically');
    }
    try {
      dek = this.os.unprotect(Buffer.from(f.osBlob, 'base64'));
    } catch {
      throw new DecryptionError('Windows could not unprotect the key (different user or damaged profile)');
    }
    if (dek.length !== 32) {
      wipe(dek);
      throw new DecryptionError('Keyring damaged: bad key length');
    }
    this.lock();
    this.dek = dek;
  }

  /** Wipe the DEK from memory. */
  lock(): void {
    wipe(this.dek);
    this.dek = null;
  }

  /** Returns the live DEK. Callers must NOT wipe or retain it. */
  getKey(): Buffer {
    if (!this.dek) throw new Error('Keyring is locked');
    return this.dek;
  }

  /**
   * Recovery for a keyring that cannot be opened any more (DPAPI blob from another
   * Windows account / another PC, damaged file). The old file is NOT deleted - it is
   * moved next to the other unreadable data so a backup can still be tried later - and
   * a brand new DEK is generated.
   *
   * Everything encrypted with the previous DEK becomes unreadable; the caller is
   * responsible for telling the user that and for quarantining those files.
   *
   * Returns the path the old keyring was moved to (null when there was none).
   */
  async resetToNewKey(quarantineDir?: string): Promise<string | null> {
    this.lock();
    let moved: string | null = null;
    if (this.exists()) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dir = quarantineDir ?? path.dirname(this.file);
      fs.mkdirSync(dir, { recursive: true });
      moved = path.join(dir, `${path.basename(this.file)}.unreadable-${stamp}`);
      fs.renameSync(this.file, moved);
    }
    await this.create();
    return moved;
  }
}
