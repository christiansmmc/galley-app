export type Platform = 'rpm' | 'deb' | 'windows';

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}
export interface Release {
  tag_name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

/**
 * A single, OS-agnostic recommended download. The product is positioned as
 * "runs on any system", so we deliberately do NOT surface per-OS buttons —
 * just the recommended installable asset plus the version tag.
 */
export interface RecommendedDownload {
  url: string;
  version: string;
}

const ORDER: Platform[] = ['rpm', 'deb', 'windows'];

export function categorizeAsset(name: string): Platform | null {
  const n = name.toLowerCase();
  if (n.endsWith('.rpm')) return 'rpm';
  if (n.endsWith('.deb')) return 'deb';
  if (n.endsWith('.msi') || n.endsWith('.exe')) return 'windows';
  return null;
}

/**
 * Pick the single recommended asset for the generic Download CTA. Prefers the
 * installer order in ORDER (rpm → deb → windows); if no recognised installer is
 * present, falls back to the first asset; returns null only when there are no
 * assets at all (caller then links to the releases page).
 */
export function pickRecommended(release: Release): RecommendedDownload | null {
  if (release.assets.length === 0) return null;
  const byPlatform = new Map<Platform, ReleaseAsset>();
  for (const asset of release.assets) {
    const p = categorizeAsset(asset.name);
    if (p && !byPlatform.has(p)) byPlatform.set(p, asset);
  }
  for (const p of ORDER) {
    const a = byPlatform.get(p);
    if (a) return { url: a.browser_download_url, version: release.tag_name };
  }
  return { url: release.assets[0].browser_download_url, version: release.tag_name };
}
