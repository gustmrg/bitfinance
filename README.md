# BitFinance

BitFinance is a finance platform for tracking bills, expenses, organizations, and financial activity across a web app, backend API, and MCP server integration.

## Components

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, and Zustand web application.
- **Backend**: .NET API with PostgreSQL persistence, Redis caching support, object storage integration, authentication, and organization-based finance workflows.
- **MCP server**: .NET stdio MCP server that exposes BitFinance API capabilities to MCP-compatible agents and clients.

## Local Development

Install frontend dependencies from the repository root:

```bash
pnpm install
```

Run the frontend:

```bash
pnpm --dir apps/frontend dev
```

Run the backend development stack:

```bash
docker compose --project-directory apps/backend -f apps/backend/docker-compose.yml up -d
```

Run the backend API directly:

```bash
dotnet run --project apps/backend/src/BitFinance.API
```

Run the MCP server directly:

```bash
dotnet run --project apps/mcp-server/src/BitFinance.MCP.csproj
```

## Documentation

Each component keeps its own README with setup, configuration, and deployment details.
