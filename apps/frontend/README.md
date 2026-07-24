# BitFinance frontend

The BitFinance web client is a React 19, TypeScript, and Vite application. It
uses typed services under `src/api`, TanStack Query for server state, and
Zustand for the selected organization preference.

Production is served from `https://bitfinance.gustavomiranda.dev`. API and
health requests use same-origin `/api/v1` and `/health` routes.

## Run locally

```bash
cd apps/frontend
pnpm install --frozen-lockfile
cp .env.development.example .env.local
pnpm dev
```

The Vite server uses port `5174`. The backend must allow that origin with
credentials.

## Checks

```bash
pnpm format:check
pnpm lint
pnpm build
```

There is currently no automated frontend test suite. Pull request and release
validation both run the checks above.

## PWA

`vite-plugin-pwa` generates `manifest.webmanifest` and a root-scoped `sw.js`.
The worker automatically updates, precaches the application shell and
revisioned static assets, and removes outdated Workbox caches. API, identity,
health, and upload responses are not runtime-cached. The manifest supports both
portrait and landscape orientation.

PWA assets are generated from `public/favicon.svg`:

```bash
pnpm generate:pwa-assets
```

After a production build, verify the generated files and installability in
browser developer tools. Also test offline shell loading, an API-dependent
screen's connection error, a direct refresh on a nested route, desktop install,
iPhone Home Screen install, and an update from the previous deployed worker.

## Design notes

The interface is a modern finance desk. Ledger Ink, Paper, Cobalt, Mint, Amber,
and Coral create a calm finance workspace. Space Grotesk gives headings a
deliberate voice, Figtree keeps interface copy warm, and IBM Plex Mono makes
dates and amounts easy to scan.

The app includes English and Brazilian Portuguese copy, responsive
desktop/mobile navigation, light and dark themes, accessible focus states,
reduced-motion handling, server-backed CRUD, uploads/downloads, and explicit
loading, empty, offline, and error states.

## Deployment

Releases use immutable versioned directories and an atomic `current` symlink.
See [`docs/deployment.md`](docs/deployment.md) for initial server migration,
release, cutover, redirect, verification, and rollback procedures.
