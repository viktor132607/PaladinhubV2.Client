import { describe, expect, it } from "vitest";
import catalog from "./catalog.json";
import { formatMessage, resolveMessage } from "./catalog";

describe("built-in bilingual catalog", () => {
  it("has complete values and matching interpolation variables for every key", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match => match[1]).sort();
    for (const [key, message] of Object.entries(catalog)) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/);
      expect(message.en.trim()).not.toBe("");
      expect(message.bg.trim()).not.toBe("");
      expect(placeholders(message.bg)).toEqual(placeholders(message.en));
      if (message.en === message.bg) expect("reason" in message).toBe(true);
    }
  });
  it("works offline and falls back to English for unsupported languages", () => {
    expect(resolveMessage("bg", {}, "nav.home")).toBe("Начало");
    expect(resolveMessage("bg-BG", {}, "nav.home")).toBe("Начало");
    expect(resolveMessage("de", {}, "nav.home")).toBe("Home");
    expect(resolveMessage("bg", {}, "missing", "Source")).toBe("Source");
  });
  it("preserves explicit editor overrides, including intentional empty values", () => {
    expect(resolveMessage("bg", {"nav.home":"Custom"}, "nav.home")).toBe("Custom");
    expect(resolveMessage("bg", {"nav.home":""}, "nav.home")).toBe("");
    expect(resolveMessage("bg", {}, "constructor", "Safe")).toBe("Safe");
  });
  it("applies stable CMS keys when a code-owned label uses its English alias", () => {
    expect(resolveMessage("bg", { "admin.pages": "Мои страници" }, "Pages")).toBe("Мои страници");
    expect(resolveMessage("bg", { "admin.pages": "" }, "Pages")).toBe("");
    expect(resolveMessage("bg", { "admin.pages": "Stable", Pages: "Legacy" }, "Pages")).toBe("Stable");
    expect(resolveMessage("bg", { Pages: "Legacy" }, "admin.pages")).toBe("Legacy");
  });
  it("substitutes named parameters without interpreting user text as another template", () => {
    expect(formatMessage("Изтриване на {name}", {name:"{other}"})).toBe("Изтриване на {other}");
    expect(formatMessage("Missing {name}", {})).toBe("Missing {name}");
  });
});
