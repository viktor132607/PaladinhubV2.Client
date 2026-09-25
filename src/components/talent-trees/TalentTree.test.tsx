import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TalentTree from "./TalentTree";
import { validPublishedTrees } from "./PublishedTalentTrees";

describe("published talent trees", () => {
  it("shows the existing spell effect and icon without selection or save controls", () => {
    const html = renderToStaticMarkup(
      <TalentTree treeKey="paladin" nodes={[
        { id: "auras", name: "Auras of the Resolute", column: 1, row: 1 },
        { id: "afterimage", name: "Afterimage", column: 2, row: 1 },
      ]} />,
    );

    expect(html).toContain('href="https://www.wowhead.com/spell=385633/auras-of-the-resolute"');
    expect(html).toContain("Devotion%20Aura.jpg");
    expect(html).toContain('href="https://www.wowhead.com/spell=385414/afterimage"');
    expect(html).not.toContain('type="button"');
    expect(html).not.toContain("Saving talent selection");
    expect(html).not.toContain("points</span>");
  });

  it("rejects invalid published layouts", () => {
    expect(validPublishedTrees([{ title: "Broken", nodes: [] }])).toBe(false);
    expect(validPublishedTrees([])).toBe(false);
  });
});
