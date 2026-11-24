# API keys

API keys let an agent, usually through the MCP server, call the API without a separate account. A key belongs to a person and acts as that person, limited to the organizations and access level chosen when it was created.

## Model

- A key belongs to one user and lists one or more organizations that user is a member of, each with an access level:
  - **Read**: `GET` requests only.
  - **ReadWrite**: also creates, updates and deletes.
- A request is allowed only when the owner's own role allows it **and** the key allows it. A key never grants more than its owner has.
- Keys can expire (optional) and can be revoked at any time. Revoking takes effect on the next request.
- If the owner leaves an organization, the key loses access to it immediately, because the usual membership check still runs.
- New organizations the owner joins are never added to existing keys.
- Only a SHA-256 hash of the key is stored. The secret (`bf_` followed by 43 characters) is shown once, when the key is created.

## Using a key

Send it like an access token:

```http
Authorization: Bearer bf_...
```

The API tells keys and JWTs apart by the `bf_` prefix.

`GET /api/v1/api-keys/current` returns the calling key and the organizations it can access, with the access level of each.

## What a key can call

Endpoints opt in with `[AllowApiKey]`. Every other endpoint answers `403` to a key, so new endpoints stay closed to agents until someone opts them in. Today the opted-in endpoints are:

- bills, expenses, their documents, the dashboard and reports, under `/organizations/{organizationId}/...`;
- `GET /organizations/{organizationId}`;
- `GET /api-keys/current`.

Keys cannot manage the account (`/identity/*`), other API keys, organization settings, members or invitations.

`ApiKeyScopeFilter` enforces these rules and answers `403` with one of:

- `API keys cannot use this endpoint.`
- `This API key has no access to this organization.`
- `This API key has read-only access to this organization.`

## Managing keys

People manage their keys in **Account → API keys**. The endpoints behind it accept only a signed-in session, not a key:

- `GET /api/v1/api-keys`
- `POST /api/v1/api-keys`
- `DELETE /api/v1/api-keys/{id}`
