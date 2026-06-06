# BitFinance MCP Server

BitFinance is a finance platform for tracking bills, expenses, organizations, and financial activity. This package contains the MCP server integration.

The MCP server uses stdio and is intended to run on the same machine or container as any MCP-compatible agent/client. It calls the BitFinance API over HTTP/HTTPS.

If your BitFinance API is not publicly exposed, a private network such as Tailscale is a good option, but it is not required. Any reachable API URL works.

## Configuration

Set these environment variables in the environment where your MCP client launches the server:

```bash
export BITFINANCE_API_BASE_URL="https://<bitfinance-api-host>:<port>"
export BITFINANCE_AGENT_EMAIL="agent@example.com"
export BITFINANCE_AGENT_PASSWORD="<agent-password>"
export BITFINANCE_DEFAULT_ORGANIZATION_ID="<organization-guid>"
export BITFINANCE_API_VERSION="1"
```

`BITFINANCE_API_VERSION` is optional and defaults to `1`.

## Build

```bash
dotnet build src/BitFinance.MCP.csproj
dotnet publish src/BitFinance.MCP.csproj -c Release
```

For a Raspberry Pi running 64-bit Linux, publish a self-contained build when you do not want to install the .NET runtime separately:

```bash
dotnet publish src/BitFinance.MCP.csproj -c Release -r linux-arm64 --self-contained true
```

## Run locally

From this directory, set the required environment variables and run the project:

```bash
export BITFINANCE_API_BASE_URL="https://<bitfinance-api-host>:<port>"
export BITFINANCE_AGENT_EMAIL="agent@example.com"
export BITFINANCE_AGENT_PASSWORD="<agent-password>"
export BITFINANCE_DEFAULT_ORGANIZATION_ID="<organization-guid>"

dotnet run --project src/BitFinance.MCP.csproj
```

This starts a stdio MCP server. It is meant to be launched by an MCP client, so running it directly will wait for MCP protocol messages on stdin.

After publishing, run the DLL directly:

```bash
dotnet ./src/bin/Release/net10.0/BitFinance.MCP.dll
```

## MCP stdio command

Configure your MCP client to launch either the published executable or the DLL. Example DLL command:

```bash
dotnet /opt/bitfinance-mcp-server/BitFinance.MCP.dll
```

The server writes logs to stderr so stdout remains available for MCP protocol messages.

Example generic MCP server configuration:

```json
{
  "mcpServers": {
    "bitfinance": {
      "command": "dotnet",
      "args": ["/opt/bitfinance-mcp-server/BitFinance.MCP.dll"],
      "env": {
        "BITFINANCE_API_BASE_URL": "https://<bitfinance-api-host>:<port>",
        "BITFINANCE_AGENT_EMAIL": "agent@example.com",
        "BITFINANCE_AGENT_PASSWORD": "<agent-password>",
        "BITFINANCE_DEFAULT_ORGANIZATION_ID": "<organization-guid>",
        "BITFINANCE_API_VERSION": "1"
      }
    }
  }
}
```

## Tools

- `bitfinance_list_organizations`
- `bitfinance_get_organization`
- `bitfinance_get_upcoming_bills`
- `bitfinance_get_recent_expenses`
- `bitfinance_list_bills`
- `bitfinance_get_bill`
- `bitfinance_create_bill`
- `bitfinance_update_bill`
- `bitfinance_delete_bill`
- `bitfinance_upload_bill_document`
- `bitfinance_get_bill_document_download_url`
- `bitfinance_delete_bill_document`
- `bitfinance_list_expenses`
- `bitfinance_get_expense`
- `bitfinance_create_expense`

Bill document uploads accept a `filePath` that must be readable by the MCP server process. Supported document extensions are `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, and `.docx`, up to 10 MB.

Bill document downloads return a temporary signed URL with file metadata. The MCP server does not download the file to local disk; agents such as Hermes can use the returned URL directly before it expires.

## Example agent interactions

Once the MCP client has connected to this server, an agent can call the tools directly or choose them while responding to natural-language requests.

Examples:

```text
Show me the organizations I can access.
```

Expected tool call:

```json
{
  "tool": "bitfinance_list_organizations",
  "arguments": {}
}
```

```text
Show my upcoming bills.
```

Expected tool call:

```json
{
  "tool": "bitfinance_get_upcoming_bills",
  "arguments": {}
}
```

```text
List expenses from May 1 to May 31, 2026.
```

Expected tool call:

```json
{
  "tool": "bitfinance_list_expenses",
  "arguments": {
    "page": 1,
    "pageSize": 20,
    "from": "2026-05-01T00:00:00Z",
    "to": "2026-05-31T23:59:59Z"
  }
}
```

```text
Create a paid food expense for 42.50 called Lunch today.
```

Expected tool call:

```json
{
  "tool": "bitfinance_create_expense",
  "arguments": {
    "description": "Lunch",
    "category": "Food",
    "amount": 42.50,
    "status": "Paid",
    "occurredAt": "2026-05-16T12:00:00Z"
  }
}
```

```text
Create an upcoming utilities bill for 120 due on June 10.
```

Expected tool call:

```json
{
  "tool": "bitfinance_create_bill",
  "arguments": {
    "description": "Utilities",
    "category": "Utilities",
    "status": "Upcoming",
    "dueDate": "2026-06-10T00:00:00Z",
    "amountDue": 120.00
  }
}
```

```text
List overdue bills from May with "internet" in the description.
```

Expected tool call:

```json
{
  "tool": "bitfinance_list_bills",
  "arguments": {
    "page": 1,
    "pageSize": 100,
    "from": "2026-05-01T00:00:00Z",
    "to": "2026-05-31T23:59:59Z",
    "status": "Overdue",
    "description": "internet"
  }
}
```

```text
Mark a bill as paid.
```

Expected tool call:

```json
{
  "tool": "bitfinance_update_bill",
  "arguments": {
    "billId": "00000000-0000-0000-0000-000000000000",
    "description": "Utilities",
    "category": "Utilities",
    "status": "Paid",
    "dueDate": "2026-06-10T00:00:00Z",
    "amountDue": 120.00,
    "paymentDate": "2026-06-04T12:00:00Z",
    "amountPaid": 120.00
  }
}
```

```text
Upload a receipt to a bill.
```

Expected tool call:

```json
{
  "tool": "bitfinance_upload_bill_document",
  "arguments": {
    "billId": "00000000-0000-0000-0000-000000000000",
    "filePath": "/path/readable/by/mcp-server/receipt.pdf",
    "fileCategory": "Receipt"
  }
}
```

```text
Get a download URL for a bill document.
```

Expected tool call:

```json
{
  "tool": "bitfinance_get_bill_document_download_url",
  "arguments": {
    "billId": "00000000-0000-0000-0000-000000000000",
    "documentId": "11111111-1111-1111-1111-111111111111"
  }
}
```

If `BITFINANCE_DEFAULT_ORGANIZATION_ID` is configured, organization-scoped tools can omit `organizationId`. Otherwise, the agent must pass `organizationId` explicitly.
