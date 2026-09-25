import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TalentTree, { edgeCoordinates } from "./TalentTree";
import TreeView from "@/components/dynamic-talents/TreeView";
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

  it("draws directed connections to the target frame and highlights an authored route", () => {
    const horizontal = edgeCoordinates([1, 1, 2, 1]);
    const diagonal = edgeCoordinates([1, 1, 2, 2]);
    expect(horizontal).toEqual({ x1: 52, y1: 30, x2: 67, y2: 30 });
    expect(diagonal?.x1).toBeGreaterThan(25);
    expect(diagonal?.y1).toBeGreaterThan(30);
    expect(diagonal?.x2).toBeLessThan(95);
    expect(diagonal?.y2).toBeLessThan(110);

    const html = renderToStaticMarkup(<TalentTree treeKey="guide" nodes={[
      { id: "from", name: "Afterimage", column: 1, row: 1, shape: "square" },
      { id: "to", name: "Ardent Defender", column: 2, row: 1, shape: "circle" },
    ]} selectedNodeIds={["from", "to"]} edges={[[1, 1, 2, 1]]} />);
    expect(html).toContain('data-active-connection="1"');
    expect(html).toContain('marker-end="url(#');
    expect(html).toContain('-gold)"');
    expect(html).not.toContain('type="button"');
  });

  it("uses the same framed, directed tree for public dynamic pages", () => {
    const html = renderToStaticMarkup(<TreeView tree={{
      type: "talenttree.dynamic", id: "example", title: "Paladin", rows: 1, columns: 2, points: 2,
      nodes: [
        { id: "a", name: "Afterimage", description: "", icon: "", row: 1, column: 1, maxRank: 1, requires: [] },
        { id: "b", name: "Ardent Defender", description: "", icon: "", row: 1, column: 2, maxRank: 1, requires: ["a"] },
      ],
    }} />);
    expect(html).toContain('marker-end="url(#');
    expect(html).toContain('data-edit-mode="readonly"');
    expect(html).not.toContain("Add rank");
  });
});
