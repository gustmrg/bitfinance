import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

const toastStyle = {
  "--normal-bg": "var(--bf-surface)",
  "--normal-text": "var(--bf-ink)",
  "--normal-border": "var(--bf-line)",
  "--success-bg": "var(--bf-surface)",
  "--success-text": "var(--bf-ink)",
  "--success-border": "var(--bf-line)",
  "--error-bg": "var(--bf-danger-soft)",
  "--error-text": "var(--bf-danger)",
  "--error-border": "var(--bf-danger-soft)",
  "--border-radius": "16px",
} as CSSProperties;

export function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      mobileOffset={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}
      style={toastStyle}
      toastOptions={{ className: "font-sans text-sm font-semibold shadow-xl" }}
    />
  );
}
