# BitFinance

BitFinance is a finance platform for tracking bills, expenses, organizations, and financial activity across a web app, backend API, MCP server integration, and agent-oriented CLI.

## Components

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, and installable PWA support.
- **Backend**: .NET API with PostgreSQL persistence, Redis caching support, object storage integration, authentication, and organization-based finance workflows.
- **MCP server**: .NET Streamable HTTP MCP server that exposes BitFinance API capabilities to MCP-compatible agents and clients.
- **CLI**: Self-contained .NET command-line client with stable JSON output for agents and automation.

## Local Development

Install frontend dependencies from the frontend app directory:

```bash
cd apps/frontend
pnpm install
```

Run the frontend:

```bash
pnpm dev
```

Run the backend development stack:

```bash
docker compose --project-directory apps/backend up -d --build
```

Run the backend API directly:

```bash
dotnet run --project apps/backend/src/BitFinance.API
```

Run the MCP server directly after setting the required environment variables:

```bash
dotnet run --project apps/mcp-server/src/BitFinance.MCP.csproj
```

Run the CLI after configuring an API URL and access token:

```bash
export BITFINANCE_API_BASE_URL="https://<bitfinance-api-host>"
export BITFINANCE_ACCESS_TOKEN="<access-token>"

dotnet run --project apps/cli/src/BitFinance.Cli.csproj -- organizations list
```

## Documentation

Each component keeps its own README with setup, configuration, and deployment details.
