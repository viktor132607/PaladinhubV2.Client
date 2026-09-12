export function translate(resources: Record<string,string>, key: string, fallback = key) {
  return Object.prototype.hasOwnProperty.call(resources, key) ? resources[key] : fallback;
}
// Only visible prose is translated; IDs, routes, icons, CSS and prerequisites stay intact.
const textFields = new Set(["text", "title", "label", "caption", "alt", "alternative", "description", "name"]);
export function localizeContent<T>(value: T, t: (key: string) => string): T {
  if (Array.isArray(value)) return value.map(child => localizeContent(child, t)) as T;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
    typeof child === "string" && textFields.has(key.toLowerCase()) ? t(child) : localizeContent(child, t),
  ])) as T;
}
export const sourceKeys = ["Home", "Holy Paladin", "Protection Paladin", "Retribution Paladin", "Overview", "Gear", "Talents", "Consumables", "Rotation", "Stats", "Discussion", "Privacy", "Merchandise", "Login", "Register", "My Account", "Settings", "Change Password", "Logout", "Logging out...", "My Cart", "Language", "Toggle navigation", "Made with 💛 for WoW Paladins"];
