# Galley Presentation Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean single-page Astro site that presents Galley and offers per-platform downloads pulled from the latest GitHub Release, deployed to GitHub Pages.

**Architecture:** Static Astro site (zero server). Visual markup lives in Astro components. All non-trivial logic is extracted into three pure, unit-tested TypeScript modules (`i18n`, `theme`, `releases`); thin client `<script>` tags wire those modules to the DOM (localStorage, `fetch`, click handlers). Deployed via the official Astro GitHub Pages Action on push to `master`.

**Tech Stack:** Astro 5 (static), TypeScript (strict), Vitest for unit tests, GitHub Pages + `withastro/action` for deploy. Package manager: pnpm. Node 24 (works ≥ 18.20.8).

**Working directory for ALL tasks:** `C:\Users\csequ\projects\galley-app` (already exists, already `git init`'d, already holds `docs/specs/` + `docs/plans/`).

**Spec:** `docs/specs/2026-06-05-galley-app-design.md`.

---

## File Structure

```
galley-app/
  package.json                     # scripts + deps
  astro.config.mjs                 # site + base = /galley-app
  tsconfig.json                    # extends astro strict
  vitest.config.ts                 # node env, src/**/*.test.ts
  .gitignore
  .nvmrc                           # 24
  public/
    01-hero.png 03-palette.png 04-settings.png 05-first-run.png 07-paper.png
    favicon.png                    # copy of icon-512.png
  src/
    lib/
      i18n.ts        i18n.test.ts        # STRINGS dict + detectLang()
      theme.ts       theme.test.ts       # resolveInitialTheme()
      releases.ts    releases.test.ts     # categorizeAsset(), buildDownloads()
    styles/
      theme.css                       # CSS vars for [data-theme=paper|linen] + tokens
      global.css                      # base element styles, layout helpers
    layouts/
      Base.astro                      # <html>, <head>, font + style includes, boot script
    components/
      TopBar.astro                    # brand + theme/lang toggles
      Hero.astro
      Manifesto.astro
      Features.astro
      Themes.astro
      Download.astro                  # markup + client fetch script
      Footer.astro
    pages/
      index.astro                     # composes all sections
  .github/workflows/deploy.yml
  README.md
```

Each `src/lib/*.ts` module is pure (no DOM, no network) so it is unit-testable. Components hold markup + scoped client scripts. `Base.astro` owns the one global boot `<script>` that initialises theme + language before sections render-flash.

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`
- Create: `src/pages/index.astro` (temporary placeholder, replaced in Task 9)

- [ ] **Step 1: Initialise package.json and install Astro + tooling**

Run (in `C:\Users\csequ\projects\galley-app`):

```bash
pnpm init
pnpm add astro@^5
pnpm add -D vitest@^2 typescript@^5 @astrojs/check@^0.9
```

Expected: `node_modules/` created, `astro` + `vitest` appear in `package.json`.

- [ ] **Step 2: Set package.json scripts**

Replace the `"scripts"` block in `package.json` with:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",
  "test": "vitest run"
},
"type": "module",
```

- [ ] **Step 3: Write astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://christiansmmc.github.io',
  base: '/galley-app',
});
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Write .gitignore**

```gitignore
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 6: Write .nvmrc**

```
24
```

- [ ] **Step 7: Write a temporary placeholder page so the build succeeds**

`src/pages/index.astro`:

```astro
---
---
<html lang="en">
  <head><meta charset="utf-8" /><title>Galley</title></head>
  <body><h1>Galley — placeholder</h1></body>
</html>
```

- [ ] **Step 8: Verify the project builds**

Run: `pnpm build`
Expected: `dist/` is produced, exit 0, "Complete!" message.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project for galley-app site"
```

---

### Task 2: Copy screenshots into public/

**Files:**
- Create: `public/01-hero.png`, `public/03-palette.png`, `public/04-settings.png`, `public/05-first-run.png`, `public/07-paper.png`, `public/favicon.png`

- [ ] **Step 1: Copy the screenshot assets from the pr-reviewer repo**

Run (PowerShell tool):

```powershell
$src = "C:\Users\csequ\projects\pr-reviewer\screenshots"
$dst = "C:\Users\csequ\projects\galley-app\public"
Copy-Item "$src\01-hero.png","$src\03-palette.png","$src\04-settings.png","$src\05-first-run.png","$src\07-paper.png" $dst
Copy-Item "$src\icon-512.png" "$dst\favicon.png"
```

