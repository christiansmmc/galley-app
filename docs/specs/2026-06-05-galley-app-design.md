# Galley — Presentation Site (`galley-app`)

**Date:** 2026-06-05
**Status:** Approved design — ready for implementation plan
**Location:** `~/projects/galley-app` → public repo `christiansmmc/galley-app`

## Purpose

A clean, modern, single-page marketing/landing site to present **Galley** (a Linux
desktop GitHub PR reviewer) and let visitors download the app. The site mirrors
Galley's own visual language (Paper editorial light theme, Source Serif headlines,
sage accent, restraint — no SaaS dashboard energy).

## Constraints & key decisions

| Decision | Choice | Why |
|---|---|---|
| Source code repo | `christiansmmc/galley` stays **private** | User wants code closed |
| Public artifacts | **One public repo** `christiansmmc/galley-app` holds the **site (Pages)** + **binaries (Releases)** | Single place for everything public; site fetches its own releases |
| Hosting | **GitHub Pages** (project site) | Free for public repos, no extra platform, no server needed |
| Stack | **Astro** (static) + light JS islands | Fastest clean landing, ~zero JS by default, trivial Pages deploy, can use React if needed |
| Deploy | GitHub Action → Pages on push to `master` | Standard Astro Pages workflow |
| Languages | **Bilingual EN/PT**, client-side toggle | Mirrors the app (EN + PT-BR) |
| Themes | **Paper (light) default + Linen (dark) toggle** | Mirrors the app's two themes |
| Download targets | Linux **.rpm**, Linux **.deb**, Windows **.msi/.exe** | Per user; macOS out of scope for now |

### Out of scope (YAGNI)
- No analytics, no backend/serverless, no cookie banner.
- No automatic changelog page.
- No macOS download (no build/tests yet).
- No custom domain initially (URL = `christiansmmc.github.io/galley-app/`); can add later.

## Astro config essentials

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://christiansmmc.github.io',
  base: '/galley-app',
});
```

All internal asset links must respect `base` (use `import.meta.env.BASE_URL` or Astro's
asset handling) so they resolve under the `/galley-app/` subpath on Pages.

## Visual language

- **Palette (from Galley `globals.css`):**
  - Paper (light, default): bg `#FAF7F0`, surface `#FFFFFF`, surface2 `#EDE9DF`,
    text `#2A2723`, subtext `#6B6358`, accent sage `#5E7556`.
  - Linen (dark, toggle): bg `#222226`, surface `#2A2A2F`, surface2 `#313137`,
    text `#DCD8CF`, subtext `#8E887D`, accent sage `#8FA888`.
  - Accent swatches (for the Themes section): sage / ochre / ink / rust, per-theme
    values from `globals.css` lines 78–85.
- **Type:** Source Serif 4 for headlines and the italic voice lines; system sans
  (or Inter) for body. Serif used sparingly, as in the app.
- **Feel:** warm, airy, centered, hairline borders (`#EDE9DF`), generous whitespace,
  small monospace eyebrow labels. No gradients, no shadows-heavy cards, no chips.

## Interactivity

Two toggles, top-right of the page, both persisted to `localStorage`:

1. **Theme toggle** — Paper ⇄ Linen. Sets `data-theme` on `<html>`; CSS variables
   swap accordingly. Initial value: stored preference, else `prefers-color-scheme`.
2. **Language toggle** — EN ⇄ PT. A strings dictionary (`{ en: {...}, pt: {...} }`)
   swaps text content client-side. Single page, **no routing**. Initial value:
   stored preference, else `navigator.language` (PT if `pt*`, else EN). Update
   `<html lang>` accordingly.

Both are progressive: page renders fully in the default (Paper / EN or detected)
even with JS disabled; toggles enhance.

## Page structure (single-page scroll)

1. **Hero** — serif headline + short subhead, primary **Download** button (scrolls to
   download section) + **GitHub** link (to the *public* repo), `01-hero.png` screenshot.
   Toggles live in a thin top bar above/within the hero.
2. **Manifesto band** — short centered italic-serif line *"Reading. No summaries."*
   with one supporting sentence (no AI, no summaries, no chips).
3. **Features (alternating text/image)** — 3–4 blocks alternating sides:
   - Side-by-side / inline diff (Monaco-based).
   - Inline comments + local-first drafts (SQLite, never round-trips until submit).
   - Command palette `Ctrl+K` — screenshot `03-palette.png`.
   - Multi-repo PR list (grouped, fuzzy, author names hidden by default).
4. **Themes** — Linen (`01-hero.png`) vs Paper (`07-paper.png`) side by side, plus the
   four accent swatches; one line on EN/PT + density.
5. **Download** — see Download logic below. Buttons per platform + version label.
6. **Footer** — GitHub link · MIT license · an italic-serif voice line.

`04-settings.png` and `05-first-run.png` are available as optional supporting images
(e.g. a small secondary spot in Features or Themes) — kept lean; primary images are
`01-hero`, `03-palette`, `07-paper`.

## Download logic (latest release)

Client-side, on the Download section:

1. Fetch `https://api.github.com/repos/christiansmmc/galley-app/releases/latest`.
2. From `assets[]`, match by filename extension:
   - `.rpm` → "Linux (Fedora/Nobara)"
   - `.deb` → "Linux (Ubuntu/Debian)"
   - `.msi` or `.exe` → "Windows"
3. Render a button per matched asset using its `browser_download_url`; show
   `tag_name` (version) and `published_at` date.
4. **Fallbacks:**
   - If a platform asset is missing, show a disabled/secondary state or hide it.
   - If the API call fails, or there is **no release yet** (404), show a single
     button linking to `https://github.com/christiansmmc/galley-app/releases` and a
     short "no release yet" note.
   - Cache-friendly: no auth header (public repo, unauthenticated API is fine for
     low traffic; rate limit 60/h per IP is acceptable for a landing page).

## Assets

Copy from `pr-reviewer/screenshots/` into the site `public/`:
`01-hero.png`, `03-palette.png`, `04-settings.png`, `05-first-run.png`,
`07-paper.png`, `icon-512.png`. Use `icon-512.png` as the favicon/logo.

## Repository layout (proposed)

```
galley-app/
  astro.config.mjs
  package.json
  public/                 # screenshots, favicon, icon
  src/
    pages/index.astro      # the single page
    components/            # Hero, Manifesto, Features, Themes, Download, Footer, Toggles
    i18n/strings.ts        # { en, pt } dictionary
    styles/theme.css       # CSS variables for paper/linen + tokens
  .github/workflows/deploy.yml   # Astro → GitHub Pages
  docs/specs/2026-06-05-galley-app-design.md
```

## Testing / acceptance

- `pnpm build` (astro) succeeds; output is static.
- Page renders correctly at the `/galley-app/` base path (all asset links resolve).
- Theme toggle persists and respects `prefers-color-scheme` on first load.
- Language toggle swaps all visible copy and persists.
- Download section: renders real buttons when a release exists; graceful fallback
  to the releases page when none exists or the API errors.
- Responsive: hero, features, and theme split collapse cleanly on mobile widths.
- Deploy workflow publishes to Pages on push to `master`.

## Open follow-ups (post-launch, not blocking)

- Optional custom domain (`galley.dev` or similar) → adjust `base`/`site`.
- Decide the actual release-publishing flow into `galley-app` (manual upload vs a
  script that copies bundles from the private repo's build).
