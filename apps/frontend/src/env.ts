import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().refine(
    (val) => {
      // Accept relative paths starting with /
      if (val.startsWith('/')) return true;
      // Accept full URLs (http or https)
      return z.string().url().safeParse(val).success;
    },
    {
      message: "VITE_API_URL must be a valid URL or a path starting with '/'",
    }
  ),
});

export const env = envSchema.parse(import.meta.env);
