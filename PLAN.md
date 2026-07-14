# Theme Switching And Members/Roles Integration Plan

## Summary

Implement local theme switching and full-stack organization member/role management in phases. Theme switching is frontend-only with `light`, `dark`, and `system` modes. Member management moves to `/organization/members` and requires backend support for returning roles, updating roles, and removing members.

## Phase 1: Theme Foundation

- [x] Mount `next-themes` `ThemeProvider` at the app root with class-based dark mode, `defaultTheme="system"`, `enableSystem`, and `storageKey="bitfinance-theme"`.
- [x] Replace the direct `sonner` import in `App` with the existing themed `components/ui/sonner` wrapper.
- [x] Add shared theme option constants/types for `light`, `dark`, and `system`.
- [x] Add theme labels to English and Portuguese locale files.
- [x] Verify dark mode applies through existing Tailwind `.dark` variables and fix touched chrome surfaces that are missing dark styles.

## Phase 2: Theme Controls

- [x] Add a theme selector to Account Preferences next to the existing language selector.
- [x] Add a quick theme submenu/radio group to the user dropdown.
- [x] Use `useTheme()` from `next-themes`; no backend persistence or user-settings API changes.
- [x] Ensure both controls reflect the same current selection and update immediately.
- [x] Verify persistence across page refreshes and system-theme changes.

## Phase 3: Backend Member Role Contract

- [x] Add an `OrganizationMemberResponse` model with `id`, `username`, `email`, `role`, and `joinedAt`.
- [x] Update `GET /api/v1/organizations/{organizationId}` to return member role data instead of plain `UserResponseModel`.
- [x] Add `PATCH /api/v1/organizations/{organizationId}/members/{userId}/role` with `{ role }`.
- [x] Add `DELETE /api/v1/organizations/{organizationId}/members/{userId}`.
- [x] Enforce policy:
  - Owners can manage admins and members.
  - Admins can invite and remove members only.
  - No one can invite an owner.
  - The last owner cannot be demoted or removed.
- [x] No migration is needed for roles because `organization_members.role` already exists.

## Phase 4: Frontend API And State

- [x] Update organization types so members require `role` and include `joinedAt`.
- [x] Remove `Owner` from invite role options; expose `Admin`/`Member` for owners and `Member` only for admins.
- [x] Add organization service methods for role update and member removal.
- [x] Add TanStack mutations for role update/removal.
- [x] Invalidate organization detail, organization list, and `auth.me` after membership changes.
- [x] Handle losing access to the currently selected organization after member removal by relying on refreshed `auth.me` and existing selected-organization reconciliation.

## Phase 5: Dedicated Members And Roles Page

- [x] Add protected route `/organization/members` under the dashboard layout.
- [x] Add a desktop sidebar item labeled `Members & roles` through `layouts/app-navigation.ts`.
- [x] Add matching breadcrumb and locale strings.
- [x] Move member management out of `/account/organization`; keep organization settings focused on name, budget, and overview.
- [x] Build the new page with:
  - [x] selected-organization empty state,
  - [x] loading/unavailable states,
  - [x] current members table/list,
  - [x] invite member action,
  - [x] role-change dialog or inline select,
  - [x] remove-member confirmation.
- [x] Disable or hide actions based on current user role and backend policy.

## Phase 6: Cleanup And Verification

- [x] Remove the old role-management placeholder alert from the organization settings page.
- [x] Update More page and organization switcher links only if they still describe organization member management incorrectly.
- [x] Keep invite creation and join flow behavior intact.
- [x] Ensure mobile layouts remain usable, especially member rows, dialogs, and bottom navigation.

## Test Plan

- Backend:
  - Add tests for member role response mapping.
  - Add tests for owner role updates, admin limitations, member removal, and last-owner protection.
  - Run `dotnet build apps/backend/BitFinance.sln`.
  - Run `dotnet test apps/backend/BitFinance.sln` after adding tests.
- Frontend:
  - Run `pnpm lint` from `apps/frontend`.
  - Run `pnpm build` from `apps/frontend`.
  - Manually verify theme switching from Account Preferences and user menu.
  - Manually verify `/organization/members` navigation, active sidebar state, member list rendering, invite roles, role updates, and member removal states.

## Assumptions

- Theme preference is local-only.
- The dedicated member-management route is `/organization/members`.
- Pending invitation listing and revocation are out of scope.
- Multiple owners are allowed, but at least one owner must always remain.
