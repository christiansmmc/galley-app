import { describe, it, expect } from 'vitest';
import { categorizeAsset, pickRecommended, type Release } from './releases';

describe('categorizeAsset', () => {
  it('maps extensions to platforms', () => {
    expect(categorizeAsset('Galley-0.9.1-1.x86_64.rpm')).toBe('rpm');
    expect(categorizeAsset('Galley_0.9.1_amd64.deb')).toBe('deb');
    expect(categorizeAsset('Galley_0.9.1_x64-setup.msi')).toBe('windows');
    expect(categorizeAsset('Galley_0.9.1_x64-setup.exe')).toBe('windows');
  });
  it('is case-insensitive', () => {
    expect(categorizeAsset('GALLEY.RPM')).toBe('rpm');
  });
  it('returns null for unknown assets', () => {
    expect(categorizeAsset('Galley.AppImage')).toBeNull();
    expect(categorizeAsset('latest.json')).toBeNull();
  });
});

describe('pickRecommended', () => {
  const release: Release = {
    tag_name: 'v0.9.1',
    published_at: '2026-06-01T00:00:00Z',
    html_url: 'https://github.com/christiansmmc/galley-app/releases/tag/v0.9.1',
    assets: [
      { name: 'Galley-0.9.1-1.x86_64.rpm', browser_download_url: 'https://x/r.rpm' },
      { name: 'Galley_0.9.1_amd64.deb', browser_download_url: 'https://x/d.deb' },
      { name: 'Galley_0.9.1_x64-setup.exe', browser_download_url: 'https://x/w.exe' },
      { name: 'noise.txt', browser_download_url: 'https://x/n.txt' },
    ],
  };

  it('prefers the first installer in platform order (rpm)', () => {
    expect(pickRecommended(release)!.url).toBe('https://x/r.rpm');
  });
  it('falls through the platform order when earlier installers are absent', () => {
    const winOnly = pickRecommended({ ...release, assets: [release.assets[2]] });
    expect(winOnly!.url).toBe('https://x/w.exe');
  });
  it('falls back to the first asset when no installer is recognised', () => {
    const dl = pickRecommended({
      ...release,
      assets: [{ name: 'Galley.AppImage', browser_download_url: 'https://x/a.AppImage' }],
    });
    expect(dl!.url).toBe('https://x/a.AppImage');
  });
  it('carries the version tag', () => {
    expect(pickRecommended(release)!.version).toBe('v0.9.1');
  });
  it('returns null when there are no assets', () => {
    expect(pickRecommended({ ...release, assets: [] })).toBeNull();
  });
});
