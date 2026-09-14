import { describe, expect, it } from "vitest";
import { parseRoleSnapshot } from "./admin-access-control-helpers";
describe("stored role snapshot contract", () => {
  it.each([
    '{"Name":"Editor","IsDisabled":false,"Permissions":["seo.read"]}',
    '{"name":"Editor","isDisabled":false,"permissions":["seo.read"]}',
  ])("reads current and legacy revision JSON", snapshot => {
    expect(parseRoleSnapshot(snapshot)).toEqual({name:"Editor",isDisabled:false,permissions:["seo.read"]});
  });
  it.each(["null", "[]", "{}", "broken"])("rejects invalid snapshots", snapshot => {
    expect(parseRoleSnapshot(snapshot)).toBeNull();
  });
});
