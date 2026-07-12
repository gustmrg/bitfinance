# Backend endpoint coverage

The frontend-v2 client is backed by typed Axios services, TanStack Query consumers,
and MSW contract tests. All organization-scoped query keys include the selected
organization ID. `VITE_API_URL` points to `/api/v1`; health remains at the origin
root `/health`.

| # | Method | Route | Client | Consumer | Status |
| ---: | --- | --- | --- | --- | --- |
| 1 | GET | `/health` | `healthService.getAsync` | API status badge | MSW covered |
| 2 | POST | `/identity/register` | `authService.registerAsync` | sign-up and session bootstrap | MSW covered |
| 3 | POST | `/identity/login` | `authService.loginAsync` | sign-in and return URL | MSW covered |
| 4 | POST | `/identity/refresh` | `authService.refreshAsync` | startup and single-flight retry | MSW covered |
| 5 | POST | `/identity/logout` | `authService.logoutAsync` | current-session sign-out | MSW covered |
| 6 | POST | `/identity/logout-all` | `authService.logoutAllAsync` | confirmed all-device sign-out | MSW covered |
| 7 | GET | `/identity/me` | `authService.getMeAsync` | canonical user/org bootstrap | MSW covered |
| 8 | POST | `/identity/manage/profile` | `accountService.updateProfileAsync` | account profile form | MSW covered |
| 9 | POST | `/identity/manage/avatar` | `accountService.uploadAvatarAsync` | validated avatar picker | MSW covered |
| 10 | DELETE | `/identity/manage/avatar` | `accountService.deleteAvatarAsync` | confirmed avatar removal | MSW covered |
| 11 | GET | `/organizations` | `organizationsService.listAsync` | organization switcher | MSW covered |
| 12 | GET | `/organizations/{organizationId}` | `organizationsService.getAsync` | organization settings/members | MSW covered |
| 13 | POST | `/organizations` | `organizationsService.createAsync` | onboarding | MSW covered |
| 14 | PATCH | `/organizations/{organizationId}` | `organizationsService.updateAsync` | workspace name | MSW covered |
| 15 | GET | `/organizations/{organizationId}/budget` | `organizationsService.getBudgetAsync` | nullable budget card | MSW covered |
| 16 | PUT | `/organizations/{organizationId}/budget` | `organizationsService.upsertBudgetAsync` | budget mutation | MSW covered |
| 17 | POST | `/organizations/{organizationId}/invite` | `organizationsService.createInviteAsync` | expiry/token join URL | MSW covered |
| 18 | POST | `/organizations/join?token=` | `organizationsService.joinAsync` | authenticated invite acceptance | MSW covered |
| 19 | GET | `/organizations/{organizationId}/dashboard/summary` | `dashboardService.getSummaryAsync` | KPI cards | MSW covered |
| 20 | GET | `/organizations/{organizationId}/dashboard/upcoming-bills` | `dashboardService.getUpcomingBillsAsync` | upcoming list/timeline | MSW covered |
| 21 | GET | `/organizations/{organizationId}/dashboard/recent-expenses` | `dashboardService.getRecentExpensesAsync` | recent spending/timeline | MSW covered |
| 22 | GET | `/organizations/{organizationId}/bills` | `billsService.listAsync` | server paging/search/status | MSW covered |
| 23 | POST | `/organizations/{organizationId}/bills` | `billsService.createAsync` | bill form | MSW covered |
| 24 | GET | `/organizations/{organizationId}/bills/{billId}` | `billsService.getAsync` | direct detail route | MSW covered |
| 25 | PATCH | `/organizations/{organizationId}/bills/{billId}` | `billsService.updateAsync` | edit/mark paid | MSW covered |
| 26 | DELETE | `/organizations/{organizationId}/bills/{billId}` | `billsService.deleteAsync` | confirmed deletion | MSW covered |
| 27 | POST | `/organizations/{organizationId}/bills/{billId}/documents` | `billsService.uploadDocumentAsync` | validated multipart upload | MSW covered |
| 28 | GET | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}` | `billsService.getDocumentAsync` | authenticated preview | MSW covered |
| 29 | GET | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}/download-url` | `billsService.getDocumentDownloadUrlAsync` | expiring download | MSW covered |
| 30 | DELETE | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}` | `billsService.deleteDocumentAsync` | confirmed document removal | MSW covered |
| 31 | POST | `/organizations/{organizationId}/bills/series/{seriesId}/stop` | `billsService.stopSeriesAsync` | stop future occurrences | MSW covered |
| 32 | GET | `/organizations/{organizationId}/expenses` | `expensesService.listAsync` | server paging/date | MSW covered |
| 33 | POST | `/organizations/{organizationId}/expenses` | `expensesService.createAsync` | expense form with `me.id` | MSW covered |
| 34 | GET | `/organizations/{organizationId}/expenses/{expenseId}` | `expensesService.getAsync` | direct detail route | MSW covered |
| 35 | PATCH | `/organizations/{organizationId}/expenses/{expenseId}` | `expensesService.updateAsync` | edit form | MSW covered |
| 36 | DELETE | `/organizations/{organizationId}/expenses/{expenseId}` | `expensesService.deleteAsync` | confirmed deletion | MSW covered |
| 37 | POST | `/organizations/{organizationId}/expenses/{expenseId}/documents` | `expensesService.uploadDocumentAsync` | validated multipart upload | MSW covered |
| 38 | GET | `/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}` | `expensesService.getDocumentAsync` | authenticated blob download | MSW covered |
| 39 | DELETE | `/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}` | `expensesService.deleteDocumentAsync` | confirmed document removal | MSW covered |

## Contract boundaries

- Access tokens live only in memory. Refresh tokens are handled by the backend's
  HTTP-only cookie; JavaScript never writes either token to browser storage.
- The registration form enforces the backend's eight-character minimum password.
- Organization details expose only username/email for members. Roles, joined dates,
  and timezones are intentionally not fabricated in the UI.
- Invitation roles use one explicit boundary: `Owner=1`, `Admin=2`, `Member=3`.
  Invites show the returned expiry and URL but do not optimistically add a member.
- Budget `404` maps to `null` only for the budget service. Other `404` responses are
  surfaced as errors.
- Bill search/status/date filters are sent to the server; series filtering is
  limited to the currently loaded page. Expense search/status are explicitly local
  filters over the loaded page because the backend accepts only page/date params.
- Bill Open uses the authenticated binary endpoint, while Download uses the signed
  URL endpoint. Object URLs are revoked after use. Document uploads are limited to
  10 MiB and PDF/JPG/JPEG/PNG/DOC/DOCX; avatars are limited to 2 MiB and JPG/JPEG/PNG.
- Mutations invalidate feature list/detail data plus dashboard and auth dependencies
  where the backend response can change them.

`src/api.contract.test.ts` asserts all 39 method/path rows, representative query and
JSON/multipart bodies, role mapping, encoded join tokens, and nullable dashboard
values. `src/auth.transport.test.ts` covers single-flight refresh, refresh failure,
and non-persistence of bearer tokens.
