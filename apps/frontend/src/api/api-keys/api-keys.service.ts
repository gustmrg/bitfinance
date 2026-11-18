import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { ApiKey, CreateApiKeyInput, CreatedApiKey } from "./api-keys.types";

export const apiKeysService = {
  async listAsync(): Promise<ApiKey[]> {
    try {
      return (await authApi.get<ApiKey[]>("/api-keys")).data;
    } catch (error) {
      throw normalizeApiError(error, "api.apiKeys.list");
    }
  },
  async createAsync(input: CreateApiKeyInput): Promise<CreatedApiKey> {
    try {
      return (await authApi.post<CreatedApiKey>("/api-keys", input)).data;
    } catch (error) {
      throw normalizeApiError(error, "api.apiKeys.create");
    }
  },
  async revokeAsync(apiKeyId: string): Promise<void> {
    try {
      await authApi.delete(`/api-keys/${apiKeyId}`);
    } catch (error) {
      throw normalizeApiError(error, "api.apiKeys.revoke");
    }
  },
};
