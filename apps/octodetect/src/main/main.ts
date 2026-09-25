/**
 * apps/octodetect/src/main/main.ts - entry point of OctoDetect.su.
 *
 * Single-process app: splash -> (first run / unlock handled by startApp) ->
 * main window. Audits run in hidden windows with in-memory sessions or in the
 * user's default browser via a local one-time probe page.
 */
import { app, BrowserWindow, dialog, shell } from 'electron';
import * as path from 'node:path';
import { APPS, DICTS, SUITE_VERSION, isLang, Lang } from '@octo/core';
import { prepareApp } from '@octo/shell/prepare';
import { startApp, AppContext } from '@octo/shell/context';
import { hardenApp } from '@octo/shell/hardening';
import { handle, setTrustedRoot, trustWebContents } from '@octo/shell/ipc';
import { showSplash, iconPath, THEME } from '@octo/shell/windows-ui';
import { UpdateManager } from '@octo/shell/update-manager';
import { findTorBrowser, launchDetached } from '@octo/shell/winutil';
import { Auditor, AuditTarget } from './auditor';
import { runCliVerifyIfRequested } from '@octo/shell/cli-verify';

const distDir = __dirname;
setTrustedRoot(distDir);
// Headless release verification for scripts (exits immediately, touches no user data).
const verifyMode = runCliVerifyIfRequested('octodetect');
const prep = verifyMode ? { state: null, layout: null } as unknown as ReturnType<typeof prepareApp> : prepareApp('octodetect', distDir);

let mainWindow: BrowserWindow | null = null;

function createMainWindow(ctx: AppContext): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    show: false,
    title: 'OctoDetect.su',
    backgroundColor: THEME.octodetect.bg,
    icon: iconPath(distDir),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(distDir, 'preload-detect.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  trustWebContents(win.webContents);
  win.once('ready-to-show', () => win.show());
  void win.loadFile(path.join(distDir, 'renderer', 'detect.html'));
  win.on('closed', () => { mainWindow = null; });
  ctx.logger.info('window.main-created');
  return win;
}

function registerIpc(ctx: AppContext, auditor: Auditor, updates: UpdateManager): void {
  const L = ctx.logger;
  const send = (ch: string, payload: unknown) => mainWindow?.webContents.send(ch, payload);
  handle('od:init', L, () => ({
    lang: ctx.lang, dicts: DICTS, version: SUITE_VERSION, dataDir: ctx.layout.root, settings: ctx.settings.load(),
    update: updates.getStatus(), logMode: L.getMode(),
    torBrowser: !!findTorBrowser(ctx.settings.load().tor.torBrowserPath),
  }));
  handle('od:audit', L, async (_e, target: AuditTarget) => {
    if (!['baseline', 'standard', 'strict', 'external'].includes(target)) throw new Error('invalid target');
    return auditor.run(target, (stage) => send('od:progress', stage));
  });
  handle('od:audit-cancel', L, () => { auditor.cancel(); return true; });
  handle('od:reports', L, () => auditor.list());
  handle('od:report', L, (_e, id: string) => auditor.load(String(id)));
  handle('od:report-delete', L, (_e, id: string) => { auditor.remove(String(id)); return true; });
  handle('od:report-export', L, async (e, id: string, format: 'json' | 'html') => {
    const fmt = format === 'html' ? 'html' : 'json';
    const win = BrowserWindow.fromWebContents(e.sender)!;
    const r = await dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('documents'), `OctoDetect-${String(id).replace(/[^\w-]/g, '_')}.${fmt}`),
      filters: [{ name: fmt.toUpperCase(), extensions: [fmt] }],
    });
    if (r.canceled || !r.filePath) return false;
    auditor.exportTo(String(id), r.filePath, fmt);
    L.info('report.exported', { format: fmt });
    return true;
  });
  handle('od:settings', L, (_e, patch: { publicIpLookup?: boolean; offline?: boolean; autoCheck?: boolean; backgroundCheck?: boolean; autoLockMinutes?: number }) => {
    const s = ctx.settings.update((st) => {
      if (typeof patch.publicIpLookup === 'boolean') st.network.publicIpLookup = patch.publicIpLookup;
      if (typeof patch.offline === 'boolean') st.offline = patch.offline;
      if (typeof patch.autoCheck === 'boolean') st.updates.autoCheck = patch.autoCheck;
      if (typeof patch.backgroundCheck === 'boolean') st.updates.backgroundCheck = patch.backgroundCheck;
      if (typeof patch.autoLockMinutes === 'number') st.security.autoLockMinutes = patch.autoLockMinutes;
    });
    updates.configureBackground();
    return s;
  });
  handle('od:set-language', L, (_e, lang: Lang) => {
    if (!isLang(lang)) throw new Error('invalid language');
    if (!ctx.prep.ephemeral) ctx.prep.store.setLanguage(lang);
    return true;
  });
  handle('od:relaunch', L, () => { app.relaunch(); app.quit(); return true; });
  handle('od:open-folder', L, (_e, which: 'data' | 'logs' | 'reports') => {
    const map = { data: ctx.layout.root, logs: ctx.layout.logs, reports: ctx.layout.reports };
    void shell.openPath(map[which] ?? ctx.layout.root);
    return true;
  });
  handle('od:logs-clear', L, () => L.clear());
  handle('od:log-mode', L, (_e, mode: 'standard' | 'diagnostic') => {
    L.setMode(mode === 'diagnostic' ? 'diagnostic' : 'standard');
    ctx.settings.update((s) => { s.logs.mode = L.getMode(); });
    return L.getMode();
  });
  handle('od:update-check', L, () => updates.check());
  handle('od:update-download', L, () => updates.download());
  handle('od:update-install', L, async () => {
    const st = updates.getStatus();
    if (!st.readyToInstall) throw new Error('installer missing');
    await updates.install(path.join(ctx.layout.updater, 'downloads', path.basename(st.readyToInstall)));
    return true;
  });
  handle('od:update-postpone', L, () => { updates.postpone(24); return true; });
  handle('od:update-rollback', L, (_e, v: string) => updates.rollback(String(v)));
  handle('od:open-browser', L, () => {
    // Launch OctoBrowser.su if installed next to OctoDetect.
    const exe = path.join(path.dirname(app.getPath('exe')), '..', 'OctoBrowser', 'OctoBrowser.su.exe');
    try { launchDetached(exe); return true; } catch { return false; }
  });
  updates.onStatus((s) => send('od:update-status', s));
}


if (verifyMode) {
  // app.exit() was already called by runCliVerifyIfRequested - nothing else to do.
} else if (!app.requestSingleInstanceLock()) {
  app.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });
  app.whenReady().then(async () => {
    const splash = prep.state ? showSplash(distDir, 'octodetect', app.getVersion()) : null;
    const ctx = await startApp(prep);
    if (!ctx) { splash?.destroy(); app.quit(); return; }
    hardenApp(ctx.logger);
    ctx.layout.ensure(['reports']);
    const auditor = new Auditor(ctx);
    const updates = new UpdateManager(APPS.octodetect, ctx.layout, ctx.settings, ctx.logger, ctx.lang);
    registerIpc(ctx, auditor, updates);
    updates.onAppLaunch();
      // Keep the splash visible briefly so it does not flash.
    setTimeout(() => {
      mainWindow = createMainWindow(ctx);
      mainWindow.once('show', () => splash?.destroy());
    }, 700);
    app.on('before-quit', () => auditor.stop());
    app.on('window-all-closed', () => app.quit());
  }).catch((err) => {
    console.error(err);
    app.exit(1);
  });
}
