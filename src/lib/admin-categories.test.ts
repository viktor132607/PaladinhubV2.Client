import { describe, expect, it, vi } from "vitest";
vi.mock("@/config/api", () => ({ backendEndpoints: {}, fetchBackend: vi.fn(), readApiJson: vi.fn() }));
import { categoryPath, descendants, type Category } from "./admin-categories";

const category = (id: number, name: string, parentId: number | null): Category => ({
  id, name, parentId, description: "", sortOrder: 0, isArchived: false, isDeleted: false, version: 1, usageCount: 0, childCount: 0,
});
describe("category hierarchy", () => {
  const tree = [category(1, "Paladin", null), category(2, "Holy", 1), category(3, "Healing", 2), category(4, "Warrior", null)];
  it("shows the complete path", () => expect(categoryPath(3, tree)).toBe("Paladin / Holy / Healing"));
  it("excludes every descendant from parent choices", () => expect([...descendants(1, tree)]).toEqual([1, 2, 3]));
  it("does not loop on corrupt cyclic input", () => {
    const cyclic = [category(1, "One", 2), category(2, "Two", 1)];
    expect(descendants(1, cyclic).size).toBe(2);
    expect(categoryPath(1, cyclic)).toBe("Two / One");
  });
  it("keeps a stable label for missing categories", () => expect(categoryPath(99, tree)).toBe("Category #99"));
  it("includes archived descendants", () => expect([...descendants(1, tree.map(c => ({ ...c, isArchived: true })))]).toEqual([1, 2, 3]));
});