Expected: six PNGs in `public/`.

- [ ] **Step 2: Verify the files exist**

Run (Bash tool): `ls 'C:\Users\csequ\projects\galley-app\public'`
Expected: `01-hero.png 03-palette.png 04-settings.png 05-first-run.png 07-paper.png favicon.png`

- [ ] **Step 3: Commit**

```bash
git add public
git commit -m "assets: add Galley screenshots and favicon"
```

---

### Task 3: i18n module (strings + language detection)

**Files:**
- Create: `src/lib/i18n.ts`
- Test: `src/lib/i18n.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { STRINGS, detectLang, type Lang } from './i18n';

describe('detectLang', () => {
  it('prefers a valid stored value', () => {
    expect(detectLang('pt', 'en-US')).toBe('pt');
    expect(detectLang('en', 'pt-BR')).toBe('en');
  });
  it('ignores an invalid stored value and falls back to navigator', () => {
    expect(detectLang('xx', 'pt-BR')).toBe('pt');
    expect(detectLang(null, 'pt')).toBe('pt');
  });
  it('defaults to en when navigator is not portuguese', () => {
    expect(detectLang(null, 'en-GB')).toBe('en');
    expect(detectLang(null, undefined)).toBe('en');
  });
});

describe('STRINGS', () => {
  it('has identical keys for en and pt', () => {
    expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.pt).sort());
  });
  it('has no empty strings', () => {
    for (const lang of ['en', 'pt'] as Lang[])
      for (const v of Object.values(STRINGS[lang])) expect(v.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot find module `./i18n`.

- [ ] **Step 3: Write the implementation**

`src/lib/i18n.ts`:

```ts
export type Lang = 'en' | 'pt';

export const STRINGS = {
  en: {
    nav_download: 'Download',
    nav_github: 'GitHub',
    hero_title_a: 'A quieter way to',
    hero_title_b: 'review pull requests',
    hero_sub: 'A Linux desktop GitHub PR reviewer. It shows you the diff, opens a workshop around it, and stays out of your way.',
    manifesto_line: 'Reading. No summaries.',
    manifesto_sub: 'No AI summaries. No suggested fixes. No chips for state. Just the diff and your attention.',
    features_eyebrow: 'What’s inside',
    feat_diff_title: 'Side-by-side or inline diff',
    feat_diff_body: 'Monaco-based. Per-file viewed state via a single dot. No AI-suggested fixes in the margin.',
    feat_comments_title: 'Inline comments, local-first drafts',
    feat_comments_body: 'Open, draft, resolved — communicated by the left-edge rule alone. Drafts persist in SQLite and never round-trip until you submit.',
    feat_palette_title: 'Command palette',
    feat_palette_body: 'Ctrl+K. Fuzzy across PRs, files, repos, commands. “only what you search for.”',
    feat_repos_title: 'Multi-repo PR list',
    feat_repos_body: 'Grouped by repo, fuzzy-searchable. Author names hidden by default — you already know who you are.',
    themes_eyebrow: 'Themes',
    themes_title: 'Linen, or Paper. Your taste, the same restraint.',
    themes_body: 'Linen (dark) and Paper (light), with sage, ochre, ink and rust accents. English and Portuguese. Compact to spacious density.',
    themes_linen: 'Linen — the default',
    themes_paper: 'Paper — warm light',
    download_eyebrow: 'Download',
    download_title: 'Get Galley',
    download_loading: 'Checking the latest release…',
    download_none: 'No release published yet — check the releases page.',
    download_releases_link: 'All releases',
    download_version: 'Version',
    footer_tagline: 'Reading. No summaries.',
    footer_license: 'MIT License',
    footer_source: 'Source',
  },
  pt: {
    nav_download: 'Baixar',
    nav_github: 'GitHub',
    hero_title_a: 'Um jeito mais quieto de',
    hero_title_b: 'revisar pull requests',
    hero_sub: 'Um revisor de PRs do GitHub para desktop Linux. Mostra o diff, abre um ateliê em volta dele e sai do seu caminho.',
    manifesto_line: 'Leitura. Sem resumos.',
    manifesto_sub: 'Sem resumos de IA. Sem correções sugeridas. Sem chips de estado. Só o diff e a sua atenção.',
    features_eyebrow: 'O que tem dentro',
    feat_diff_title: 'Diff lado a lado ou inline',
    feat_diff_body: 'Baseado no Monaco. Estado “visto” por arquivo num único ponto. Nenhuma correção de IA na margem.',
    feat_comments_title: 'Comentários inline, rascunhos locais',
    feat_comments_body: 'Aberto, rascunho, resolvido — comunicado só pela borda esquerda. Rascunhos ficam em SQLite e nunca vão ao servidor até você enviar.',
    feat_palette_title: 'Paleta de comandos',
    feat_palette_body: 'Ctrl+K. Fuzzy entre PRs, arquivos, repos, comandos. “só o que você procura.”',
    feat_repos_title: 'Lista multi-repo de PRs',
    feat_repos_body: 'Agrupada por repo, com busca fuzzy. Nomes de autor escondidos por padrão — você já sabe quem você é.',
    themes_eyebrow: 'Temas',
    themes_title: 'Linen, ou Paper. Seu gosto, a mesma sobriedade.',
    themes_body: 'Linen (escuro) e Paper (claro), com acentos sage, ochre, ink e rust. Inglês e português. Densidade do compacto ao espaçoso.',
    themes_linen: 'Linen — o padrão',
    themes_paper: 'Paper — claro e quente',
    download_eyebrow: 'Download',
    download_title: 'Baixe o Galley',
    download_loading: 'Verificando o último release…',
    download_none: 'Nenhum release publicado ainda — veja a página de releases.',
    download_releases_link: 'Todos os releases',
    download_version: 'Versão',
    footer_tagline: 'Leitura. Sem resumos.',
    footer_license: 'Licença MIT',
    footer_source: 'Código',
  },
} as const;

