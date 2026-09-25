/**
 * packages/shell/src/context.ts
 *
 * Opens the application context after the first run:
 *   refuses to run elevated -> logger -> settings -> keyring (DPAPI auto-unlock
 *   or master password window) -> secret store. Also applies app-wide DNS
 *   (DNS-over-HTTPS) and exposes translation helpers.
 */
import { app, dialog, shell } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  AppSettings, DICTS, DataLayout, Keyring, KeyringMode, Lang, Logger, SecretStore, VersionedStore, createSettingsStore, dohTemplate, t as translate,
} from '@octo/core';
import { dpapiProtector } from './osprotector';
import { PreparedApp, hasFlag } from './prepare';
import { runFirstRun } from './firstrun';
import { isElevated } from './winutil';

export interface AppContext {
  prep: PreparedApp;
  layout: DataLayout;
  lang: Lang;
  logger: Logger;
  settings: VersionedStore<AppSettings>;
  keyring: Keyring;
  secrets: SecretStore;
  t(key: string, params?: Record<string, string | number>): string;
}

/** Temporary logger used before a data folder exists (first-run wizard). */
export function firstRunLogger(prep: PreparedApp): Logger {
  return new Logger(path.join(prep.firstRunTempDir ?? os.tmpdir(), 'logs'), `${prep.info.id}-firstrun`);
}

/** Show an error box with localised text (falls back to English). */
export function fatal(lang: Lang, titleKey: string, bodyKey: string, params?: Record<string, string>): void {
  dialog.showErrorBox(translate(lang, titleKey), translate(lang, bodyKey, params));
}

/**
 * The key could not be opened (DPAPI blob from another Windows account or another PC,
 * damaged file). Instead of a dead end the user is offered a passwordless fresh start:
 * the unreadable key and the data that depends on it are quarantined - nothing is
 * deleted - and a new DPAPI key is created. Profiles keep their files; encrypted ones
 * report damage on their own and can be reset with scripts\\reset-profile.bat.
 */
async function recoverKeyring(
  keyring: Keyring,
  layout: DataLayout,
  lang: Lang,
  logger: Logger,
  bodyKey: string,
): Promise<boolean> {
  const tr = (k: string, p?: Record<string, string>) => translate(lang, k, p);
  const choice = dialog.showMessageBoxSync({
    type: 'warning',
    title: tr('err.keyring.title'),
    message: tr(bodyKey),
    detail: tr('err.keyring.recoverDetail'),
    buttons: [tr('err.keyring.recoverNew'), tr('err.keyring.recoverFolder'), tr('common.quit')],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  });
  if (choice === 1) {
    void shell.openPath(layout.config);
    return false;
  }
  if (choice !== 0) return false;

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const quarantine = path.join(layout.backups, `unreadable-${stamp}`);
  try {
    const moved = await keyring.resetToNewKey(quarantine);
    // secrets.bin was wrapped with the old key - it is now noise; keep it next to the key.
    const secretsFile = path.join(layout.config, 'secrets.bin');
    if (fs.existsSync(secretsFile)) {
      fs.mkdirSync(quarantine, { recursive: true });
      fs.renameSync(secretsFile, path.join(quarantine, 'secrets.bin'));
    }
    logger.warn('keyring.reset', { quarantine, previous: moved ?? '' });
    dialog.showMessageBoxSync({
      type: 'info',
      title: tr('err.keyring.title'),
      message: tr('err.keyring.recoverDone'),
      detail: quarantine,
      buttons: [tr('common.close')],
      noLink: true,
    });
    return true;
  } catch (e) {
    logger.error('keyring.reset-failed', { message: String((e as Error)?.message ?? e) });
    fatal(lang, 'err.keyring.title', 'err.keyring.recoverFailed', { message: String((e as Error)?.message ?? e) });
    return false;
  }
}

/**
 * Full startup sequence shared by both apps. Returns null when the app
 * should quit (user cancelled, first run requires relaunch, etc.).
 */
