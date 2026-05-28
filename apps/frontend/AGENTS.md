# AGENTS.md - Coding Guidelines for BitFinance Frontend

## Project Overview

React + TypeScript + Vite finance dashboard app with:
- TanStack Query for server state
- Zustand for shared client auth/organization state
- Tailwind CSS + Radix UI for UI
- `react-i18next` with locale files in `public/locales`

## Build/Development Commands

```bash
# Development server
npm run dev

# Type check + production build
npm run build

# ESLint linting
npm run lint

# Preview production build locally
npm run preview

# Install dependencies
npm install
```

## Code Style Guidelines

### TypeScript Configuration

- **Target**: ES2020, strict mode enabled
- **Path alias**: use `@/` for imports from `src/`
- **No unused locals/parameters**: clean up unused code
- **No fallthrough in switch**: explicit breaks required

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from "react";

// 2. External libraries
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// 3. Internal aliases (@/)
import { authService } from "@/api/auth";
import { Button } from "@/components/ui/button";

// 4. Relative imports
import { SomeComponent } from "./some-component";
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`, `Dashboard.tsx`)
- **Files/Folders**: kebab-case (`use-breadcrumbs.ts`, `auth-provider.tsx`, `auth-store.ts`)
- **Functions**: camelCase (`fetchUserData`, `handleSubmit`)
- **Interfaces/Types**: PascalCase (`SignInResponse`, `User`, `AuthClientState`)
- **Hooks**: `use*` prefix (`useLoginAction`, `useSelectedOrganization`)
- **API Methods**: `camelCase + Async` (`signInAsync`, `listAsync`)

### Component Structure

```typescript
export function ComponentName() {
  return <div>...</div>;
}
```

### Styling with Tailwind

- Use `cn()` from `@/lib/utils` for class merging
- Follow mobile-first responsive design
- Use `dark:` styles when needed
- Prefer Tailwind utilities over custom CSS

## Architecture Guidelines

### State Management

- **Server state**: TanStack Query (`src/hooks/queries`, `src/hooks/mutations`)
- **Shared client state**: Zustand auth store in `src/auth/auth-store.ts`
- **Local UI state**: component-level `useState`
- Do **not** reintroduce a monolithic auth context (`useAuth()` was removed)

### Authentication

- `AuthProvider` in `src/auth/auth-provider.tsx` is a bootstrap/controller layer (session restore, refresh-failure handling, org consistency)
- Prefer selector/action hooks from `@/auth/auth-provider`:
  - `useIsAuthenticated`
  - `useAuthInitialization`
  - `useCurrentUser`
  - `useSelectedOrganization`
  - `useSelectedOrganizationId`
  - `useSetSelectedOrganizationId`
  - `useLoginAction`
  - `useRegisterAction`
  - `useLogoutAction`
  - `useGetMeAction`
- `selectedOrganizationId` is persisted (`bitfinance-auth` storage key)
- Access token for Axios interceptors is mirrored via `@/lib/auth-token`

### API Patterns

- API modules are feature-based:
  - `@/api/auth`
  - `@/api/bills`
  - `@/api/expenses`
- Keep HTTP concerns in service files under `src/api/*`
- Normalize API errors via `src/api/shared/normalize-error.ts`
- Use `api` for public endpoints and `authApi`/`privateAPI()` for authenticated endpoints

### Error Handling

- Use `logger` from `@/lib/logger` for development diagnostics
- API error toasts are global in Axios interceptors (`src/lib/axios.ts`)
- Avoid duplicate page-level API error toasts unless intentionally overriding UX
- `Toaster` is mounted once at app level in `src/app.tsx`

### Routing

- Routes are defined in `src/routes.tsx`
- Protected pages use `<ProtectedRoute>`
- Page components live in `src/pages/{feature}/`

### Internationalization (i18n)

- Use `useTranslation()` from `react-i18next`
- i18n runtime config: `src/i18n/config.js`
- Translation files: `public/locales/{lng}/translation.json`

### File Organization

```text
src/
├── api/           # API calls by feature + shared error normalization
├── auth/          # Zustand auth store + auth provider hooks/bootstrap
├── components/    # Reusable components
│   └── ui/        # Radix UI-based primitives
├── hooks/         # Query/mutation and utility hooks
├── layouts/       # Route/layout wrappers
├── lib/           # Axios, auth-token, logger, query client, utils
├── pages/         # Page components by feature
├── i18n/          # i18n setup
└── utils/         # Helper functions
```

## ESLint Rules

- React Hooks rules enforced
- React Refresh restrictions enforced
- TypeScript recommended rules enabled
- `npm run build` runs type-check before build

## Quick Reference

- **Dev server**: `npm run dev` (Vite default: http://localhost:5173)
- **Build**: `npm run build`
- **Path alias**: `@/` maps to `src/`
- **Tailwind config**: `tailwind.config.js`
- **Environment vars**: use `import.meta.env.VITE_*`
