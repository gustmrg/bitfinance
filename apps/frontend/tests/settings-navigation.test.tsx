import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { OrganizationSettingsTabs } from "../src/components/navigation/settings-tabs";
import {
  canManageOrganization,
  findMemberRole,
} from "../src/pages/organizations/member-permissions";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("organization settings scope", () => {
  it.each(["/settings/organization", "/settings/members"])(
    "keeps %s canonical and active",
    (path) => {
      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          { initialEntries: [path] },
          createElement(OrganizationSettingsTabs),
        ),
      );
      expect(html).toContain('aria-label="nav.organizationSettings"');
      expect(html).toContain('href="/settings/organization"');
      expect(html).toContain('href="/settings/members"');
      expect(html).toMatch(new RegExp('aria-current="page"[^>]*href="' + path + '"'));
      expect(html).not.toContain("/settings/account");
      expect(html).toContain("overflow-x-auto");
    },
  );
  it.each(["Owner", "Admin"])("retains management permissions for %s", (role) => {
    const members = [{ id: "me", role }];
    expect(canManageOrganization(findMemberRole(members, "me"))).toBe(true);
  });
  it("does not give members or unknown roles administrative permissions", () => {
    for (const role of ["Member", "unknown", undefined]) {
      expect(canManageOrganization(findMemberRole([{ id: "me", role }], "me"))).toBe(false);
    }
  });
});
