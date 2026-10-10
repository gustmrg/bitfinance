# Contributing

Thanks for contributing to BitFinance. Keep changes focused, documented, and verified before opening a pull request.

## Workflow

1. Create a branch from `main`.
2. Make a focused change for one project or concern.
3. Run the relevant checks before submitting.
4. Open a pull request with a clear description and test notes.

## Local Checks

Frontend:

```bash
cd apps/frontend
pnpm install
pnpm format:check
pnpm lint
pnpm build
```

Backend:

```bash
dotnet build apps/backend/BitFinance.sln
```

MCP server:

```bash
dotnet build apps/mcp-server/src/BitFinance.MCP.csproj
```

## Commit Format

This repository follows Conventional Commits. Include the affected project or area as the scope.

Format:

```text
type(scope): summary
```

Examples:

```text
feat(frontend): add bill status filter
fix(backend): correct filtered bill count
feat(mcp-server): expose bill description search
docs(readme): clarify local setup
ci(frontend): update deploy workflow paths
```

Common types:

- `feat`: new functionality
- `fix`: bug fix
- `docs`: documentation-only change
- `chore`: maintenance or tooling change
- `refactor`: code change that does not alter behavior
- `test`: test additions or updates
- `ci`: CI/CD changes

Preferred scopes:

- `frontend`
- `backend`
- `mcp-server`
- `docs`
- `ci`
- `monorepo`

Use imperative, concise summaries and do not add a trailing period.

## Pull Request Format

PR titles should follow the same Conventional Commit format as commits:

```text
feat(frontend): add X feature
```

PR descriptions should include:

- What changed
- Why the change was made
- How it was verified
- Any risks, migrations, or follow-up work

Keep PRs small when possible. If a change affects multiple projects, call out each affected project in the description.

## Releases

Pull requests do not change app versions. See [`docs/deployment.md`](docs/deployment.md) for the full release and deployment flow. Each app is released on its own from the **Release** workflow (Actions → Release → Run workflow) on `main`:

- `app`: `backend`, `frontend` or `mcp-server`
- `version`: `patch`, `minor`, `major`, or an exact version such as `1.13.0`

The workflow bumps the version, runs the same checks as pull requests, then commits `chore(release): prepare <app> vX.Y.Z`, tags `<app>/vX.Y.Z` and runs that app's publish and deploy workflow. If validation fails, nothing is committed or tagged.

To check or bump a version locally:

```bash
node scripts/bump-version.mjs backend         # prints the current version
node scripts/bump-version.mjs backend patch   # writes and prints the next version
```

To republish a version that was already released, for example to roll back, run that app's publish workflow (Backend Publish, MCP Server Publish or Frontend Publish) with the version. It builds from the existing `<app>/vX.Y.Z` tag. Pushing a tag by hand does not deploy anything.
