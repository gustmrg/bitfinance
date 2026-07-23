# BitFinance frontend v2

The redesigned BitFinance client. It uses typed services under `src/api`, keeps
server data in TanStack Query, and persists only the selected organization in
Zustand. The existing `apps/frontend` remains the production frontend.

## Run locally

```bash
cd apps/frontend-v2
pnpm install --frozen-lockfile
cp .env.development.example .env.local
pnpm dev
```

The Vite server uses port `5174`. The backend must allow that origin with
credentials. Health is requested from `/health`, not `/api/v1/health`.

## Checks

```bash
pnpm lint
pnpm format:check
pnpm build
```

## Design notes

The redesign is a “modern finance desk”: Ledger Ink, Paper, Cobalt, Mint, Amber, and Coral create a calm but legible finance workspace. Space Grotesk gives headings a deliberate voice, Figtree keeps interface copy warm, and IBM Plex Mono makes dates and amounts scan like instruments. The cash-flow timeline is the signature interaction: upcoming bills and recent expenses share one horizontal horizon.

The app includes English and Brazilian Portuguese copy, responsive desktop/mobile
navigation, light/dark tokens, accessible focus states, reduced-motion handling,
server-backed CRUD, uploads/downloads, and explicit loading/empty/error states.

The compiler is pinned to TypeScript 5.9.3 because the current TypeScript ESLint parser does not yet load the registry’s TypeScript 7 release; the rest of the verified tooling uses its current stable line.

## Deployment

Frontend v2 is released independently at
`https://bitfinance-v2.gustavomiranda.dev` while the existing frontend remains
live. See [`docs/deployment.md`](docs/deployment.md) for the release workflow,
VPS, Nginx, TLS, and verification steps.

## Backend mapping

See [`docs/backend-endpoints.md`](docs/backend-endpoints.md) for the 39-route
client mapping ledger and contract boundaries.
