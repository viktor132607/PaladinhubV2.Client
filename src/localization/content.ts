export function translate(resources: Record<string,string>, key: string, fallback = key) {
  return Object.prototype.hasOwnProperty.call(resources, key) ? resources[key] : fallback;
}
// Proper WoW names, routes, media references, IDs and prerequisites are not prose.
const textFields = new Set(["text", "title", "label", "caption", "alt", "alternative", "description", "note"]);
type Translator = (key: string, fallback?: string) => string;
const segment = (value: string | number) => encodeURIComponent(String(value)).replace(/\./g, "%2E");
export function contentScope(pageId: string | number): string {
  return `page.${segment(pageId)}`;
}
export function localizeContent<T>(value: T, t: Translator, scope = "content"): T {
  function visit(input: unknown, path: string): unknown {
    if (Array.isArray(input)) return input.map((child, index) => {
      const record = child && typeof child === "object" ? child as Record<string, unknown> : null;
      const id = record?.id ?? record?.Id;
      const identity = (typeof id === "string" && id.length > 0) || typeof id === "number";
      return visit(child, `${path}.${identity ? `id.${segment(id as string | number)}` : index}`);
    });
    if (!input || typeof input !== "object") return input;
    return Object.fromEntries(Object.entries(input).map(([field, child]) => {
      const key = `${path}.${segment(field)}`;
      if (typeof child !== "string" || !textFields.has(field.toLowerCase())) return [field, visit(child, key)];
      // Resolve the legacy source key first, then give the stable editorial key
      // precedence. Explicit empty values and explicit English overrides survive.
      const legacy = t(child, child);
      const localized = t(key, legacy);
      return [field, localized === key ? legacy : localized];
    }));
  }
  return visit(value, scope) as T;
}
export const sourceKeys = ["Home", "Holy Paladin", "Protection Paladin", "Retribution Paladin", "Overview", "Gear", "Talents", "Consumables", "Rotation", "Stats", "Discussion", "Privacy", "Merchandise", "Login", "Register", "My Account", "Settings", "Change Password", "Logout", "Logging out...", "My Cart", "Language", "Toggle navigation", "Made with 💛 for WoW Paladins"];
