import { describe, expect, it } from "vitest";
import {
  createTree,
  validateTree,
  changeRank,
  removeTalent,
  replaceTree,
  type Tree,
} from "./model";
function fixture(): Tree {
  return {
    ...createTree(),
    points: 4,
    nodes: [
      {
        id: "a",
        name: "Root",
        description: "",
        icon: "",
        row: 1,
        column: 1,
        maxRank: 2,
        requires: [],
      },
      {
        id: "b",
        name: "Child",
        description: "",
        icon: "",
        row: 2,
        column: 1,
        maxRank: 1,
        requires: ["a"],
      },
      {
        id: "c",
        name: "Leaf",
        description: "",
        icon: "",
        row: 3,
        column: 1,
        maxRank: 1,
        requires: ["b"],
      },
    ],
  };
}
describe("independent talent builder", () => {
  it("creates independent serializable trees", () => {
    const a = createTree(),
      b = createTree();
    expect(a.id).not.toBe(b.id);
    expect(validateTree(JSON.parse(JSON.stringify(a)))).toEqual([]);
  });
  it("rejects cycles and dangling prerequisites", () => {
    const t = fixture();
    t.nodes[0].requires = ["c"];
    expect(validateTree(t).join()).toContain("cycle");
    t.nodes[0].requires = ["missing"];
    expect(validateTree(t).join()).toContain("existing");
  });
  it("rejects overlapping cells, invalid ranks and grid shrinkage", () => {
    const t = fixture();
    t.nodes[1].row = 1;
    expect(validateTree(t).join()).toContain("same cell");
    t.nodes[1].row = 2;
    t.nodes[1].maxRank = 0;
    expect(validateTree(t).join()).toContain("ranks");
    t.nodes[1].maxRank = 1;
    t.rows = 2;
    expect(validateTree(t).join()).toContain("outside");
  });
  it("enforces prerequisites, maximum rank and point budget", () => {
    const t = fixture();
    expect(changeRank(t, {}, "b", 1)).toEqual({});
    expect(changeRank(t, { a: 1 }, "b", 1)).toEqual({ a: 1 });
    expect(changeRank(t, { a: 2 }, "b", 1)).toEqual({ a: 2, b: 1 });
    expect(changeRank(t, { a: 2 }, "a", 1)).toEqual({ a: 2 });
    t.points = 2;
    expect(changeRank(t, { a: 2 }, "b", 1)).toEqual({ a: 2 });
  });
  it("refunds all invalidated descendants without changing the input", () => {
    const ranks = { a: 2, b: 1, c: 1 };
    expect(changeRank(fixture(), ranks, "a", -1)).toEqual({ a: 1, b: 0, c: 0 });
    expect(ranks).toEqual({ a: 2, b: 1, c: 1 });
  });
  it("deletes a node and its connections without changing unrelated nodes", () => {
    const t = fixture(),
      next = removeTalent(t, "b");
    expect(next.nodes.map((n) => n.id)).toEqual(["a", "c"]);
    expect(next.nodes[1].requires).toEqual([]);
    expect(t.nodes).toHaveLength(3);
    expect(validateTree(next)).toEqual([]);
  });
  it("preserves legacy blocks and updates only the chosen new tree", () => {
    const old = { type: "talenttree", TreeKey: "holy", Build: "original" },
      first = fixture(),
      second = createTree();
    const layout = JSON.stringify([old, first, second]);
    const next = JSON.parse(replaceTree(layout, { ...first, title: "Edited" }));
    expect(next[0]).toEqual(old);
    expect(next[1].title).toBe("Edited");
    expect(next[2]).toEqual(second);
    expect(() => replaceTree(layout, { ...first, points: -1 })).toThrow();
  });
  it("requires all parents in branching trees", () => {
    const t = fixture();
    t.nodes[2].requires = ["a", "b"];
    expect(changeRank(t, { a: 2 }, "c", 1)).toEqual({ a: 2 });
    expect(changeRank(t, { a: 2, b: 1 }, "c", 1)).toEqual({ a: 2, b: 1, c: 1 });
  });
});
