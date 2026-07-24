import { env } from "../../env";
import i18n from "../../i18n";

export type HealthStatus = { status: "healthy" | "degraded"; message?: string };

export const healthService = {
  async getAsync(): Promise<HealthStatus> {
    let response: Response;
    try {
      response = await fetch(env.VITE_HEALTH_URL, { credentials: "include" });
    } catch {
      throw new Error(i18n.t("errors.offline"));
    }
    if (!response.ok) throw new Error(i18n.t("api.healthFailed", { status: response.status }));
    return { status: "healthy" };
  },
};
