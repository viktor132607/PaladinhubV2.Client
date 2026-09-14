import catalog from "./catalog.json";
export type CatalogKey = keyof typeof catalog;
const messages: Record<string, {en: string; bg: string}> = catalog;
const sourceKeys = new Map(Object.entries(messages).map(([key, entry]) => [entry.en, key]));
export function resolveMessage(language: string, resources: Record<string, string>, key: string, fallback?: string): string {
  const catalogKey = Object.prototype.hasOwnProperty.call(messages, key) ? key : sourceKeys.get(key);
  if (catalogKey && Object.prototype.hasOwnProperty.call(resources, catalogKey)) return resources[catalogKey];
  if (Object.prototype.hasOwnProperty.call(resources, key)) return resources[key];
  const entry = catalogKey ? messages[catalogKey] : undefined;
  if (entry && Object.prototype.hasOwnProperty.call(resources, entry.en) && resources[entry.en] !== entry.en) return resources[entry.en];
  return entry ? (language.toLowerCase().split("-")[0] === "bg" ? entry.bg : entry.en) : fallback ?? key;
}
export function formatMessage(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : token);
}
