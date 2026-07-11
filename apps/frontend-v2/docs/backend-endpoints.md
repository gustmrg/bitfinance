# Backend endpoint map

This prototype uses no HTTP calls. The catalog below mirrors the current backend controllers and models so a future adapter can replace the demo store without redesigning the screens.

Base URL: `/api/v1` · authenticated routes use the current access-token/session contract.

| Area | Method | Route | Prototype surface |
| --- | --- | --- | --- |
| Health | GET | `/health` | Demo status indicator; no request is made |
| Identity | POST | `/identity/register` | Sign-up flow accepts local demo credentials |
| Identity | POST | `/identity/login` | Sign-in flow accepts local demo credentials |
| Identity | POST | `/identity/refresh` | Not simulated; refresh is a browser reset boundary |
| Identity | POST | `/identity/logout` | Account sign-out clears local auth state |
| Identity | POST | `/identity/logout-all` | Account action is represented by the same local sign-out |
| Identity | GET | `/identity/me` | Seeded user and organization context |
| Identity | POST | `/identity/manage/profile` | Account profile form updates the mock user |
| Identity | POST | `/identity/manage/avatar` | Avatar action is presented as a prototype control |
| Identity | DELETE | `/identity/manage/avatar` | Avatar removal is not persisted in the demo |
| Organizations | GET | `/organizations` | Organization switcher |
| Organizations | GET | `/organizations/{organizationId}` | Organization overview and members |
| Organizations | POST | `/organizations` | Create-workspace onboarding |
| Organizations | PATCH | `/organizations/{organizationId}` | Workspace settings form |
| Organizations | GET | `/organizations/{organizationId}/budget` | Budget card and dashboard metric |
| Organizations | PUT | `/organizations/{organizationId}/budget` | Budget form updates mock organization state |
| Organizations | POST | `/organizations/{organizationId}/invite` | Members invite modal creates a local member |
| Organizations | POST | `/organizations/join` | Join-invitation screen |
| Dashboard | GET | `/organizations/{organizationId}/dashboard/summary` | Dashboard KPI cards |
| Dashboard | GET | `/organizations/{organizationId}/dashboard/upcoming-bills` | Cash-flow timeline and upcoming list |
| Dashboard | GET | `/organizations/{organizationId}/dashboard/recent-expenses` | Recent spending card |
| Bills | GET | `/organizations/{organizationId}/bills` | Bills list, search, status/type filters |
| Bills | POST | `/organizations/{organizationId}/bills` | Add bill modal |
| Bills | GET | `/organizations/{organizationId}/bills/{billId}` | Bill detail screen |
| Bills | PATCH | `/organizations/{organizationId}/bills/{billId}` | Edit and mark-paid actions |
| Bills | DELETE | `/organizations/{organizationId}/bills/{billId}` | Overflow delete action |
| Bills | POST | `/organizations/{organizationId}/bills/{billId}/documents` | Attachment control |
| Bills | GET | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}` | Attachment detail/download affordance |
| Bills | GET | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}/download-url` | Download affordance; no signed URL is generated |
| Bills | DELETE | `/organizations/{organizationId}/bills/{billId}/documents/{documentId}` | Attachment removal affordance |
| Bills | POST | `/organizations/{organizationId}/bills/series/{seriesId}/stop` | Series metadata and future stop action |
| Expenses | GET | `/organizations/{organizationId}/expenses` | Expenses list, search, status filter |
| Expenses | POST | `/organizations/{organizationId}/expenses` | Add expense modal |
| Expenses | GET | `/organizations/{organizationId}/expenses/{expenseId}` | Expense detail screen |
| Expenses | PATCH | `/organizations/{organizationId}/expenses/{expenseId}` | Edit expense form |
| Expenses | DELETE | `/organizations/{organizationId}/expenses/{expenseId}` | Overflow delete action |
| Expenses | POST | `/organizations/{organizationId}/expenses/{expenseId}/documents` | Attachment control |
| Expenses | GET | `/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}` | Attachment detail/download affordance |
| Expenses | DELETE | `/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}` | Attachment removal affordance |

## Deliberate prototype boundaries

- Member role editing/removal is not shown as an active mutation because the current backend exposes member data and invitations, but no role-update or removal endpoints.
- Authentication, uploads, downloads, and refresh tokens are represented visually only; the demo store is in-memory and resets on page refresh.
- Request and response field names remain aligned with the existing frontend/backend types: `amountDue`, `amountPaid`, `occurredAt`, `billSeriesType`, `totalOccurrences`, `budget`, and organization-scoped routes.
