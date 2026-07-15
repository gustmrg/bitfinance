# Backend endpoint coverage

The frontend-v2 client is backed by typed Axios services and TanStack Query
consumers. All organization-scoped query keys include the selected
organization ID. `VITE_API_URL` points to `/api/v1`; health remains at the origin
root `/health`.

| # | Method | Route | Client | Consumer | Status |
| ---: | --- | --- | --- | --- | --- |
| 1 | GET | `/health` | `healthService.getAsync` | API status badge | Client mapped |
| 2 | POST | `/identity/register` | `authService.registerAsync` | sign-up and session bootstrap | Client mapped |
| 3 | POST | `/identity/login` | `authService.loginAsync` | sign-in and return URL | Client mapped |
| 4 | POST | `/identity/refresh` | `authService.refreshAsync` | startup and single-flight retry | Client mapped |
| 5 | POST | `/identity/logout` | `authService.logoutAsync` | current-session sign-out | Client mapped |
| 6 | POST | `/identity/logout-all` | `authService.logoutAllAsync` | confirmed all-device sign-out | Client mapped |
| 7 | GET | `/identity/me` | `authService.getMeAsync` | canonical user/org bootstrap | Client mapped |
| 8 | POST | `/identity/manage/profile` | `accountService.updateProfileAsync` | account profile form | Client mapped |
| 9 | POST | `/identity/manage/avatar` | `accountService.uploadAvatarAsync` | validated avatar picker | Client mapped |
| 10 | DELETE | `/identity/manage/avatar` | `accountService.deleteAvatarAsync` | confirmed avatar removal | Client mapped |
| 11 | GET | `/organizations` | `organizationsService.listAsync` | organization switcher | Client mapped |
| 12 | GET | `/organizations/{organizationId}` | `organizationsService.getAsync` | organization settings/members | Client mapped |
| 13 | POST | `/organizations` | `organizationsService.createAsync` | onboarding | Client mapped |
| 14 | PATCH | `/organizations/{organizationId}` | `organizationsService.updateAsync` | workspace name | Client mapped |
| 15 | GET | `/organizations/{organizationId}/budget` | `organizationsService.getBudgetAsync` | nullable budget card | Client mapped |
| 16 | PUT | `/organizations/{organizationId}/budget` | `organizationsService.upsertBudgetAsync` | budget mutation | Client mapped |
| 17 | POST | `/organizations/{organizationId}/invite` | `organizationsService.createInviteAsync` | expiry/token join URL | Client mapped |
| 18 | POST | `/organizations/join?token=` | `organizationsService.joinAsync` | authenticated invite acceptance | Client mapped |
| 19 | GET | `/organizations/{organizationId}/dashboard/summary` | `dashboardService.getSummaryAsync` | KPI cards | Client mapped |
| 20 | GET | `/organizations/{organizationId}/dashboard/upcoming-bills` | `dashboardService.getUpcomingBillsAsync` | upcoming list/timeline | Client mapped |
| 21 | GET | `/organizations/{organizationId}/dashboard/recent-expenses` | `dashboardService.getRecentExpensesAsync` | recent spending/timeline | Client mapped |
| 22 | GET | `/organizations/{organizationId}/bills` | `billsService.listAsync` | server paging/search/status | Client mapped |
| 23 | POST | `/organizations/{organizationId}/bills` | `billsService.createAsync` | bill form | Client mapped |
| 24 | GET | `/organizations/{organizationId}/bills/{billId}` | `billsService.getAsync` | direct detail route | Client mapped |
| 25 | PATCH | `/organizations/{organizationId}/bills/{billId}` | `billsService.updateAsync` | edit/mark paid | Client mapped |
| 26 | DELETE | `/organizations/{organizationId}/bills/{billId}` | `billsService.deleteAsync` | confirmed deletion | Client mapped |
| 27 | POST | `/organizations/{organizationId}/bills/{billId}/documents` | `billsService.uploadDocumentAsync` | validated multipart upload | Client mapped |
| 28 | GET | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}` | `billsService.getDocumentAsync` | authenticated preview | Client mapped |
| 29 | GET | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}/download-url` | `billsService.getDocumentDownloadUrlAsync` | expiring download | Client mapped |
| 30 | DELETE | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}` | `billsService.deleteDocumentAsync` | confirmed document removal | Client mapped |
| 31 | POST | `/organizations/{organizationId}/bills/series/{seriesId}/stop` | `billsService.stopSeriesAsync` | stop future occurrences | Client mapped |
| 32 | GET | `/organizations/{organizationId}/expenses` | `expensesService.listAsync` | server paging/date | Client mapped |
| 33 | POST | `/organizations/{organizationId}/expenses` | `expensesService.createAsync` | expense form with `me.id` | Client mapped |
| 34 | GET | `/organizations/{organizationId}/expenses/{expenseId}` | `expensesService.getAsync` | direct detail route | Client mapped |
| 35 | PATCH | `/organizations/{organizationId}/expenses/{expenseId}` | `expensesService.updateAsync` | edit form | Client mapped |
| 36 | DELETE | `/organizations/{organizationId}/expenses/{expenseId}` | `expensesService.deleteAsync` | confirmed deletion | Client mapped |
| 37 | POST | `/organizations/{organizationId}/expenses/{expenseId}/documents` | `expensesService.uploadDocumentAsync` | validated multipart upload | Client mapped |
| 38 | GET | `/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}` | `expensesService.getDocumentAsync` | authenticated blob download | Client mapped |
| 39 | DELETE | `/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}` | `expensesService.deleteDocumentAsync` | confirmed document removal | Client mapped |

## Client boundaries

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

The client mapping above is the source of truth for the 39 method/path rows,
representative query and JSON/multipart bodies, role mapping, encoded join tokens,
and nullable dashboard values.
