import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { resolveMessage } from "@/localization/catalog";
import AdminLayout from "./AdminLayout";

const state = vi.hoisted(() => ({ language: "en", allowed: true }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => ({ hasAnyPermission: () => state.allowed }) }));
vi.mock("@/components/layout/Navbar", () => ({ default: () => null }));
vi.mock("@/router/nextCompat", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>,
  Outlet: () => <div>Content placeholder</div>,
  useLocation: () => ({ pathname: "/Admin/Database" }),
}));
vi.mock("@/localization/LocalizationContext", () => ({
  useLocalization: () => ({ t: (key: string) => resolveMessage(state.language, {}, key) }),
}));

describe("administrative navigation localization", () => {
  it.each(["en", "bg"])("translates code-owned labels in %s without changing routes", (language) => {
    state.language = language;
    state.allowed = true;
    const html = renderToStaticMarkup(<AdminLayout />);
    expect(html).toContain(language === "bg" ? "Конструктор на страници" : "Page Builder");
    expect(html).toContain(language === "bg" ? "Административни връзки: Съдържание" : "Content admin links");
    expect(html).toContain(language === "bg" ? "Административни раздели" : "Admin sections");
    expect(html).toContain(language === "bg" ? "Административен панел" : "Admin Panel");
    expect(html).toContain('data-admin-theme="light"');
    expect(html).toContain(language === "bg" ? "Превключи към тъмна тема" : "Switch to dark theme");
    expect(html).toContain('href="/Admin/PageBuilder"');
    expect(html).toContain('href="/Admin/Translations"');
    expect(html).toContain('href="/Admin/Database"');
    if (language === "bg") expect(html).not.toContain(">Page Builder<");
  });
  it("does not expose links without permission in either language", () => {
    state.allowed = false;
    for (const language of ["en", "bg"]) {
      state.language = language;
      expect(renderToStaticMarkup(<AdminLayout />)).not.toContain('href="/Admin/');
    }
  });
});
