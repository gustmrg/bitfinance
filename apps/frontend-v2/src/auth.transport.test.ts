// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { authApi, resetRefreshState } from "./api/shared/client";
import { getAccessToken, clearAccessToken, setAccessToken } from "./lib/auth-token";
import { server } from "./test/server";

afterEach(() => { clearAccessToken(); resetRefreshState(); });

describe("authenticated transport", () => {
  it("refreshes concurrent 401 responses only once and retries both requests", async () => {
    let refreshCalls = 0; let protectedCalls = 0;
    server.use(
      http.get("/api/v1/protected", () => { protectedCalls += 1; return protectedCalls <= 2 ? HttpResponse.json({ message: "expired" }, { status: 401 }) : HttpResponse.json({ ok: true }); }),
      http.post("/api/v1/identity/refresh", () => { refreshCalls += 1; return HttpResponse.json({ accessToken: "fresh-token", accessTokenExpiresAt: "2099-01-01T00:00:00.000Z" }); }),
    );
    setAccessToken("old-token", "2020-01-01T00:00:00.000Z");
    await Promise.all([authApi.get("/protected"), authApi.get("/protected")]);
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(4);
    expect(getAccessToken()).toBe("fresh-token");
  });

  it("clears the in-memory token when refresh fails and never persists it", async () => {
    server.use(
      http.get("/api/v1/protected", () => HttpResponse.json({ message: "expired" }, { status: 401 })),
      http.post("/api/v1/identity/refresh", () => HttpResponse.json({ message: "invalid" }, { status: 401 })),
    );
    setAccessToken("secret-token", "2020-01-01T00:00:00.000Z");
    await expect(authApi.get("/protected")).rejects.toBeTruthy();
    expect(getAccessToken()).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
});
