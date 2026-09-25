import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TalentTree, { edgeCoordinates } from "./TalentTree";
import TreeView from "@/components/dynamic-talents/TreeView";
import PublishedTalentTrees, { validPublishedTrees } from "./PublishedTalentTrees";
import { seedTalentRanks } from "./seedTalentRanks";
import { validateTree } from "@/features/dynamic-talents/model";
import TalentTooltip from "@/components/tooltips/TalentTooltip";
import { withTalentChoice } from "./talentChoices";
import { resolveMessage } from "@/localization/catalog";

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

  it("shows inactive, partial and fully ranked talents with the correct arrow state", () => {
    const nodes = [
      { id: "a", name: "A Just Reward", column: 1, row: 1, maxRank: 2, rank: 0, shape: "hexagon" as const },
      { id: "b", name: "Obduracy", column: 2, row: 1, maxRank: 2, rank: 1 },
      { id: "c", name: "Seal of Might", column: 3, row: 1, maxRank: 2, rank: 2 },
    ];
    const html = renderToStaticMarkup(<TalentTree nodes={nodes} edges={[[1, 1, 2, 1], [2, 1, 3, 1]]} />);
    expect(html).toContain('data-id="a"');
    expect(html).toContain('aria-label="A Just Reward, 0 of 2 ranks"');
    expect(html).toContain('aria-label="Obduracy, 1 of 2 ranks"');
    expect(html).toContain('aria-label="Seal of Might, 2 of 2 ranks"');
    expect(html).toContain('>0/2</span>');
    expect(html).toContain('>1/2</span>');
    expect(html).toContain('>2/2</span>');
    expect(html.match(/data-active-connection="1"/g)).toHaveLength(1);
    expect(html.match(/data-active-connection="0"/g)).toHaveLength(1);
    expect(html).toContain("inactive");
    expect(html).toContain("hexagon");
  });

  it("seeds bundled two-rank nodes and rejects invalid admin ranks", () => {
    const [node] = seedTalentRanks([{ id: "a", name: "A Just Reward", row: 3, column: 1 }]);
    expect(node).toMatchObject({ maxRank: 2, rank: 1 });
    const tree = {
      type: "talenttree.dynamic" as const, id: "ranks", title: "Ranks", rows: 1, columns: 1, points: 2,
      nodes: [{ id: "a", name: "Rank", description: "", icon: "", row: 1, column: 1, maxRank: 2, rank: 3, requires: [] }],
    };
    expect(validateTree(tree)).toContain("Selected rank must be between 0 and the talent's maximum rank.");
  });

  it("shows both choices, greys both when unranked, and highlights only the selected choice", () => {
    const choice = withTalentChoice({ id: "choice", name: "Wrench Evil", shape: "hexagon", row: 1, column: 1 });
    expect(choice.alternative?.name).toBe("Stand Against Evil");
    const unranked = renderToStaticMarkup(<TalentTree nodes={[{ ...choice, rank: 0 }]} />);
    expect(unranked).toContain('data-tooltip-selected-choice="-1"');
    expect(unranked).toContain("Stand Against Evil");
    expect(unranked).not.toContain('href="https://www.wowhead.com/spell=');
    expect(unranked).toContain("◀");
    expect(unranked).toContain("▶");

    const selected = renderToStaticMarkup(<TalentTree nodes={[{ ...choice, rank: 1, selectedChoice: 1 }]} />);
    expect(selected).toContain('data-tooltip-selected-choice="1"');
    expect(selected).toContain('aria-label="Stand Against Evil, 1 of 1 ranks, choice 2 of 2"');
    const tooltip = renderToStaticMarkup(<TalentTooltip name="Stand Against Evil" choices={[
      { name: "Wrench Evil", description: "First effect" },
      { name: "Stand Against Evil", description: "Second effect" },
    ]} selectedChoice={1} />);
    expect(tooltip).toContain("First effect");
    expect(tooltip).toContain("Second effect");
    expect(tooltip).toContain("Selected");
    expect(tooltip).toContain("Inactive");
    expect(tooltip).not.toContain("Избран");
    expect(tooltip).not.toContain("Неактивен");
    expect(resolveMessage("bg", {}, "talent.choice.selected")).toBe("Избран");
    expect(resolveMessage("bg", {}, "talent.choice.inactive")).toBe("Неактивен");
    expect(withTalentChoice({ id: "not-choice", name: "Blinding Light", shape: "hexagon" }).shape).toBe("circle");
  });

  it("rejects invalid published choice configuration", () => {
    const tree = {
      type: "talenttree.dynamic" as const, id: "choice", title: "Choice", rows: 1, columns: 1, points: 1,
      nodes: [{ id: "a", name: "First", description: "", icon: "", row: 1, column: 1,
        maxRank: 1, rank: 1, selectedChoice: 2 as 0, alternative: { name: "" }, requires: [] }],
    };
    expect(validateTree(tree)).toContain("Selected choice must be 0 or 1.");
    expect(validateTree(tree)).toContain("A choice needs a named alternative with valid text fields.");
  });

  it("renders the admin's selected alternative in a published tree", () => {
    const tree = {
      type: "talenttree.dynamic" as const, id: "choice", title: "Choices", rows: 1, columns: 1, points: 1,
      nodes: [{ id: "a", name: "Wrench Evil", description: "Original effect", icon: "", row: 1, column: 1,
        maxRank: 1, rank: 1, selectedChoice: 1 as const, shape: "hexagon" as const,
        alternative: { name: "Stand Against Evil", description: "Other effect" }, requires: [] }],
    };
    expect(validPublishedTrees([tree])).toBe(true);
    const html = renderToStaticMarkup(<PublishedTalentTrees layoutKey="example" trees={[tree]} />);
    expect(html).toContain('data-tooltip-selected-choice="1"');
    expect(html).toContain("Original effect");
    expect(html).toContain("Other effect");
  });
});
