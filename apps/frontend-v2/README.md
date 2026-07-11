# BitFinance frontend v2

An independent, interactive design prototype for BitFinance’s complete product surface. It is intentionally sibling-only: the existing `apps/frontend` remains the production frontend and this app never calls the backend.

## Run locally

```bash
cd apps/frontend-v2
pnpm install
pnpm dev
```

The Vite server uses port `5174`. Any email-shaped value and a password with at least four characters will enter the demo. Mock mutations update the current browser session and reset to the seed data after refresh.

## Checks

```bash
pnpm lint
pnpm test
pnpm build
```

## Design notes

The redesign is a “modern finance desk”: Ledger Ink, Paper, Cobalt, Mint, Amber, and Coral create a calm but legible finance workspace. Space Grotesk gives headings a deliberate voice, Figtree keeps interface copy warm, and IBM Plex Mono makes dates and amounts scan like instruments. The cash-flow timeline is the signature interaction: upcoming bills and recent expenses share one horizontal horizon.

The app includes English and Brazilian Portuguese copy, responsive desktop/mobile navigation, light/dark tokens, accessible focus states, reduced-motion handling, local CRUD-like interactions, and explicit empty/error states.

The compiler is pinned to TypeScript 5.9.3 because the current TypeScript ESLint parser does not yet load the registry’s TypeScript 7 release; the rest of the verified tooling uses its current stable line.

## Backend mapping

See [`docs/backend-endpoints.md`](docs/backend-endpoints.md) for the route catalog derived from the current controllers and the prototype behavior associated with each endpoint family.