export async function startApp(prep: PreparedApp): Promise<AppContext | null> {
  const guessLangForErrors: Lang = prep.state?.language ?? (app.getLocale().startsWith('pl') ? 'pl' : 'en');

  // Never run as Administrator (unless explicitly overridden for troubleshooting).
  if ((await isElevated()) && !hasFlag('allow-elevated')) {
    fatal(guessLangForErrors, 'err.elevated.title', 'err.elevated.body');
    return null;
  }

  if (!prep.state || !prep.layout) {
    const done = await runFirstRun(prep, firstRunLogger(prep));
    if (done) {
      // Relaunch so Chromium uses the chosen data folder from the very first byte.
      app.relaunch();
    }
    app.exit(0);
    return null;
  }

  const lang = prep.state.language;
  const layout = prep.layout;
  const logger = new Logger(layout.logs, prep.info.id);
  const settings = createSettingsStore(layout);
  const s = settings.load();
  if (settings.lastLoadStatus === 'restored-from-backup' || settings.lastLoadStatus === 'reset-to-defaults') {
    logger.warn('settings.recovered', { status: settings.lastLoadStatus });
  }
  if (s.logs.mode === 'diagnostic') logger.setMode('diagnostic');
  logger.info('app.start', { app: prep.info.id, version: app.getVersion(), ephemeral: prep.ephemeral, portable: prep.portable });

  // App-wide DNS: DNS-over-HTTPS when configured.
  const doh = dohTemplate(s);
  if (doh) {
    app.configureHostResolver({ secureDnsMode: 'secure', secureDnsServers: [doh], enableBuiltInResolver: true });
    logger.info('dns.doh', { provider: s.network.dns.provider });
  }

  const keyring = new Keyring(path.join(layout.config, 'keyring.bin'), dpapiProtector);
  // --reset-keyring: deliberate fresh start without any password (documented recovery).
  const forceReset = hasFlag('reset-keyring') && keyring.exists();
  if (!keyring.exists()) {
    // e.g. Windows Sandbox session or user deleted the keyring: create a DPAPI keyring.
    if (!dpapiProtector.available()) {
      fatal(lang, 'err.keyring.title', 'err.keyring.noDpapi');
      return null;
    }
    await keyring.create();
  } else if (forceReset) {
    if (!(await recoverKeyring(keyring, layout, lang, logger, 'err.keyring.resetRequested'))) return null;
  } else {
    // mode() reads the file, which can itself be damaged - treat that like a failed unlock.
    let mode: KeyringMode | null = null;
    try {
      mode = keyring.mode();
    } catch (e) {
      logger.error('keyring.unreadable', { message: String((e as Error)?.message ?? e) });
    }
    if (mode === 'os' || mode === null) {
      try {
        if (mode === null) throw new Error('keyring file damaged');
        await keyring.unlock();
      } catch {
        logger.error('keyring.dpapi-failed');
        // Passwordless recovery instead of an error box the user cannot get past.
        if (!dpapiProtector.available()) {
          fatal(lang, 'err.keyring.title', 'err.keyring.noDpapi');
          return null;
        }
        if (!(await recoverKeyring(keyring, layout, lang, logger, 'err.keyring.dpapiFailed'))) return null;
      }
    } else {
      // Legacy keyring from an older build that still used a master password.
      // Master passwords are gone: quarantine it and start with a DPAPI key so the
      // app can always be opened without typing anything.
      logger.warn('keyring.legacy-password-mode');
      if (!(await recoverKeyring(keyring, layout, lang, logger, 'err.keyring.legacyPassword'))) return null;
    }
  }

  const secrets = new SecretStore(path.join(layout.config, 'secrets.bin'), keyring);
  return {
    prep,
    layout,
    lang,
    logger,
    settings,
    keyring,
    secrets,
    t: (key, params) => translate(lang, key, params),
  };
}

/** Dictionaries for renderers. */
export function dictsFor(): typeof DICTS {
  return DICTS;
}
