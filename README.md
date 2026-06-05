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
