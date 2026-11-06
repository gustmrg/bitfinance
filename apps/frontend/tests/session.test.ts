import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = (token = "renewed") => ({
  accessToken: token,
  accessTokenExpiresAt: "2030-01-01T00:00:00Z",
  user: {
    id: "1",
    email: "test@example.com",
    userName: "test",
    firstName: "Test",
    lastName: "User",
  },
});
function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { config, data, status, statusText: String(status), headers: new AxiosHeaders() };
}
function reject(config: InternalAxiosRequestConfig, status: number) {
  throw new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    config,
    undefined,
    response(config, {}, status),
  );
}
async function load() {
  vi.resetModules();
  const client = await import("../src/api/shared/client");
  const token = await import("../src/lib/auth-token");
  const events = await import("../src/api/shared/session-events");
  const expired = vi.fn();
  events.setSessionExpiredListener(expired);
  return { ...client, ...token, expired };
}
beforeEach(() => vi.stubGlobal("navigator", {}));
afterEach(() => vi.unstubAllGlobals());

describe("session renewal", () => {
  it("deduplicates bootstrap and concurrent refresh requests (including StrictMode)", async () => {
    const tab = await load();
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) =>
      response(config, session()),
    );
    tab.publicApi.defaults.adapter = adapter;
    const first = tab.refreshSession();
    expect(tab.refreshSession()).toBe(first);
    await Promise.all([first, tab.refreshSession()]);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(tab.getAccessToken()).toBe("renewed");
  });
  it("renews an expired access token and retries the original request", async () => {
    const tab = await load();
    tab.setAccessToken("expired", "2000-01-01T00:00:00Z");
    tab.publicApi.defaults.adapter = async (config) => response(config, session());
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (config.headers.Authorization === "Bearer expired") return reject(config, 401);
      return response(config, { ok: true });
    });
    tab.authApi.defaults.adapter = adapter;
    expect((await tab.authApi.get("/identity/me")).data).toEqual({ ok: true });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(tab.expired).not.toHaveBeenCalled();
  });
  it("shares one refresh for multiple concurrent 401 responses", async () => {
    const tab = await load();
    tab.setAccessToken("old", "2000-01-01T00:00:00Z");
    const refresh = vi.fn(async (config: InternalAxiosRequestConfig) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return response(config, session());
    });
    tab.publicApi.defaults.adapter = refresh;
    tab.authApi.defaults.adapter = async (config) =>
      config.headers.Authorization === "Bearer old" ? reject(config, 401) : response(config, {});
    await Promise.all([tab.authApi.get("/a"), tab.authApi.get("/b")]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])(
    "notifies explicit session expiration for refresh status %s",
    async (status) => {
      const tab = await load();
      tab.publicApi.defaults.adapter = async (config) => reject(config, status);
      tab.authApi.defaults.adapter = async (config) => reject(config, 401);
      await expect(tab.authApi.get("/a")).rejects.toBeInstanceOf(AxiosError);
      expect(tab.expired).toHaveBeenCalledTimes(1);
      expect(tab.getAccessToken()).toBeNull();
    },
  );
  it.each([500, 503])("preserves session on transient refresh status %s", async (status) => {
    const tab = await load();
    tab.setAccessToken("old", "2000-01-01T00:00:00Z");
    tab.publicApi.defaults.adapter = async (config) => reject(config, status);
    tab.authApi.defaults.adapter = async (config) => reject(config, 401);
    await expect(tab.authApi.get("/a")).rejects.toBeInstanceOf(AxiosError);
    expect(tab.expired).not.toHaveBeenCalled();
    expect(tab.getAccessToken()).toBe("old");
  });
  it("does not invalidate a session on a network failure", async () => {
    const tab = await load();
    tab.publicApi.defaults.adapter = async (config) => {
      throw new AxiosError("Offline", "ERR_NETWORK", config);
    };
    tab.authApi.defaults.adapter = async (config) => reject(config, 401);
    await expect(tab.authApi.get("/a")).rejects.toBeInstanceOf(AxiosError);
    expect(tab.expired).not.toHaveBeenCalled();
  });
  it("never loops when a retried request is still unauthorized", async () => {
    const tab = await load();
    const refresh = vi.fn(async (config: InternalAxiosRequestConfig) =>
      response(config, session()),
    );
    tab.publicApi.defaults.adapter = refresh;
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => reject(config, 401));
    tab.authApi.defaults.adapter = adapter;
    await expect(tab.authApi.get("/a")).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
  });
  it("does not restore a refresh response after explicit logout", async () => {
    const tab = await load();
    let release!: () => void;
    tab.publicApi.defaults.adapter = async (config) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return response(config, session());
    };
    const refresh = tab.refreshSession();
    tab.resetRefreshState();
    release();
    await expect(refresh).rejects.toMatchObject({ code: "ERR_CANCELED" });
    expect(tab.getAccessToken()).toBeNull();
  });
  it("serializes cookie rotation between two independent tabs and a reopened tab", async () => {
    let queue = Promise.resolve();
    const locks = {
      request: vi.fn((_name: string, callback: () => Promise<unknown>) => {
        const operation = queue.then(callback);
        queue = operation.then(() => undefined);
        return operation;
      }),
    };
    vi.stubGlobal("navigator", { locks });
    let cookie = 0;
    const first = await load();
    const second = await load();
    const adapter = async (config: InternalAxiosRequestConfig) => {
      const presented = cookie;
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (presented !== cookie) return reject(config, 401);
      cookie += 1;
      return response(config, session(`access-${cookie}`));
    };
    first.publicApi.defaults.adapter = second.publicApi.defaults.adapter = adapter;
    await Promise.all([first.refreshSession(), second.refreshSession()]);
    expect(cookie).toBe(2);
    const reopened = await load();
    reopened.publicApi.defaults.adapter = adapter;
    await reopened.refreshSession();
    expect(reopened.getAccessToken()).toBe("access-3");
    expect(locks.request).toHaveBeenCalledTimes(3);
  });
});
