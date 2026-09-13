import { adminRequest } from "@/lib/admin-categories";

const root = "/Admin/api/access-control";
const encode = (value: string | number) => encodeURIComponent(String(value));

export type PermissionDefinition = {
  id: string;
  resource: string;
  operation: string;
  description: string;
};

export type AccessRole = {
  id: string;
  name: string;
  isSystem: boolean;
  isDisabled: boolean;
  version: number;
  userCount: number;
  permissions: string[];
};

export type RoleUserSummary = {
  id: string;
  userName: string;
  email?: string | null;
};

export type UserRoleSummary = {
  id: string;
  userName: string;
  email?: string | null;
  roles: string[];
};

export type RoleSecurityRevision = {
  version: number;
  action: string;
  actor: string;
  createdAtUtc: string;
  snapshot: string;
};

export type AccessControlAudit = {
  id: string;
  action: string;
  actorId: string;
  actor: string;
  targetRoleId?: string | null;
  targetRoleName?: string | null;
  targetUserId?: string | null;
  targetUserName?: string | null;
  createdAtUtc: string;
  oldState: string;
  newState: string;
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
    const parsed = JSON.parse(snapshot) as Partial<RoleSnapshot>;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.isDisabled !== "boolean" ||
      !Array.isArray(parsed.permissions)
    ) return null;
    return {
      name: parsed.name,
      isDisabled: parsed.isDisabled,
      permissions: parsed.permissions.filter(
        (value): value is string => typeof value === "string",
      ),
    };
  } catch {
    return null;
  }
}

export const accessControlApi = {
  permissions: () => adminRequest<PermissionDefinition[]>(`${root}/permissions`),
  roles: () => adminRequest<AccessRole[]>(`${root}/roles`),
  role: (roleId: string) =>
    adminRequest<AccessRole>(`${root}/roles/${encode(roleId)}`),
  createRole: (name: string, permissions: readonly string[]) =>
    adminRequest<AccessRole>(root + "/roles", "POST", { name, permissions }),
  updateRole: (roleId: string, name: string, isDisabled: boolean, version: number) =>
    adminRequest<AccessRole>(`${root}/roles/${encode(roleId)}`, "PUT", {
      name,
      isDisabled,
      version,
    }),
  deleteRole: (roleId: string, version: number) =>
    adminRequest<void>(`${root}/roles/${encode(roleId)}?version=${encode(version)}`, "DELETE"),
  replacePermissions: (roleId: string, permissions: readonly string[], version: number) =>
    adminRequest<AccessRole>(`${root}/roles/${encode(roleId)}/permissions`, "PUT", {
      permissions,
      version,
    }),
  history: (roleId: string) =>
    adminRequest<RoleSecurityRevision[]>(`${root}/roles/${encode(roleId)}/history`),
  restore: (roleId: string, revisionVersion: number, version: number) =>
    adminRequest<AccessRole>(`${root}/roles/${encode(roleId)}/restore`, "POST", {
      revisionVersion,
      version,
    }),
  roleUsers: (roleId: string) =>
    adminRequest<RoleUserSummary[]>(`${root}/roles/${encode(roleId)}/users`),
  users: (search = "") =>
    adminRequest<UserRoleSummary[]>(`${root}/users${search.trim() ? `?search=${encode(search.trim())}` : ""}`),
  assignUser: (roleId: string, userId: string) =>
    adminRequest<void>(`${root}/roles/${encode(roleId)}/users/${encode(userId)}`, "POST", {}),
  revokeUser: (roleId: string, userId: string) =>
    adminRequest<void>(`${root}/roles/${encode(roleId)}/users/${encode(userId)}`, "DELETE"),
  audit: (roleId?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (roleId) params.set("roleId", roleId);
    if (userId) params.set("userId", userId);
    const query = params.toString();
    return adminRequest<AccessControlAudit[]>(`${root}/audit${query ? `?${query}` : ""}`);
  },
};
