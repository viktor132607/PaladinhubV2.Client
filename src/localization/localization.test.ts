import { describe, expect, it } from "vitest";
import { contentScope, localizeContent, translate } from "./content";
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
    expect(tree.title).toBe("Заглавие"); expect(tree.nodes![0].name).toBe("Title");
    expect(tree.nodes![0].id).toBe("Title"); expect(tree.nodes![0].requires).toEqual(["Title"]);
    expect(tree.nodes![0].icon).toBe("Title");
    expect(result[0].props.tabs[0].blocks[1].Url).toBe("Title");
    expect(result[0].props.tabs[0].blocks[1].Alt).toBe("Заглавие");
    expect(source[0].props.tabs[0].label).toBe("Title");
  });
  it("retains stable translations across wording changes and identified block reordering", () => {
    const resources = { "page.42.id.first.title": "Първи раздел" };
    const t = (key: string, fallback?: string) => translate(resources, key, fallback);
    const a = { id: "first", title: "Original" };
    const b = { id: "second", title: "Other" };
    expect(localizeContent([a, b], t, contentScope(42))[0].title).toBe("Първи раздел");
    expect(localizeContent([b, { ...a, title: "Edited" }], t, contentScope(42))[1].title).toBe("Първи раздел");
    expect(localizeContent([a], t, contentScope(43))[0].title).toBe("Original");
  });
  it("keeps parent paths distinct for repeated nested identifiers", () => {
    const resources = { "page.42.id.a.children.id.same.text": "Само A" };
    const t = (key: string, fallback?: string) => translate(resources, key, fallback);
    const source = ["a", "b"].map(id => ({ id, children: [{ id: "same", text: "Source" }] }));
    const result = localizeContent(source, t, contentScope(42));
    expect(result[0].children[0].text).toBe("Само A");
    expect(result[1].children[0].text).toBe("Source");
  });
  it("preserves intentional empty and English overrides over legacy source translations", () => {
    const source = [{ Id: "a", title: "Title", name: "Holy Shock" }];
    for (const override of ["", "Title"]) {
      const resources = { Title: "Заглавие", "page.42.id.a.title": override };
      const result = localizeContent(source, (key, fallback) => translate(resources, key, fallback), contentScope(42));
      expect(result[0].title).toBe(override);
      expect(result[0].name).toBe("Holy Shock");
      expect(source[0].title).toBe("Title");
    }
  });
  it("escapes identifier separators and supports legacy blocks without an ID", () => {
    expect(contentScope("a.b")).toBe("page.a%2Eb");
    const resources = { "page.1.0.text": "Текст" };
    expect(localizeContent([{ text: "Text" }], (key, fallback) => translate(resources, key, fallback), contentScope(1))[0].text).toBe("Текст");
  });
});
