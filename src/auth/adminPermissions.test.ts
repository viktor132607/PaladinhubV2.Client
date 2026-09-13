import { describe, expect, it } from "vitest";
import {
  adminPermissions,
  canEnterAdmin,
  hasAnyEffectivePermission,
  hasEffectivePermission,
} from "./adminPermissions";

describe("admin permission helpers", () => {
  it("uses exact effective permission IDs", () => {
    const effective = [adminPermissions.roles.read, adminPermissions.users.read];
    expect(hasEffectivePermission(effective, adminPermissions.roles.read)).toBe(true);
    expect(hasEffectivePermission(effective, adminPermissions.roles.update)).toBe(false);
  });

  it("allows a route when any required permission is effective", () => {
    expect(hasAnyEffectivePermission(
      [adminPermissions.userRoles.update],
      [adminPermissions.userRoles.read, adminPermissions.userRoles.update],
    )).toBe(true);
    expect(hasAnyEffectivePermission(
      [adminPermissions.users.read],
      [adminPermissions.roles.read, adminPermissions.roles.update],
    )).toBe(false);
  });

  it("opens the admin shell only when at least one effective permission exists", () => {
    expect(canEnterAdmin([])).toBe(false);
    expect(canEnterAdmin([adminPermissions.seo.read])).toBe(true);
  });
});
