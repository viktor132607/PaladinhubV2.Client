export type PermissionDefinition = {
  id: string;
  resource: string;
  operation: string;
  description: string;
};

export type RoleSnapshot = {
  name: string;
  isDisabled: boolean;
  permissions: string[];
};

export function groupPermissions(
  catalog: readonly PermissionDefinition[],
): Array<{ resource: string; permissions: PermissionDefinition[] }> {
  const groups = new Map<string, PermissionDefinition[]>();
  for (const permission of catalog) {
    const values = groups.get(permission.resource) ?? [];
    values.push(permission);
    groups.set(permission.resource, values);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resource, permissions]) => ({
      resource,
      permissions: [...permissions].sort((left, right) =>
        left.operation.localeCompare(right.operation)),
    }));
}

export function parseRoleSnapshot(snapshot: string): RoleSnapshot | null {
  try {
    const raw = JSON.parse(snapshot);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    // Revision JSON is stored independently of the API's camelCase serializer.
    const parsed = {
      name: raw.name ?? raw.Name,
      isDisabled: raw.isDisabled ?? raw.IsDisabled,
      permissions: raw.permissions ?? raw.Permissions,
    };
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.isDisabled !== "boolean" ||
      !Array.isArray(parsed.permissions)
    ) return null;

    return {
      name: parsed.name,
      isDisabled: parsed.isDisabled,
      permissions: parsed.permissions.filter(
        (value: unknown): value is string => typeof value === "string",
      ),
    };
  } catch {
    return null;
  }
}
