# Org Management And Invite Flow Plan

## Goal

Prioritize frontend integration for organization management and invitation flows using the backend already implemented in `bitfinance-backend`.

## Product Decisions

- Organization management should include role management.
- Invitation links can use a simple token-processing page for the first pass.
- After joining a new organization, the frontend should automatically switch to it.

## Backend Endpoints In Scope

### Organizations

- `GET /api/v1/organizations`
- `GET /api/v1/organizations/{organizationId}`
- `POST /api/v1/organizations`
- `PATCH /api/v1/organizations/{organizationId}`
- `POST /api/v1/organizations/{organizationId}/invite`
- `POST /api/v1/organizations/join?token=...`

### Related Auth

- `GET /api/v1/identity/me`
- `POST /api/v1/identity/login`
- `POST /api/v1/identity/register`
- `POST /api/v1/identity/refresh`

## Current Frontend State

### Already implemented

- Auth bootstrap and session restore
- Organization selection from `me.organizations`
- Create organization page
- Protected routing and selected organization persistence
- Organization management page and invite flow
- Invitation join flow with auth resume and auto-switch
- Bills contract cleanup, details, and attachment flows
- Expenses contract cleanup, details, and attachment flows
- Account security and avatar frontend flows with placeholder avatar support

### Missing frontend integration

- Organization list fetch from `/organizations`
- Organization detail fetch
- Organization update flow
- Organization members view
- Invitation creation flow
- Invitation acceptance and join flow
- Auth-aware invitation entry flow
- Role management UI

## Backend Gap For Role Management

Full member role editing is not yet possible with the currently exposed backend API.

- `GET /organizations/{organizationId}` returns members with `id`, `username`, and `email`, but no role.
- There is no endpoint to update an existing member's role.
- `POST /organizations/{organizationId}/invite` does accept a role, so role selection can be supported for invitations.

Frontend work should therefore be split into two parts.

- Phase 1 supports role-aware invitations and prepares organization role types.
- A later phase can add member role editing once the backend exposes member role data and a role update endpoint.

## Priority Order

1. Organization services and types
2. Organization management page
3. Invite member flow
4. Join organization flow
5. Auth redirect improvements
6. Navigation and empty states
7. Cleanup and contract verification

## Phase 1: Service Layer

Status: Done

Create a dedicated `src/api/organizations/` feature module to match current API organization conventions.

### Add

- `organizations.service.ts`
- `organizations.types.ts`
- `index.ts`

### Service methods

- `listAsync()`
- `getAsync(organizationId)`
- `createAsync(request)`
- `updateAsync(request)`
- `createInviteAsync(request)`
- `joinAsync(token)`

### Types

- `OrganizationSummary`
- `OrganizationDetails`
- `OrganizationMember`
- `OrganizationRole`
- `CreateOrganizationRequest`
- `UpdateOrganizationRequest`
- `CreateInvitationRequest`
- `CreateInvitationResponse`

### Phase 1 implementation notes

- Keep role values frontend-friendly and map them to the backend shape in the service layer.
- Replace the one-off `create-organization.ts` helper with the new organizations module.
- Keep current create organization UI working with the new module before moving to later phases.

## Phase 2: Query And Mutation Hooks

Status: Done

Add TanStack Query hooks for organization management.

### Queries

- `use-organizations-query.ts`
- `use-organization-query.ts`

### Mutations

- `use-organization-mutations.ts`

### Query invalidation

Invalidate the following when organization state changes.

- `auth.me`
- organization lists
- organization detail
- any views dependent on current organization selection

## Phase 3: Organization Management UI

Status: Done

Create a management page for the selected organization.

### Recommended route

- `/account/organization`

### Page responsibilities

- Show organization name
- Show members list
- Allow renaming organization
- Allow inviting a member
- Show invite result or copyable join token and link
- Reserve a role management section for current members once the backend exposes that capability

### Likely components

- `organization-settings-form.tsx`
- `organization-members-list.tsx`
- `invite-member-dialog.tsx`

## Phase 4: Invite Flow

Status: Done

Use backend `POST /organizations/{organizationId}/invite`.

### UI

- Dialog or form from organization management page
- Inputs for email and role
- Success state with generated join link and expiration info

### UX

- Provide copy action for token and full join link
- Keep the first pass simple and token-driven

## Phase 5: Join Flow

Status: Done

Create an invitation join route.

### Recommended route

- `/join-organization`

### Behavior

