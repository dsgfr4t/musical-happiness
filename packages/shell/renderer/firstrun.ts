/**
 * packages/shell/renderer/firstrun.ts - logic of the one-time first-run wizard.
 */
import { applyI18n, setDicts, setLang, t, Dicts } from './i18n-client';
import { appParam, invoke } from './setup-api';

interface InitData {
  app: 'octobrowser' | 'octodetect';
  productName: string;
  version: string;
  langGuess: 'en' | 'pl';
  suggestedBase: string;
  siblingConfigured: boolean;
  dataSubdir: string;
  dpapiAvailable: boolean;
  dicts: Dicts;
}
interface Validation { ok: boolean; errorKey?: string; dataDir?: string; existing: { exists: boolean } | null }

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

let step = 1;
let lang: 'en' | 'pl' | null = null;
let validation: Validation | null = null;
let busy = false;

function render(): void {
  for (let i = 1; i <= 3; i++) {
    $(`step${i}`).hidden = i !== step;
    const li = document.querySelector<HTMLElement>(`.steps li[data-step="${i}"]`)!;
    li.classList.toggle('active', i === step);
    li.classList.toggle('done', i < step);
  }
  $('back').style.visibility = step > 1 ? 'visible' : 'hidden';
  $('next').textContent = step === 3 ? t('firstRun.finish') : t('common.next');
  ($('next') as HTMLButtonElement).disabled = busy || (step === 1 && !lang) || (step === 2 && !validation?.ok);
  document.querySelectorAll<HTMLButtonElement>('.lang').forEach((b) => b.classList.toggle('selected', b.dataset.lang === lang));

}

async function validateFolder(): Promise<void> {
  const dir = ($('baseDir') as HTMLInputElement).value.trim();
  validation = await invoke<Validation>('setup:validate', dir).catch(() => null);
  $('folderErr').textContent = validation && !validation.ok ? t(validation.errorKey ?? 'firstRun.err.notWritable') : '';
  $('dataDir').textContent = validation?.dataDir ?? '—';
  $('existingNote').hidden = !validation?.existing?.exists;
  render();
}

async function finish(): Promise<void> {
  // Nothing to ask here any more: the local key is created automatically and
  // the only passphrase in the product belongs to an encrypted profile.
  busy = true;
  render();
  $('globalErr').textContent = t('firstRun.saving');
  try {
    await invoke('setup:finish', {
      language: lang,
      baseDir: ($('baseDir') as HTMLInputElement).value.trim(),
      publicIpLookup: ($('ipConsent') as HTMLInputElement).checked,
      autoUpdate: ($('autoUpdate') as HTMLInputElement).checked,
    });
    $('globalErr').textContent = t('firstRun.restarting');
  } catch (err) {
    const msg = (err as Error).message;
    $('globalErr').textContent = msg.startsWith('firstRun.') ? t(msg) : msg.includes('Decryption') ? t('unlock.wrong') : msg;
    busy = false;
    render();
  }
}

async function main(): Promise<void> {
  document.body.dataset.app = appParam();
  const init = await invoke<InitData>('setup:init');
  setDicts(init.dicts);
  setLang(init.langGuess);
  lang = null; // user must actively choose, even when pre-selected
  ($('logo') as HTMLImageElement).src = '../assets/logo.svg';
  $('product').textContent = init.productName;
  $('version').textContent = `v${init.version}`;
  ($('baseDir') as HTMLInputElement).value = init.suggestedBase;
  $('dpapiWarn').hidden = init.dpapiAvailable;
  document.querySelectorAll<HTMLButtonElement>('.lang').forEach((b) => {
    if (b.dataset.lang === init.langGuess) b.focus();
    b.addEventListener('click', () => {
      lang = b.dataset.lang === 'pl' ? 'pl' : 'en';
      setLang(lang);
      applyI18n();
      render();
    });
    b.addEventListener('dblclick', () => { if (lang) { step = 2; void validateFolder(); } });
  });
  applyI18n();

  $('browse').addEventListener('click', async () => {
    const dir = await invoke<string | null>('setup:browse', ($('baseDir') as HTMLInputElement).value);
    if (dir) {
      ($('baseDir') as HTMLInputElement).value = dir;
      await validateFolder();
    }
  });
  let timer = 0;
  $('baseDir').addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void validateFolder(), 300);
  });
  $('back').addEventListener('click', () => { if (step > 1 && !busy) { step--; $('globalErr').textContent = ''; render(); } });
  $('cancel').addEventListener('click', () => void invoke('setup:quit'));
  $('next').addEventListener('click', async () => {
    $('globalErr').textContent = '';
    if (step === 1 && lang) { step = 2; await validateFolder(); return; }
    if (step === 2 && validation?.ok) { step = 3; render(); return; }
    if (step === 3) await finish();
  });
  render();
}

main().catch((err) => { document.body.textContent = String(err); });
