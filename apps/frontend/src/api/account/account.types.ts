export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface AvatarResponse {
  id: string;
  fileName: string;
  contentType: string;
}
