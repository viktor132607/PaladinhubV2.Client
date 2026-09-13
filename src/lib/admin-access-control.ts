import { adminRequest } from "./admin-categories";
export {
  groupPermissions,
  parseRoleSnapshot,
} from "./admin-access-control-helpers";
export type {
  PermissionDefinition,
  RoleSnapshot,
} from "./admin-access-control-helpers";
import type { PermissionDefinition } from "./admin-access-control-helpers";

const root = "/Admin/api/access-control";
const encode = (value: string | number) => encodeURIComponent(String(value));

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
