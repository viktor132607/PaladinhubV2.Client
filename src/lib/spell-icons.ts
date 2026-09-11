import { backendUrl } from "@/config/api";

/** Database uploads belong to the API host; legacy filenames belong to the client. */
export function spellIconSource(value?: string | null): string {
  const icon = value?.trim() ?? "";
  if (!icon) return "";
  if (/^https?:\/\//i.test(icon) || icon.startsWith("//")) return icon;
  if (icon.startsWith("/api/spell-icons/")) return backendUrl(icon);
  if (icon.startsWith("/")) return icon;
  let filename = icon;
  try { filename = decodeURIComponent(icon); } catch { /* Keep a literal filename. */ }
  return `/images/SpellIcons/${encodeURIComponent(filename)}`;
}
