import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "./i18n";
import { App } from "./app";
import "./styles.css";

if (localStorage.getItem("bitfinance-v2-theme") === "dark") {
  document.documentElement.dataset.theme = "dark";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="bottom-right" toastOptions={{ className: "toast" }} />
    </BrowserRouter>
  </StrictMode>,
);
