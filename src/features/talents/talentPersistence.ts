import { backendEndpoints, fetchBackend } from "@/config/api";

export type TalentNodeState = {
  id: string;
  active: boolean;
};

const storageKey = (treeKey: string) => `talents:${treeKey}`;

export function loadLocalTalentSelection(treeKey: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(treeKey)) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveLocalTalentSelection(
  treeKey: string,
  selectedNodeIds: string[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(storageKey(treeKey), JSON.stringify(selectedNodeIds));
  } catch {
    // Local storage is an optional fallback. Ignore browser privacy failures.
  }
}

export async function saveTalentState(
  treeKey: string,
  nodes: TalentNodeState[],
): Promise<boolean> {
  try {
    const response = await fetchBackend(backendEndpoints.talents.save(treeKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: treeKey, nodes }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
