import { describe, it, expect } from "vitest";
import { copyTemplate } from "./template-copy";
describe("template insertion", () => {
  it("copies nested trees with fresh IDs and preserves dependency links", () => {
    const tree = { type: "talenttree.dynamic", id: "tree", nodes: [{ id: "a", requires: [] }, { id: "b", requires: ["a"] }] };
    const original = JSON.stringify([{ type: "tabs", props: { tabs: [{ blocks: [tree] }] } }]);
    const first = JSON.parse(copyTemplate(original))[0].props.tabs[0].blocks[0];
    const second = JSON.parse(copyTemplate(original))[0].props.tabs[0].blocks[0];
    expect(first.id).not.toBe("tree"); expect(first.id).not.toBe(second.id);
    expect(first.nodes[1].requires).toEqual([first.nodes[0].id]);
    expect(first.nodes[0].id).not.toBe("a"); expect(tree.nodes[0].id).toBe("a");
  });
  it("preserves ordinary content", () => {
    const content = [{ type: "paragraph", Text: "Keep me" }];
    expect(JSON.parse(copyTemplate(JSON.stringify(content)))).toEqual(content);
  });
});
