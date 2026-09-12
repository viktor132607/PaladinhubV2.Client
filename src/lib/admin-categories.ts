import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";

export type Category = {
  id: number; name: string; description: string; parentId: number | null;
  sortOrder: number; isArchived: boolean; isDeleted: boolean; version: number;
  usageCount: number; childCount: number;
};

export function categoryPath(id: number, categories: Category[]): string {
  const names: string[] = [];
  const seen = new Set<number>();
  let current = categories.find(category => category.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id); names.unshift(current.name);
    current = categories.find(category => category.id === current!.parentId);
  }
  return names.join(" / ") || `Category #${id}`;
}

export function descendants(id: number, categories: Category[]): Set<number> {
  const result = new Set([id]);
  const queue = [id];
  for (let index = 0; index < queue.length; index++) {
    for (const category of categories) {
      if (category.parentId === queue[index] && !result.has(category.id)) {
        result.add(category.id); queue.push(category.id);
      }
    }
  }
  return result;
}

export async function adminRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    const csrf = await readApiJson<{ token?: string }>(await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" }));
    if (!csrf.token) throw new Error("The server did not return a CSRF token.");
    headers["X-CSRF-TOKEN"] = csrf.token;
    headers["Content-Type"] = "application/json";
  }
  return readApiJson<T>(await fetchBackend(path, { method, headers, cache: "no-store", signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }));
}
