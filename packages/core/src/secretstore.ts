/**
 * packages/core/src/secretstore.ts
 *
 * Encrypted key/value store for secrets such as proxy credentials.
 * Secrets never appear in JSON/plain text files: the whole map is serialised
 * and encrypted with the keyring's DEK (AES-256-GCM) into config/secrets.bin.
 * Profiles only reference secrets by an opaque id (e.g. "proxy:<profileId>").
 */
import * as fs from 'node:fs';
import { atomicWriteFile } from './fsutil';
import { decryptWithKey, encryptWithKey, wipe } from './crypto';
import type { Keyring } from './keyring';

const CONTEXT = 'octosuite-secrets-v1';

export class SecretStore {
  constructor(private readonly file: string, private readonly keyring: Pick<Keyring, 'getKey'>) {}

  private readAll(): Record<string, string> {
    if (!fs.existsSync(this.file)) return {};
    const plain = decryptWithKey(this.keyring.getKey(), fs.readFileSync(this.file), CONTEXT);
    try {
      return JSON.parse(plain.toString('utf8')) as Record<string, string>;
    } finally {
      wipe(plain);
    }
  }

  private writeAll(map: Record<string, string>): void {
    const plain = Buffer.from(JSON.stringify(map), 'utf8');
    try {
      atomicWriteFile(this.file, encryptWithKey(this.keyring.getKey(), plain, CONTEXT));
    } finally {
      wipe(plain);
    }
  }

  get(id: string): string | undefined {
    return this.readAll()[id];
  }

  has(id: string): boolean {
    return id in this.readAll();
  }

  set(id: string, value: string): void {
    const all = this.readAll();
    all[id] = value;
    this.writeAll(all);
  }

  delete(id: string): void {
    const all = this.readAll();
    if (id in all) {
      delete all[id];
      this.writeAll(all);
    }
  }

  /** Remove every secret whose id starts with prefix (used when deleting a profile). */
  deletePrefix(prefix: string): void {
    const all = this.readAll();
    let changed = false;
    for (const k of Object.keys(all)) {
      if (k.startsWith(prefix)) {
        delete all[k];
        changed = true;
      }
    }
    if (changed) this.writeAll(all);
  }
}
