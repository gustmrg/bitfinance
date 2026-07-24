import { authApi } from "../shared/client";
import { normalizeApiError } from "../shared/errors";
import type { User } from "../auth/auth.types";

export const accountService = {
  async updateProfileAsync(firstName: string, lastName: string): Promise<User> {
    try {
      return (await authApi.post<User>("/identity/manage/profile", { firstName, lastName })).data;
    } catch (error) {
      throw normalizeApiError(error, "api.account.updateProfile");
    }
  },
  async uploadAvatarAsync(file: File) {
    try {
      const form = new FormData();
      form.append("file", file);
      return (
        await authApi.post<{ id: string; fileName: string; contentType: string }>(
          "/identity/manage/avatar",
          form,
        )
      ).data;
    } catch (error) {
      throw normalizeApiError(error, "api.account.uploadAvatar");
    }
  },
  async deleteAvatarAsync() {
    try {
      await authApi.delete("/identity/manage/avatar");
    } catch (error) {
      throw normalizeApiError(error, "api.account.removeAvatar");
    }
  },
};
