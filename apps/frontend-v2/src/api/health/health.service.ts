import { env } from "../../env";

export type HealthStatus = { status: "healthy" | "degraded"; message?: string };

export const healthService = {
  async getAsync(): Promise<HealthStatus> {
    const response = await fetch(env.VITE_HEALTH_URL, { credentials: "include" });
    if (!response.ok) throw new Error(`Health check failed with ${response.status}`);
    return { status: "healthy" };
  },
};
