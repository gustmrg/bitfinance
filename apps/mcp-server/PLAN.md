# BitFinance MCP Server: Remaining Endpoints Plan

## Summary

Extend the existing stdio MCP server beyond read/create tools so agents can update and delete bills/expenses, upload and manage bill/expense documents, and optionally cover organization workflows later.

The MCP server will keep calling the existing BitFinance API over HTTP. File upload tools will accept a local `filePath` that must be readable from the machine/container running the MCP server, then send multipart form-data to the backend.

## Phase 1: Bill and Expense Updates/Deletes

Add API client methods and MCP tools for the existing JSON endpoints:

- `bitfinance_update_bill`
  - Calls `PATCH /api/v1/organizations/{organizationId}/bills/{billId}`
  - Inputs: `billId`, `description`, `category`, `status`, `dueDate`, `amountDue`, optional `organizationId`, optional `paymentDate`, optional `amountPaid`
  - Returns the backend update bill response.
- `bitfinance_delete_bill`
  - Calls `DELETE /api/v1/organizations/{organizationId}/bills/{billId}`
  - Inputs: `billId`, optional `organizationId`
  - Returns a small success response such as `{ "deleted": true, "billId": "..." }`.
- `bitfinance_update_expense`
  - Calls `PATCH /api/v1/organizations/{organizationId}/expenses/{expenseId}`
  - Inputs: `expenseId`, `description`, `category`, `amount`, `status`, optional `organizationId`, optional `occurredAt`
  - Returns the backend update expense response.
- `bitfinance_delete_expense`
  - Calls `DELETE /api/v1/organizations/{organizationId}/expenses/{expenseId}`
  - Inputs: `expenseId`, optional `organizationId`
  - Returns a small success response such as `{ "deleted": true, "expenseId": "..." }`.

Implementation notes:

- Reuse the existing optional `organizationId` behavior: default to `BITFINANCE_DEFAULT_ORGANIZATION_ID`.
- Reuse existing enum documentation in tool descriptions.
- Add `UpdateBillRequest`, `UpdateExpenseRequest`, `UpdateBillResponse`, `UpdateExpenseResponse`, and delete response DTOs to the MCP models.
- Extend the shared API client with a no-content response helper for delete endpoints.

## Phase 2: Document Upload/Delete/Download

Add document tools for bill and expense attachments.

Upload tools:

- `bitfinance_upload_bill_document`
  - Calls `POST /api/v1/organizations/{organizationId}/bills/{billId}/documents`
  - Inputs: `billId`, `filePath`, `fileCategory`, optional `organizationId`, optional `contentType`
  - Sends multipart fields `File` and `FileCategory`.
- `bitfinance_upload_expense_document`
  - Calls `POST /api/v1/organizations/{organizationId}/expenses/{expenseId}/documents`
  - Inputs: `expenseId`, `filePath`, `fileCategory`, optional `organizationId`, optional `contentType`
  - Sends multipart fields `File` and `FileCategory`.

Delete document tools:

- `bitfinance_delete_bill_document`
  - Calls `DELETE /api/v1/organizations/{organizationId}/bills/{billId}/documents/{documentId}`
  - Inputs: `billId`, `documentId`, optional `organizationId`
  - Returns `{ "deleted": true, "documentId": "..." }`.
- `bitfinance_delete_expense_document`
  - Calls `DELETE /api/v1/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}`
  - Inputs: `expenseId`, `attachmentId`, optional `organizationId`
  - Returns `{ "deleted": true, "attachmentId": "..." }`.

Download document tools:

- `bitfinance_download_bill_document`
  - Calls `GET /api/v1/organizations/{organizationId}/bills/{billId}/documents/{documentId}`
  - Inputs: `billId`, `documentId`, optional `organizationId`, optional `outputDirectory`
  - Writes the file to disk and returns local `filePath`, `fileName`, and `contentType`.
- `bitfinance_download_expense_document`
  - Calls `GET /api/v1/organizations/{organizationId}/expenses/{expenseId}/documents/{attachmentId}`
  - Inputs: `expenseId`, `attachmentId`, optional `organizationId`, optional `outputDirectory`
  - Writes the file to disk and returns local `filePath`, `fileName`, and `contentType`.

File behavior:

- `filePath` must point to a file accessible by the MCP server process.
- Allowed upload extensions are the backend-supported values: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`.
- Maximum upload size is 10 MB, matching the backend validation.
- Valid `fileCategory` values are `Boleto`, `Receipt`, and `Other`.
- Infer `contentType` from the file extension when omitted:
  - `.pdf`: `application/pdf`
  - `.jpg`, `.jpeg`: `image/jpeg`
  - `.png`: `image/png`
  - `.doc`: `application/msword`
  - `.docx`: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Add optional `BITFINANCE_DOWNLOAD_DIRECTORY`; if not configured and `outputDirectory` is omitted, download files to the OS temp directory under `bitfinance-mcp`.

Security and reliability:

- Validate file existence, extension, and size before upload so agent errors are clear.
- Do not log file contents.
- Sanitize backend-provided file names before writing downloads.
- Avoid overwriting existing downloaded files by adding a timestamp or GUID suffix.

## Phase 3: Organization Management Tools

Add the remaining organization endpoints after bill/expense document workflows are stable:

- `bitfinance_create_organization`
  - Calls `POST /api/v1/organizations`
  - Inputs: `name`
- `bitfinance_update_organization`
  - Calls `PATCH /api/v1/organizations/{organizationId}`
  - Inputs: `organizationId`, `name`
- `bitfinance_create_organization_invite`
  - Calls `POST /api/v1/organizations/{organizationId}/invite`
  - Inputs: `email`, optional `organizationId`, optional `role`
- `bitfinance_join_organization`
  - Calls `POST /api/v1/organizations/join?token=...`
  - Inputs: `token`

Keep these separate from Phase 1/2 because they affect account membership and should be reviewed with stronger confirmation prompts in agent workflows.

## Phase 4: Tests and Documentation

Testing:

- Build with `dotnet build src/BitFinance.MCP.csproj`.
- Add mocked HTTP tests for:
  - patch request body shape for bill and expense updates
  - delete no-content handling
  - multipart upload field names and content type
  - local file validation failures
  - download file-name sanitization and non-overwrite behavior
- Manual smoke tests through an MCP client:
  - update a test bill and expense
  - upload one document to a bill and one to an expense
  - download both documents
  - delete both uploaded documents
  - delete the test bill and expense

Documentation:

- Update `README.md` with the new tools and example agent prompts.
- Document that upload/download paths are local to the MCP server runtime, not necessarily the user's laptop.
- Document `BITFINANCE_DOWNLOAD_DIRECTORY`.

## Assumptions

- The MCP server remains a stdio process launched by an MCP-compatible agent/client.
- The backend API remains unchanged for this phase.
- File upload uses local filesystem paths because MCP tool calls do not provide native browser-style file uploads.
- `organizationId` stays optional when `BITFINANCE_DEFAULT_ORGANIZATION_ID` is configured.
- Destructive tools are exposed by the server, but the agent/client should ask the user for confirmation before invoking delete operations.
