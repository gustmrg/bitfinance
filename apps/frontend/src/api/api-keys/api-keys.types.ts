export type ApiKeyAccess = "Read" | "ReadWrite";

export interface ApiKeyOrganization {
  organizationId: string;
  name: string;
  access: ApiKeyAccess;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  organizations: ApiKeyOrganization[];
}

export interface CreateApiKeyInput {
  name: string;
  organizations: Array<{ organizationId: string; access: ApiKeyAccess }>;
  expiresAt: string | null;
}

export interface CreatedApiKey {
  id: string;
  name: string;
  prefix: string;
  secret: string;
}
