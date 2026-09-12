import { describe, expect, it } from "vitest";
import { localizeContent, translate } from "./content";
describe("managed localization", () => {
  it("uses explicit fallback for absent keys, including prototype property names", () => {
    expect(translate({ Home: "Начало" }, "Home")).toBe("Начало");
    expect(translate({}, "Missing", "English source")).toBe("English source");
    expect(translate({}, "constructor")).toBe("constructor");
    expect(translate({ Home: "" }, "Home")).toBe("");
  });
  it("translates nested visible text without changing identity, links or dependencies", () => {
    const source = [{ type: "tabs", id: "Title", props: { tabs: [{ label: "Title", blocks: [{ type: "talenttree.dynamic", title: "Title", nodes: [{ id: "Title", name: "Title", icon: "Title", requires: ["Title"] }] }, { type: "image", Url: "Title", Alt: "Title", className: "Title" }] }] } }];
    const result = localizeContent(source, key => key === "Title" ? "Заглавие" : key);
    expect(result[0].id).toBe("Title"); expect(result[0].props.tabs[0].label).toBe("Заглавие");
    const tree = result[0].props.tabs[0].blocks[0];
    expect(tree.title).toBe("Заглавие"); expect(tree.nodes![0].name).toBe("Заглавие");
    expect(tree.nodes![0].id).toBe("Title"); expect(tree.nodes![0].requires).toEqual(["Title"]);
    expect(tree.nodes![0].icon).toBe("Title");
    expect(result[0].props.tabs[0].blocks[1].Url).toBe("Title");
    expect(result[0].props.tabs[0].blocks[1].Alt).toBe("Заглавие");
    expect(source[0].props.tabs[0].label).toBe("Title");
  });
});
