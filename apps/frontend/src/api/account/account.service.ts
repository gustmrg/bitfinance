import { privateAPI } from "@/lib/axios";

import { normalizeError } from "@/api/shared/normalize-error";

import type { AvatarResponse, UpdateProfileRequest } from "./account.types";

const authApi = privateAPI();

export const accountService = {
  async updateProfileAsync(request: UpdateProfileRequest) {
    try {
      const response = await authApi.post("/identity/manage/profile", {
        firstName: request.firstName,
        lastName: request.lastName,
      });

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to update profile.");
    }
  },

  async uploadAvatarAsync(file: File): Promise<AvatarResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authApi.post<AvatarResponse>(
        "/identity/manage/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw normalizeError(error, "Failed to upload avatar.");
    }
  },

  async deleteAvatarAsync(): Promise<void> {
    try {
      await authApi.delete("/identity/manage/avatar");
    } catch (error) {
      throw normalizeError(error, "Failed to delete avatar.");
    }
  },

  async logoutAllDevicesAsync(): Promise<void> {
    try {
      await authApi.post("/identity/logout-all");
    } catch (error) {
      throw normalizeError(error, "Failed to log out all devices.");
    }
  },
};
