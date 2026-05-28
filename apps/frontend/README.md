<p align="center">
  <img src="public/assets/app-icon.png" alt="BitFinance app icon" height="100">
</p>

# BitFinance

![React Version](https://img.shields.io/badge/React-18-61DAFB?logo=react)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

BitFinance is a finance platform for tracking bills, expenses, organizations, and financial activity. This package contains the web application.

## Features

- Track bills and expenses by organization
- View dashboard summaries for upcoming bills and recent expenses
- Create, join, and manage organizations
- Invite organization members
- Upload and manage bill or expense documents
- Manage account profile and avatar settings
- Support authenticated sessions with refresh-token based API integration
- Provide installable PWA assets through Vite PWA

## Tech Stack

- **React 18** for the user interface
- **TypeScript** for static typing
- **Vite** for local development and production builds
- **React Router** for client-side routing
- **TanStack Query** for server state
- **Zustand** for shared auth and organization state
- **Axios** for API requests
- **Tailwind CSS** and **Radix UI** for styling and primitives
- **react-i18next** for internationalization
- **vite-plugin-pwa** for PWA manifest and assets

## Getting Started

### Prerequisites

- Node.js 22 or newer is recommended
- pnpm
- A running BitFinance backend API

### Installation

1. Install dependencies from this directory.

   ```bash
   pnpm install
   ```

2. Create a local environment file.

   ```bash
   cp .env.development.example .env.local
   ```

3. Start the development server.

   ```bash
   pnpm dev
   ```

The app runs at `http://localhost:3000` and expects the backend API at `http://localhost:8080/api/v1` by default.

## Environment Variables

Vite only exposes variables prefixed with `VITE_` to the browser.

| Variable | Description | Local default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL for the BitFinance API | `http://localhost:8080/api/v1` |

Environment templates are included for common modes:

- `.env.example` for a generic template
- `.env.development.example` for local development
- `.env.production.example` for production builds

Use `.env.local` for personal overrides. Do not commit real `.env` files.

## Available Scripts

```bash
pnpm dev       # Start the Vite development server
pnpm build     # Type-check and create a production build
pnpm lint      # Run ESLint
pnpm preview   # Preview the production build locally
```

## API Organization

API modules are organized by feature under `src/api`.

```text
src/api/
  account/
  auth/
  bills/
  dashboard/
  expenses/
  organizations/
  shared/
```

Conventions:

- Import API clients from feature barrels such as `@/api/auth`, `@/api/bills`, and `@/api/expenses`.
- Use `camelCase + Async` for service methods, for example `billsService.listAsync`.
- Keep HTTP concerns inside service files.
- Keep shared API error normalization in `src/api/shared`.
- API error toasts are handled globally through Axios interceptors.

## Routing

Routes are defined in `src/routes.tsx`.

Main routes include:

- `/` for the public home page
- `/auth/sign-in` and `/auth/sign-up` for authentication
- `/dashboard` for the authenticated dashboard
- `/dashboard/bills` and `/dashboard/bills/:billId`
- `/dashboard/expenses` and `/dashboard/expenses/:expenseId`
- `/account/settings`, `/account/more`, and `/account/organization`
- `/account/create-organization`
- `/join-organization`

Authenticated pages are wrapped with `ProtectedRoute`.

## Build and Deployment

Create a production build with:

```bash
pnpm build
```

Production builds use `VITE_API_URL=/api/v1` by default, which supports same-origin API routing behind a reverse proxy.

The included `Dockerfile` builds the Vite app and serves the generated `dist` directory on port `3000`.

Deployment automation lives in `.github/workflows/frontend-deploy.yml` and runs on pushes to `main`.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
