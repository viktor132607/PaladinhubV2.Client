import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { resolveMessage } from "@/localization/catalog";
import DatabaseBackup from "./DatabaseBackup";

const state = vi.hoisted(() => ({ permissions: [] as string[], language: "en" }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => ({ hasPermission: (key: string) => state.permissions.includes(key), refresh: vi.fn() }) }));
vi.mock("@/localization/LocalizationContext", () => ({ useLocalization: () => ({ t: (key: string) => resolveMessage(state.language, {}, key) }) }));

describe("database backup access", () => {
  it("does not grant backup actions to database readers", () => {
    state.permissions = ["database.read"];
    const html = renderToStaticMarkup(<DatabaseBackup />);
    expect(html).not.toContain("<button");
    expect(html).not.toContain('type="file"');
  });
  it("separates export permission from destructive restore", () => {
    state.permissions = ["database_backups.read"];
    const html = renderToStaticMarkup(<DatabaseBackup />);
    expect(html).toContain("Download full archive");
    expect(html).not.toContain('type="file"');
  });
  it.each(["en", "bg"])("requires an archive and confirmation before restore in %s", language => {
    state.language = language; state.permissions = ["database_backups.restore"];
    const html = renderToStaticMarkup(<DatabaseBackup />);
    expect(html).toContain('id="backup-confirmation"');
    expect(html).toContain('id="backup-archive"');
    expect(html).toContain('disabled=""');
    expect(html).toContain(language === "bg" ? "Възстанови базата" : "Restore database");
  });
});