export function detectLang(stored: string | null, navigatorLang: string | undefined): Lang {
  if (stored === 'en' || stored === 'pt') return stored;
  if (navigatorLang && navigatorLang.toLowerCase().startsWith('pt')) return 'pt';
  return 'en';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/lib/i18n.test.ts
git commit -m "feat: i18n strings dictionary and language detection"
```

---

### Task 4: theme module (initial theme resolution)

**Files:**
- Create: `src/lib/theme.ts`
- Test: `src/lib/theme.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/theme.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveInitialTheme, type Theme } from './theme';

describe('resolveInitialTheme', () => {
  it('prefers a valid stored value', () => {
    expect(resolveInitialTheme('linen', true)).toBe('linen');
    expect(resolveInitialTheme('paper', true)).toBe('paper');
  });
  it('falls back to linen when system prefers dark', () => {
    expect(resolveInitialTheme(null, true)).toBe('linen');
  });
  it('falls back to paper when system does not prefer dark', () => {
    expect(resolveInitialTheme(null, false)).toBe('paper');
    expect(resolveInitialTheme('bogus', false)).toBe('paper');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot find module `./theme`.

- [ ] **Step 3: Write the implementation**

`src/lib/theme.ts`:

```ts
export type Theme = 'paper' | 'linen';

export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'paper' || stored === 'linen') return stored;
  return prefersDark ? 'linen' : 'paper';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat: theme resolution helper"
```

---

### Task 5: releases module (asset matching + download building)

**Files:**
- Create: `src/lib/releases.ts`
- Test: `src/lib/releases.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/releases.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { categorizeAsset, buildDownloads, type Release } from './releases';

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

describe('buildDownloads', () => {
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

  it('returns one entry per known platform in fixed order', () => {
    const dl = buildDownloads(release);
    expect(dl.map((d) => d.platform)).toEqual(['rpm', 'deb', 'windows']);
    expect(dl[0].url).toBe('https://x/r.rpm');
  });
  it('drops platforms with no matching asset', () => {
    const dl = buildDownloads({ ...release, assets: [release.assets[1]] });
    expect(dl.map((d) => d.platform)).toEqual(['deb']);
  });
  it('carries the version tag', () => {
    expect(buildDownloads(release)[0].version).toBe('v0.9.1');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot find module `./releases`.

- [ ] **Step 3: Write the implementation**

`src/lib/releases.ts`:

```ts
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
export interface Download {
  platform: Platform;
  label: string;
  url: string;
  version: string;
}

const LABELS: Record<Platform, string> = {
  rpm: 'Linux · .rpm (Fedora/Nobara)',
  deb: 'Linux · .deb (Ubuntu/Debian)',
  windows: 'Windows · .msi',
};
const ORDER: Platform[] = ['rpm', 'deb', 'windows'];

export function categorizeAsset(name: string): Platform | null {
  const n = name.toLowerCase();
  if (n.endsWith('.rpm')) return 'rpm';
  if (n.endsWith('.deb')) return 'deb';
  if (n.endsWith('.msi') || n.endsWith('.exe')) return 'windows';
  return null;
}

export function buildDownloads(release: Release): Download[] {
  const byPlatform = new Map<Platform, ReleaseAsset>();
  for (const asset of release.assets) {
    const p = categorizeAsset(asset.name);
    if (p && !byPlatform.has(p)) byPlatform.set(p, asset);
  }
  return ORDER.filter((p) => byPlatform.has(p)).map((p) => ({
    platform: p,
    label: LABELS[p],
    url: byPlatform.get(p)!.browser_download_url,
    version: release.tag_name,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/releases.ts src/lib/releases.test.ts
git commit -m "feat: release asset categorization and download building"
```

---

### Task 6: Add vitest config and verify the suite runs clean

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Run the full suite**

Run: `pnpm test`
Expected: 3 test files, all passing.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "test: vitest config"
```

---

### Task 7: Theme + global styles

**Files:**
- Create: `src/styles/theme.css`, `src/styles/global.css`

- [ ] **Step 1: Write src/styles/theme.css (CSS variables, both themes)**

```css
/* Palette mirrors Galley globals.css. Default = paper (light). */
:root,
[data-theme='paper'] {
  --bg: #faf7f0;
  --surface: #ffffff;
  --surface-2: #ede9df;
  --text: #2a2723;
  --subtext: #6b6358;
  --line: #ede9df;
  --accent: #5e7556;
  --accent-soft: rgba(94, 117, 86, 0.12);
  --sage: #5e7556;
  --ochre: #8e6a2c;
  --ink: #3b5570;
  --rust: #8b4a38;
}
[data-theme='linen'] {
  --bg: #222226;
  --surface: #2a2a2f;
  --surface-2: #313137;
  --text: #dcd8cf;
  --subtext: #8e887d;
  --line: #313137;
  --accent: #8fa888;
  --accent-soft: rgba(143, 168, 136, 0.12);
  --sage: #8fa888;
  --ochre: #c9a35a;
  --ink: #7aa5c9;
  --rust: #c78866;
}
```

- [ ] **Step 2: Write src/styles/global.css (base + layout helpers)**

```css
@import './theme.css';

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, -apple-system, system-ui, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  transition: background 200ms ease, color 200ms ease;
}
.serif { font-family: 'Source Serif 4', Georgia, serif; }
.eyebrow {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}
.wrap { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
.section { padding: 80px 0; }
.muted { color: var(--subtext); }
a { color: inherit; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { filter: brightness(1.05); }
.btn-ghost { background: var(--surface); border-color: var(--line); color: var(--text); }
.btn-ghost:hover { border-color: var(--accent); }

.shot {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--line);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  display: block;
}

@media (max-width: 760px) {
  .section { padding: 56px 0; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles
git commit -m "style: theme variables and global styles"
```

---

### Task 8: Base layout with font loading + theme/lang boot script

**Files:**
- Create: `src/layouts/Base.astro`

This layout owns the `<head>` (fonts, favicon respecting `base`), imports global CSS, and runs ONE inline boot script that sets `data-theme` + `lang` before paint (no flash), then exposes `window.__setTheme` / `window.__setLang` used by the toggles in Task 9.

- [ ] **Step 1: Write src/layouts/Base.astro**

```astro
---
import '../styles/global.css';
const base = import.meta.env.BASE_URL;
const { title = 'Galley — a quieter way to review pull requests' } = Astro.props;
---
<!DOCTYPE html>
<html lang="en" data-theme="paper">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content="Galley — a Linux desktop GitHub PR reviewer. Reading. No summaries." />
    <link rel="icon" type="image/png" href={`${base}/favicon.png`} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
      rel="stylesheet"
    />
    <script is:inline>
      // Boot: set theme + lang before first paint to avoid flash.
      (function () {
        try {
          var storedT = localStorage.getItem('galley-theme');
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          var theme = storedT === 'paper' || storedT === 'linen' ? storedT : (prefersDark ? 'linen' : 'paper');
          document.documentElement.setAttribute('data-theme', theme);

          var storedL = localStorage.getItem('galley-lang');
          var nav = (navigator.language || '').toLowerCase();
          var lang = storedL === 'en' || storedL === 'pt' ? storedL : (nav.indexOf('pt') === 0 ? 'pt' : 'en');
          document.documentElement.setAttribute('lang', lang);

          window.__setTheme = function (t) {
            document.documentElement.setAttribute('data-theme', t);
            localStorage.setItem('galley-theme', t);
          };
          window.__setLang = function (l) {
            document.documentElement.setAttribute('lang', l);
            localStorage.setItem('galley-lang', l);
            document.querySelectorAll('[data-i18n]').forEach(function (el) {
              var key = el.getAttribute('data-i18n');
              var val = (window.__STRINGS && window.__STRINGS[l] && window.__STRINGS[l][key]) || '';
              if (val) el.textContent = val;
            });
            document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
          };
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: base layout with font loading and theme/lang boot"
```

---

### Task 9: Build all page sections and compose index.astro

This task assembles the visible site. All translatable text carries `data-i18n="<key>"` so `window.__setLang` (Task 8) can swap it; the initial server-rendered text is the English value. The strings dict is injected once as `window.__STRINGS` for the client toggle.

**Files:**
- Create: `src/components/TopBar.astro`, `Hero.astro`, `Manifesto.astro`, `Features.astro`, `Themes.astro`, `Download.astro`, `Footer.astro`
- Modify (replace): `src/pages/index.astro`

- [ ] **Step 1: Write src/components/TopBar.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
const base = import.meta.env.BASE_URL;
---
<header class="topbar">
  <div class="wrap bar">
    <a class="brand" href={base}>
      <img src={`${base}/favicon.png`} width="26" height="26" alt="Galley" />
      <span class="serif">Galley</span>
    </a>
    <nav class="controls">
      <div class="toggle" id="lang-toggle" role="group" aria-label="Language">
        <button data-lang="en" class="on">EN</button>
        <button data-lang="pt">PT</button>
      </div>
      <div class="toggle" id="theme-toggle" role="group" aria-label="Theme">
        <button data-theme-set="paper">Paper</button>
        <button data-theme-set="linen">Linen</button>
      </div>
      <a class="btn btn-primary sm" href="#download" data-i18n="nav_download">{en.nav_download}</a>
    </nav>
  </div>
</header>

<style>
  .topbar { position: sticky; top: 0; z-index: 50; backdrop-filter: blur(8px);
    background: color-mix(in srgb, var(--bg) 86%, transparent); border-bottom: 1px solid var(--line); }
  .bar { display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .brand { display: flex; align-items: center; gap: 9px; text-decoration: none; font-size: 18px; }
  .controls { display: flex; align-items: center; gap: 12px; }
  .toggle { display: inline-flex; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
  .toggle button { background: var(--surface); color: var(--subtext); border: 0; padding: 6px 12px;
    font-size: 12px; cursor: pointer; font-family: inherit; }
  .toggle button.on { background: var(--accent); color: #fff; }
  .btn.sm { padding: 7px 14px; font-size: 13px; }
  @media (max-width: 620px) { .brand span { display: none; } .controls { gap: 8px; } }
</style>

<script>
  function wire() {
    document.querySelectorAll('#theme-toggle button').forEach((b) => {
      b.addEventListener('click', () => {
        const t = b.getAttribute('data-theme-set');
        window.__setTheme(t);
        syncTheme(t);
      });
    });
    document.querySelectorAll('#lang-toggle button').forEach((b) => {
      b.addEventListener('click', () => {
        const l = b.getAttribute('data-lang');
        window.__setLang(l);
        syncLang(l);
      });
    });
    syncTheme(document.documentElement.getAttribute('data-theme'));
    syncLang(document.documentElement.getAttribute('lang'));
  }
  function syncTheme(t) {
    document.querySelectorAll('#theme-toggle button').forEach((b) =>
      b.classList.toggle('on', b.getAttribute('data-theme-set') === t));
  }
  function syncLang(l) {
    document.querySelectorAll('#lang-toggle button').forEach((b) =>
      b.classList.toggle('on', b.getAttribute('data-lang') === l));
  }
  wire();
</script>
```

- [ ] **Step 2: Write src/components/Hero.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
const base = import.meta.env.BASE_URL;
---
<section class="section hero">
  <div class="wrap inner">
    <p class="eyebrow">Galley</p>
    <h1 class="serif title">
      <span data-i18n="hero_title_a">{en.hero_title_a}</span><br />
      <em data-i18n="hero_title_b">{en.hero_title_b}</em>
    </h1>
    <p class="sub muted" data-i18n="hero_sub">{en.hero_sub}</p>
    <div class="cta">
      <a class="btn btn-primary" href="#download" data-i18n="nav_download">{en.nav_download}</a>
      <a class="btn btn-ghost" href="https://github.com/christiansmmc/galley-app" data-i18n="nav_github">{en.nav_github}</a>
    </div>
    <img class="shot heroshot" src={`${base}/01-hero.png`} alt="Galley reviewing a PR" />
  </div>
</section>

<style>
  .hero { padding-top: 64px; text-align: center; }
  .inner { display: flex; flex-direction: column; align-items: center; }
  .title { font-size: 52px; line-height: 1.08; margin: 16px 0 14px; font-weight: 400; }
  .title em { color: var(--accent); font-style: italic; }
  .sub { max-width: 520px; font-size: 18px; }
  .cta { display: flex; gap: 12px; margin: 26px 0 44px; flex-wrap: wrap; justify-content: center; }
  .heroshot { max-width: 920px; }
  @media (max-width: 760px) { .title { font-size: 36px; } .sub { font-size: 16px; } }
</style>
```

- [ ] **Step 3: Write src/components/Manifesto.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
---
<section class="section manifesto">
  <div class="wrap">
    <p class="serif line" data-i18n="manifesto_line">{en.manifesto_line}</p>
    <p class="muted sub" data-i18n="manifesto_sub">{en.manifesto_sub}</p>
  </div>
</section>

<style>
  .manifesto { background: var(--surface-2); text-align: center; }
  .line { font-size: 30px; font-style: italic; margin: 0 0 10px; }
  .sub { max-width: 540px; margin: 0 auto; }
</style>
```

- [ ] **Step 4: Write src/components/Features.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
const base = import.meta.env.BASE_URL;
const features = [
  { img: '03-palette.png', t: 'feat_palette_title', b: 'feat_palette_body' },
  { img: '04-settings.png', t: 'feat_diff_title', b: 'feat_diff_body' },
  { img: '05-first-run.png', t: 'feat_comments_title', b: 'feat_comments_body' },
  { img: '07-paper.png', t: 'feat_repos_title', b: 'feat_repos_body' },
];
---
<section class="section">
  <div class="wrap">
    <p class="eyebrow" data-i18n="features_eyebrow">{en.features_eyebrow}</p>
    <div class="rows">
      {features.map((f, i) => (
        <div class={`row ${i % 2 ? 'rev' : ''}`}>
          <div class="copy">
            <h3 class="serif" data-i18n={f.t}>{en[f.t]}</h3>
            <p class="muted" data-i18n={f.b}>{en[f.b]}</p>
          </div>
          <img class="shot" src={`${base}/${f.img}`} alt="" />
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .rows { display: flex; flex-direction: column; gap: 64px; margin-top: 28px; }
  .row { display: grid; grid-template-columns: 1fr 1.25fr; gap: 40px; align-items: center; }
  .row.rev { direction: rtl; }
  .row.rev > * { direction: ltr; }
  .copy h3 { font-size: 24px; font-weight: 400; margin: 0 0 10px; }
  @media (max-width: 760px) {
    .row, .row.rev { grid-template-columns: 1fr; direction: ltr; gap: 18px; }
  }
</style>
```

- [ ] **Step 5: Write src/components/Themes.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
const base = import.meta.env.BASE_URL;
---
<section class="section themes">
  <div class="wrap">
    <p class="eyebrow" data-i18n="themes_eyebrow">{en.themes_eyebrow}</p>
    <h2 class="serif title" data-i18n="themes_title">{en.themes_title}</h2>
    <p class="muted lead" data-i18n="themes_body">{en.themes_body}</p>
    <div class="grid">
      <figure>
        <img class="shot" src={`${base}/01-hero.png`} alt="Linen theme" />
        <figcaption class="muted" data-i18n="themes_linen">{en.themes_linen}</figcaption>
      </figure>
      <figure>
        <img class="shot" src={`${base}/07-paper.png`} alt="Paper theme" />
        <figcaption class="muted" data-i18n="themes_paper">{en.themes_paper}</figcaption>
      </figure>
    </div>
    <div class="swatches">
      <span style="background:var(--sage)"></span>
      <span style="background:var(--ochre)"></span>
      <span style="background:var(--ink)"></span>
      <span style="background:var(--rust)"></span>
    </div>
  </div>
</section>

<style>
  .themes { background: var(--surface-2); text-align: center; }
  .title { font-size: 30px; font-weight: 400; margin: 14px 0 12px; }
  .lead { max-width: 560px; margin: 0 auto 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  figure { margin: 0; }
  figcaption { margin-top: 10px; font-style: italic; font-family: 'Source Serif 4', serif; }
  .swatches { display: flex; gap: 12px; justify-content: center; margin-top: 28px; }
  .swatches span { width: 22px; height: 22px; border-radius: 999px; }
  @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 6: Write src/components/Download.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
---
<section class="section download" id="download">
  <div class="wrap">
    <p class="eyebrow" data-i18n="download_eyebrow">{en.download_eyebrow}</p>
    <h2 class="serif title" data-i18n="download_title">{en.download_title}</h2>
    <div id="dl-status" class="muted" data-i18n="download_loading">{en.download_loading}</div>
    <div id="dl-buttons" class="buttons"></div>
    <div id="dl-meta" class="muted meta"></div>
  </div>
</section>

<style>
  .download { text-align: center; }
  .title { font-size: 30px; font-weight: 400; margin: 14px 0 20px; }
  .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .meta { margin-top: 14px; font-size: 14px; }
  #dl-status:empty { display: none; }
</style>

<script>
  import { buildDownloads } from '../lib/releases';
  import { STRINGS } from '../lib/i18n';

  const REPO = 'christiansmmc/galley-app';
  const API = `https://api.github.com/repos/${REPO}/releases/latest`;
  const RELEASES_URL = `https://github.com/${REPO}/releases`;

  const statusEl = document.getElementById('dl-status');
  const btnEl = document.getElementById('dl-buttons');
  const metaEl = document.getElementById('dl-meta');

  function lang() {
    const l = document.documentElement.getAttribute('lang');
    return l === 'pt' ? 'pt' : 'en';
  }
  function t(key) { return STRINGS[lang()][key]; }

  function renderNone() {
    statusEl.textContent = t('download_none');
    btnEl.innerHTML = `<a class="btn btn-ghost" href="${RELEASES_URL}">${t('download_releases_link')}</a>`;
    metaEl.textContent = '';
  }

  async function load() {
    try {
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) return renderNone();
      const data = await res.json();
      const downloads = buildDownloads(data);
      if (downloads.length === 0) return renderNone();
      statusEl.textContent = '';
      btnEl.innerHTML = downloads
        .map((d) => `<a class="btn btn-primary" href="${d.url}">${d.label}</a>`)
        .join('');
      metaEl.dataset.version = data.tag_name;
      paintMeta();
    } catch (e) {
      renderNone();
    }
  }
  function paintMeta() {
    const v = metaEl.dataset.version;
    if (v) metaEl.textContent = `${t('download_version')} ${v} · ${t('footer_license')}`;
  }
  document.addEventListener('langchange', () => { paintMeta(); if (statusEl.textContent) statusEl.textContent = t('download_loading'); });
  load();
</script>
```

- [ ] **Step 7: Write src/components/Footer.astro**

```astro
---
import { STRINGS } from '../lib/i18n';
const en = STRINGS.en;
---
<footer class="footer">
  <div class="wrap inner">
    <p class="serif tagline" data-i18n="footer_tagline">{en.footer_tagline}</p>
    <nav class="links muted">
      <a href="https://github.com/christiansmmc/galley-app" data-i18n="footer_source">{en.footer_source}</a>
      <span data-i18n="footer_license">{en.footer_license}</span>
    </nav>
  </div>
</footer>

<style>
  .footer { border-top: 1px solid var(--line); padding: 40px 0; }
  .inner { display: flex; align-items: center; justify-content: space-between; }
  .tagline { font-style: italic; font-size: 18px; margin: 0; }
  .links { display: flex; gap: 18px; font-size: 14px; }
  @media (max-width: 620px) { .inner { flex-direction: column; gap: 14px; } }
</style>
```

- [ ] **Step 8: Replace src/pages/index.astro**

```astro
---
import Base from '../layouts/Base.astro';
import TopBar from '../components/TopBar.astro';
import Hero from '../components/Hero.astro';
import Manifesto from '../components/Manifesto.astro';
import Features from '../components/Features.astro';
import Themes from '../components/Themes.astro';
import Download from '../components/Download.astro';
import Footer from '../components/Footer.astro';
import { STRINGS } from '../lib/i18n';
---
<Base>
  <TopBar />
  <Hero />
  <Manifesto />
  <Features />
  <Themes />
  <Download />
  <Footer />
  <script is:inline set:html={`window.__STRINGS = ${JSON.stringify(STRINGS)};`}></script>
</Base>
```

- [ ] **Step 9: Type-check and build**

Run: `pnpm check && pnpm build`
Expected: no type errors; `dist/` produced; exit 0.

- [ ] **Step 10: Manual smoke test in preview**

Run: `pnpm preview`
Open the printed URL (e.g. `http://localhost:4321/galley-app/`). Verify:
- Page renders in Paper theme, English copy.
- Theme toggle switches Paper/Linen and persists on reload.
- Language toggle swaps all copy to PT and persists on reload.
- Download section shows the fallback "All releases" link (no release exists yet) — it must NOT stay stuck on "Checking…".
Stop preview with Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: build all page sections and compose the landing page"
```

---

### Task 10: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: withastro/action@v3
        with:
          package-manager: pnpm@latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages on push to master"
```

---

### Task 11: README and final verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

````markdown
# galley-app

Presentation site for **Galley** (a Linux desktop GitHub PR reviewer) + public
download host. The Galley source code lives in a separate private repo; this
public repo holds the marketing site (GitHub Pages) and the release binaries
(GitHub Releases).

- **Live site:** https://christiansmmc.github.io/galley-app/
- **Stack:** Astro (static) · GitHub Pages · Vitest

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:4321/galley-app/
pnpm test     # unit tests (i18n, theme, releases)
pnpm build    # static output -> dist/
```

## How downloads work

The Download section fetches `releases/latest` from this repo via the public
GitHub API (client-side) and renders one button per platform asset
(`.rpm`, `.deb`, `.msi`/`.exe`). If there is no release yet, it links to the
releases page.

## Publishing a new version

1. Build the Galley bundles in the private repo.
2. Create a GitHub Release on **this** repo and upload the `.rpm`, `.deb`, and
   `.msi` assets.
3. The site picks them up automatically on next load.

## Deploy

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds with
Astro and publishes to GitHub Pages. Enable Pages once in repo
**Settings → Pages → Source: GitHub Actions**.
````

- [ ] **Step 2: Run the full check suite one last time**

Run: `pnpm test && pnpm check && pnpm build`
Expected: tests pass, no type errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: project README"
```

- [ ] **Step 4: Create the public repo and push (requires gh auth)**

```bash
gh repo create galley-app --public --source . --remote origin --push
```

Expected: repo `christiansmmc/galley-app` created and `master` pushed.

- [ ] **Step 5: Post-push manual steps (tell the user)**

Tell the user to do these once in the GitHub UI:
1. **Settings → Pages → Source → GitHub Actions** (enables the deploy workflow's publish step).
2. Wait for the **Deploy to GitHub Pages** action to finish; the site appears at
   `https://christiansmmc.github.io/galley-app/`.
3. To enable downloads, create a **Release** on this repo and upload the
   `.rpm` / `.deb` / `.msi` assets.

---

## Self-Review Notes

- **Spec coverage:** one public repo (Task 10/11 README + gh create), Astro + base path (Task 1), screenshots (Task 2), i18n EN/PT toggle (Tasks 3, 8, 9), Paper/Linen theme toggle (Tasks 4, 7, 8, 9), all six sections (Task 9), dynamic latest-release download with fallback (Tasks 5, 9 Download.astro), Pages deploy (Task 10) — all covered.
- **`04-settings.png` / `05-first-run.png`:** used as Feature-row images in Task 9, matching the spec's "optional supporting images" note.
- **Type consistency:** `Release`/`ReleaseAsset`/`Download`/`Platform`/`categorizeAsset`/`buildDownloads` are defined in Task 5 and consumed unchanged in Task 9's Download.astro. `window.__setTheme`/`__setLang`/`__STRINGS` defined in Task 8/9 and consumed in TopBar/Download.
- **No placeholders:** every step ships complete code or an exact command.
