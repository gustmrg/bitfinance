import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url().or(z.string().startsWith("/")),
  VITE_HEALTH_URL: z.string().url().or(z.string().startsWith("/")),
});

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL ?? "/api/v1",
  VITE_HEALTH_URL: import.meta.env.VITE_HEALTH_URL ?? "/health",
});

if (!parsed.success) {
  throw new Error(`Invalid frontend environment: ${parsed.error.message}`);
}

export const env = parsed.data;
