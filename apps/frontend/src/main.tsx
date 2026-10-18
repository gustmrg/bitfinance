import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import "@/i18n";
import { App } from "@/app";
import { AuthProvider } from "@/auth/auth-provider";
import { AppToaster } from "@/components/feedback/app-toaster";
import { queryClient } from "@/lib/query-client";
import "@/styles/index.css";

if (localStorage.getItem("bitfinance-theme") === "dark") {
  document.documentElement.dataset.theme = "dark";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <AppToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
