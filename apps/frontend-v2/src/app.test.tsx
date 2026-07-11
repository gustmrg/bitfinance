// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import "./i18n";
import { App } from "./app";
import { useDemoStore } from "./store";

describe("prototype routes", () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
    window.localStorage.clear();
  });

  it("renders the public finance-desk landing page", () => {
    render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /make room for the life/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open the demo desk/i })).toBeTruthy();
  });

  it("lets a visitor enter the dashboard through the mock sign-in", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/auth/sign-in"]}><App /></MemoryRouter>);
    await user.type(screen.getByLabelText("Email address"), "marina@example.com");
    await user.type(screen.getByLabelText("Password"), "demo1234");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(useDemoStore.getState().isAuthenticated).toBe(true);
    expect(screen.getByRole("heading", { name: /good morning/i })).toBeTruthy();
  });
});
