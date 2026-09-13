import { describe, expect, it } from "vitest";
import { groupPermissions, parseRoleSnapshot } from "./admin-access-control-helpers";

describe("access-control client helpers", () => {
  it("groups permission definitions by resource and operation", () => {
    const grouped = groupPermissions([
      { id: "roles.update", resource: "roles", operation: "update", description: "" },
      { id: "users.read", resource: "users", operation: "read", description: "" },
      { id: "roles.read", resource: "roles", operation: "read", description: "" },
    ]);

    expect(grouped.map((group) => group.resource)).toEqual(["roles", "users"]);
    expect(grouped[0]?.permissions.map((permission) => permission.operation)).toEqual(["read", "update"]);
  });

  it("parses valid revision snapshots and rejects malformed snapshots", () => {
    expect(parseRoleSnapshot(JSON.stringify({
      name: "Editors",
      isDisabled: false,
      permissions: ["pages.read", "pages.update"],
    }))).toEqual({
      name: "Editors",
      isDisabled: false,
      permissions: ["pages.read", "pages.update"],
    });

    expect(parseRoleSnapshot("{broken")).toBeNull();
    expect(parseRoleSnapshot(JSON.stringify({ name: "Missing fields" }))).toBeNull();
  });
});
