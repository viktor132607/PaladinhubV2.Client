import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { resolveMessage } from "@/localization/catalog";
import SpellIconPicker from "./SpellIconPicker";

const state = vi.hoisted(() => ({ language: "en" }));
vi.mock("@/localization/LocalizationContext", () => ({
  useLocalization: () => ({ t: (key: string) => resolveMessage(state.language, {}, key) }),
}));

describe("image picker localization", () => {
  it.each(["en", "bg"])("renders actions, help and accessible labels in %s", (language) => {
    state.language = language;
    const html = renderToStaticMarkup(<SpellIconPicker value="/images/Holy Shock.jpg" onChange={() => {}} />);
    expect(html).toContain(language === "bg" ? "Преглед на базата" : "Browse database");
    expect(html).toContain(language === "bg" ? "Поставяне на изображение / адрес" : "Paste image / URL");
    expect(html).toContain(language === "bg" ? "Качване: Икона" : "Upload Icon");
    expect(html).toContain(language === "bg" ? "Избрано: Икона" : "Selected Icon");
    expect(html).toContain('value="/images/Holy Shock.jpg"');
    expect(html).toContain('accept="image/png,image/jpeg,image/gif,image/webp"');
    expect(html).toContain('href="/Admin/Media"');
  });
  it("preserves upload, browse and manage permission restrictions", () => {
    state.language = "bg";
    const html = renderToStaticMarkup(<SpellIconPicker value="" onChange={() => {}} allowBrowse={false} allowUpload={false} allowManage={false} />);
    expect(html).not.toContain('href="/Admin/Media"');
    expect(html).toMatch(/disabled=""[^>]*>Преглед на базата/);
    expect(html).toMatch(/disabled=""[^>]*>Качване на изображение/);
  });
  it("has Bulgarian translations for every locally generated error", () => {
    const source = readFileSync(new URL("./SpellIconPicker.tsx", import.meta.url), "utf8");
    const literals = [...source.matchAll(/(?:setError\(|new Error\(|cause\.message : )"([^"]+)"/g)].map(match => match[1]);
    expect(literals.length).toBeGreaterThanOrEqual(8);
    for (const text of literals) expect(resolveMessage("bg", {}, text)).not.toBe(text);
    expect(resolveMessage("bg", {}, "Unrecognized server error")).toBe("Unrecognized server error");
  });
});