- Read `token` from the query string
- If authenticated, call `joinAsync(token)`
- Refresh `me`
- Automatically switch the selected organization to the newly joined organization
- Navigate to the dashboard after success
- If unauthenticated, redirect to sign-in with a preserved `returnUrl`
- After auth, resume the join flow automatically

### Components and pages

- `src/pages/organizations/join.tsx`

## Phase 6: Auth Redirect Improvements

Status: Done

Current sign-in redirects directly to `/dashboard`.

### Update behavior

- Respect `returnUrl` after sign-in and sign-up
- Support invitation join resume after auth
- If an authenticated user has zero organizations, redirect to `account/create-organization`

## Phase 7: Navigation Updates

Status: Done

Expose organization management in the app.

### Options

- Add `Organization` under the account section
- Keep `Create Organization` in the More page
- Optionally add a quick path from the organization switcher when there are no organizations

## Phase 8: Existing Member Role Management

Status: Blocked by backend

Complete role management for existing members once the backend exposes the missing capabilities.

### Backend requirements

- Include member roles in `GET /organizations/{organizationId}`
- Add an endpoint to update a member role within an organization

### Frontend work

- Replace the current role-management placeholder in the members list
- Show each member's current role
- Add inline or dialog-based role editing
- Refresh organization detail after role changes

## Phase 9: Account Security And Avatar Management

Status: Frontend implemented, backend follow-up pending

Integrate the remaining implemented identity endpoints that are still not surfaced in the frontend.

### Endpoints

- `POST /api/v1/identity/manage/avatar`
- `DELETE /api/v1/identity/manage/avatar`
- `POST /api/v1/identity/logout-all`

### Frontend work

- Add avatar upload and remove actions in account settings
- Replace placeholder avatar handling in nav and account surfaces
- Add a `log out all devices` action in account settings or More

### Current result

- Frontend account security and avatar UI is implemented
- Avatar upload, remove, and `logout-all` actions are wired
- Navigation surfaces use `avatarUrl` when available and fall back to a placeholder image for now
- Full avatar rendering still depends on the backend returning `avatarUrl` from `GET /identity/me`

## Phase 10: Dashboard Summary Integration

Status: Blocked by backend summary endpoint

Replace the remaining mocked dashboard summary cards with backend-backed data.

### Backend requirement

- Add a summary endpoint for dashboard totals and budget metrics

### Frontend work

- Remove mocked summary values from the dashboard page
- Add summary query hooks and API module
- Keep upcoming bills and recent expenses as separate queries unless the backend consolidates them

## Phase 11: Final Backend Parity Review

Status: Pending

Do one final parity pass after the phases above are complete.

### Review checklist

- Verify every implemented backend endpoint is either integrated or intentionally unused
- Re-check request and response type alignment
- Re-check route coverage and empty states
- Re-check auth redirects and organization switching behavior
- Re-check bundle size impact of the added flows

## Refactors Needed

- `src/routes.tsx`
- `src/layouts/app-navigation.ts`
- `src/pages/account/more.tsx`
- `src/auth/auth-provider.tsx`
- `src/components/organization-switcher.tsx`

These routes and shared auth flows will need small refactors to support organization settings, invitation entry, and auto-switch behavior after join.

Additional files will be touched in later phases for avatar management, existing-member role editing, and dashboard summary integration.

## Acceptance Criteria

- User can open organization settings for the selected organization
- User can rename an organization
- User can view organization members
- User can create an invite with a selected role and copy a join link
- Authenticated user can join an organization from an invite token
- Unauthenticated user can sign in and resume joining from an invite token
- After a successful join, the frontend automatically switches to the new organization
- `me` data refreshes after organization creation or join
- Selected organization remains consistent after joins and switches

## Out Of Scope For This Pass

- Existing-member role editing until backend support is available
- Dashboard summary metrics until the backend exposes a summary endpoint

## Suggested Implementation Sequence

1. Add `src/api/organizations/*`
2. Add organization query and mutation hooks
3. Add `/account/organization` route and page
4. Add invite dialog and members list
5. Add `/join-organization` route and token flow
6. Update auth redirect handling
7. Update navigation and zero-org states
8. Verify end-to-end with the local backend

## Follow-Up Phases

The following phases should be completed to reach fuller backend parity after the organization workflow foundation is in place.

1. Phase 8: existing member role management
2. Phase 9: account security and avatar management
3. Phase 10: dashboard summary integration
4. Phase 11: final backend parity review
