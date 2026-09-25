/**
 * packages/core/test/archive-settings.test.ts
 * Profile archive safety (zip-slip style attacks) and settings validation.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { defaultSettings, dohTemplate, isCachePath, packDir, unpackTo, validateSettings } from '../src';

function evilArchive(entryPath: string): Buffer {
  const header = Buffer.from(JSON.stringify([{ p: entryPath, s: 4 }]), 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(header.length, 0);
  return Buffer.concat([Buffer.from('OCTA1\n', 'ascii'), len, header, Buffer.from('evil')]);
}

describe('profile archive', () => {
  const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'octo-arc-'));

  it('round-trips files and skips Chromium caches', () => {
    const src = tmp();
    fs.mkdirSync(path.join(src, 'Default', 'Cache'), { recursive: true });
    fs.writeFileSync(path.join(src, 'Default', 'Cookies'), 'c');
    fs.writeFileSync(path.join(src, 'Default', 'Cache', 'data_0'), 'x'.repeat(100));
    fs.writeFileSync(path.join(src, 'zażółć gęślą.txt'), 'pl');
    const dest = tmp();
    const n = unpackTo(packDir(src), dest);
    expect(n).toBe(2);
    expect(fs.readFileSync(path.join(dest, 'Default', 'Cookies'), 'utf8')).toBe('c');
    expect(fs.readFileSync(path.join(dest, 'zażółć gęślą.txt'), 'utf8')).toBe('pl');
    expect(fs.existsSync(path.join(dest, 'Default', 'Cache'))).toBe(false);
    expect(isCachePath(path.join('Default', 'GPUCache', 'x'))).toBe(true);
  });

  it.each(['../escape.txt', 'a/../../escape.txt', '/etc/passwd', 'C:/Windows/evil.dll', 'a\0b'])('rejects unsafe path %j', (p) => {
    const dest = tmp();
    expect(() => unpackTo(evilArchive(p), dest)).toThrow();
    expect(fs.existsSync(path.join(path.dirname(dest), 'escape.txt'))).toBe(false);
  });

  it('rejects garbage and truncated archives', () => {
    expect(() => unpackTo(Buffer.from('not an archive'), tmp())).toThrow('Invalid archive');
    const good = evilArchive('ok.txt');
    expect(() => unpackTo(good.subarray(0, good.length - 2), tmp())).toThrow();
  });
});

describe('settings validation', () => {
  it('defaults are privacy-friendly', () => {
    const d = defaultSettings();
    expect(d.network.publicIpLookup).toBe(false);
    expect(d.logs.mode).toBe('standard');
    expect(d.offline).toBe(false);
    expect(d.updates.autoCheck).toBe(true);
  });

  it('sanitises hostile or broken values', () => {
    const v = validateSettings({
      schema: 1,
      network: { publicIpLookup: 'yes', dns: { mode: 'evil', provider: 'nope', customTemplate: 'http://plain.example/dns' } },
      security: { autoLockMinutes: 1e9 },
      logs: { mode: 'verbose' },
      updates: { channel: 'nightly' },
      tor: { torBrowserPath: 42 },
    });
    expect(v.network.dns.mode).toBe('system');
    expect(v.network.dns.provider).toBe('quad9');
    expect(v.network.dns.customTemplate).toBe('');
    expect(v.security.autoLockMinutes).toBe(24 * 60);
    expect(v.logs.mode).toBe('standard');
    expect(v.updates.channel).toBe('stable');
    expect(v.tor.torBrowserPath).toBe('');
  });

  it('rejects documents with a wrong schema', () => {
    expect(() => validateSettings({ schema: 2 })).toThrow();
    expect(() => validateSettings(null)).toThrow();
  });

  it('builds DoH templates only for https', () => {
    const s = defaultSettings();
    expect(dohTemplate(s)).toBeNull();
    s.network.dns = { mode: 'doh', provider: 'custom', customTemplate: 'https://dns.example/dns-query' };
    expect(dohTemplate(validateSettings(s))).toBe('https://dns.example/dns-query');
  });
});
