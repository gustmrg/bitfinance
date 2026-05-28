export interface ApiError {
  name: "ApiError";
  message: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
}
