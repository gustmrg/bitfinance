# Bill Filtering: Status, Description & Date

## Context

The bills listing endpoint already supports date range filtering (`from`/`to` on `DueDate`), but users cannot filter by **status** or **description**. This plan adds server-side filtering for both, with a multi-select status dropdown and a debounced text search on the frontend. We also fix a pagination bug where `totalRecords` counts all bills globally instead of filtered results.

---

## Phase 1 — Backend

### 1. Repository interface
**File:** `bitfinance-backend/src/BitFinance.Data/Repositories/Interfaces/IBillsRepository.cs` (line 8)

Change `GetAllByOrganizationAsync` signature:
- Add params: `List<BillStatus>? statuses = null, string? description = null`
- Change return type from `Task<List<Bill>>` to `Task<(List<Bill> Items, int TotalCount)>` — this fixes the pagination count bug by returning the filtered count from the same query.

Remove `GetEntriesCountAsync` from the interface (line 12) since it will no longer be needed.

### 2. Repository implementation
**File:** `bitfinance-backend/src/BitFinance.Data/Repositories/BillsRepository.cs` (lines 36-59)

Update `GetAllByOrganizationAsync` to:
- Accept the new `statuses` and `description` params
- Add `if (statuses is { Count: > 0 })` → `.Where(b => statuses.Contains(b.Status))`
- Add `if (!string.IsNullOrWhiteSpace(description))` → `.Where(b => EF.Functions.ILike(b.Description, $"%{description}%"))` (PostgreSQL case-insensitive)
- Count filtered results with `await query.CountAsync()` before applying Skip/Take
- Return `(items, totalCount)` tuple

Remove `GetEntriesCountAsync` method (lines 80-83).

### 3. Controller
**File:** `bitfinance-backend/src/BitFinance.API/Controllers/BillsController.cs` (lines 127-171)

- Add query params: `[FromQuery] string? status = null, [FromQuery] string? description = null`
- Parse `status` as comma-separated string → `List<BillStatus>` (using `Enum.TryParse`, ignoring invalid values)
- Replace the `GetEntriesCountAsync()` call (line 133) with the `TotalCount` from the tuple return
- Pass `statuses` and `description` to the repository call
- Update `EndpointDescription` to mention new filters

---

## Phase 2 — Frontend

### 4. Create `useDebounce` hook (new file)
**File:** `bitfinance-frontend/src/hooks/use-debounce.ts`

Generic debounce hook — returns a debounced value after a configurable delay (default 300ms). Used for the description search input.

### 5. Update API types
**File:** `bitfinance-frontend/src/api/bills/bills.types.ts` (line 58)

Add to `BillsListQuery`:
```typescript
status?: BillStatus[];
description?: string;
```

### 6. Update API service
**File:** `bitfinance-frontend/src/api/bills/bills.service.ts` (line 159)

In `listAsync`, add to `params`:
```typescript
status: query.status?.join(","),
description: query.description || undefined,
```

### 7. Update query keys
**File:** `bitfinance-frontend/src/lib/query-keys.ts` (line 22)

Extend `bills.list` to include `status` and `description` in the cache key so different filter combinations produce different cache entries. Sort statuses before joining.

### 8. Update query hook
**File:** `bitfinance-frontend/src/hooks/queries/use-bills-query.ts`

Expand `BillsQueryFilters` with `status?: BillStatus[]` and `description?: string`. Pass them through to `billsService.listAsync` and include in the query key.

### 9. Add i18n translations
**Files:**
- `bitfinance-frontend/src/i18n/locales/en-US.json`
- `bitfinance-frontend/src/i18n/locales/pt-BR.json`

Add filter-related keys under `bills.filters` (status placeholder, description placeholder, clear filters label).

### 10. Create filter bar component (new file)
**File:** `bitfinance-frontend/src/pages/bills/components/bills-filter-bar.tsx`

A horizontal row with:
1. **Description search** — `Input` with `Search` icon, debounced
2. **Status multi-select** — `Popover` + `Command` (cmdk) with checkable items for each `BillStatus`. Trigger shows "All statuses" or selected count. Uses existing i18n labels (`labels.paid`, `labels.due`, etc.)
3. **Date range picker** — existing `CalendarDateRangePicker` moved here from PageHeader

Responsive: `flex flex-col gap-2 sm:flex-row sm:items-center`.

### 11. Wire up the bills page
**File:** `bitfinance-frontend/src/pages/bills/index.tsx`

- Add state: `selectedStatuses: BillStatus[]`, `descriptionSearch: string`
- Create `debouncedDescription = useDebounce(descriptionSearch, 300)`
- Pass all filters to `useBillsQuery`
- Move `CalendarDateRangePicker` from `PageHeader.actions` into `BillsFilterBar`
- Insert `BillsFilterBar` between `PageHeader` and the table/cards

---

## Phase 3 — MCP Server

### 12. MCP interface
**File:** `bitfinance-mcp-server/src/Services/IBitFinanceApiClient.cs` (line 12)

Add `string? status = null, string? description = null` params to `ListBillsAsync`.

### 13. MCP client implementation
**File:** `bitfinance-mcp-server/src/Services/BitFinanceApiClient.cs` (lines 82-98)

Add `("status", status)` and `("description", description)` to `WithQuery`.

### 14. MCP tool
**File:** `bitfinance-mcp-server/src/Tools/BitFinanceTools.cs` (lines 61-70)

Add `string? status = null` and `string? description = null` params with `[Description]` attributes. Pass through to `_apiClient.ListBillsAsync`.

---

## Verification

1. **Backend**: Run the API and test with curl/Postman:
   - `GET .../bills?status=due,overdue` → only Due and Overdue bills
   - `GET .../bills?description=rent` → bills with "rent" in description (case-insensitive)
   - `GET .../bills?from=...&to=...&status=paid` → combined filters
   - Verify `totalRecords` in response matches filtered count, not global count
2. **Frontend**: Start dev server, navigate to bills page:
   - Multi-select statuses and verify the table updates
   - Type in description search, verify debounce (300ms delay) and filtered results
   - Combine all three filters (date + status + description)
   - Clear filters and verify all bills return
   - Test on mobile viewport (filter bar stacks vertically)
3. **MCP**: Test `bitfinance_list_bills` tool with `status` and `description` params
