export const themeOptions = ["light", "dark", "system"] as const;

export type ThemeOption = (typeof themeOptions)[number];
