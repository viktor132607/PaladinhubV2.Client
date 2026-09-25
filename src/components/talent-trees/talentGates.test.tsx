import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TalentTree from "./TalentTree";
import TalentTooltip from "@/components/tooltips/TalentTooltip";
import { defaultTalentGates, evaluateTalentGates, lockedGateForRow } from "./talentGates";
import { validateTree } from "@/features/dynamic-talents/model";

describe("talent point gates", () => {
  it("counts ranks only above each gate and does not count talents behind a locked gate", () => {
    const nodes = [
      { id: "a", row: 1, rank: 2 }, { id: "b", row: 2, rank: 2 },
      { id: "c", row: 4, rank: 1 }, { id: "d", row: 5, rank: 9 },
      { id: "e", row: 8, rank: 1 },
    ];
    const gates = evaluateTalentGates(nodes, [{ row: 5, points: 6 }, { row: 8, points: 12 }], n => n.rank);
    expect(gates.map(gate => ({ spent: gate.spent, missing: gate.missing })))
      .toEqual([{ spent: 5, missing: 1 }, { spent: 5, missing: 7 }]);
    expect(lockedGateForRow(gates, 4)).toBeUndefined();
    expect(lockedGateForRow(gates, 8)?.points).toBe(6);
    expect(defaultTalentGates("Paladin", 10)).toEqual([{ row: 5, points: 6 }, { row: 8, points: 12 }]);
    expect(defaultTalentGates("Holy", 10)[0].points).toBe(7);
    expect(defaultTalentGates("Templar", 5)).toEqual([]);
  });

  it("locks a ranked talent until the higher rows have enough points and shows the missing amount", () => {
    const html = renderToStaticMarkup(<TalentTree build="Paladin" nodes={[
      { id: "a", name: "Afterimage", row: 1, column: 1, rank: 2, maxRank: 2 },
      { id: "b", name: "Obduracy", row: 4, column: 1, rank: 2, maxRank: 2 },
      { id: "c", name: "Divine Toll", row: 5, column: 1, rank: 1, maxRank: 1 },
    ]} />);
    expect(html).toContain('data-gate-required="6"');
    expect(html).toContain('data-gate-spent="4"');
    expect(html).toContain('data-tooltip-locked-points="2"');
    expect(html).toContain('data-tooltip-rank="0/1"');
    expect(renderToStaticMarkup(<TalentTooltip name="Divine Toll" rank="0/1" lockedPoints={2}
      description="Example effect" />)).toContain("Spend 2 more points to unlock this talent.");
  });

  it("unlocks the next row at the threshold while keeping the next gate closed", () => {
    const html = renderToStaticMarkup(<TalentTree build="Paladin" nodes={[
      { id: "a", name: "Afterimage", row: 1, column: 1, rank: 2, maxRank: 2 },
      { id: "b", name: "Obduracy", row: 2, column: 1, rank: 2, maxRank: 2 },
      { id: "c", name: "Sanctified Plates", row: 3, column: 1, rank: 2, maxRank: 2 },
      { id: "d", name: "Divine Toll", row: 5, column: 1, rank: 1, maxRank: 1 },
      { id: "e", name: "Golden Path", row: 8, column: 1, rank: 1, maxRank: 1 },
    ]} />);
    expect(html).toContain('data-gate-spent="6"');
    expect(html).toContain('data-tooltip-rank="1/1"');
    expect(html).toContain('data-tooltip-locked-points="5"');
  });

  it("rejects duplicate or unreachable admin gate thresholds", () => {
    const tree = {
      type: "talenttree.dynamic" as const, id: "gates", title: "Paladin", rows: 5, columns: 1, points: 10,
      nodes: [], gateRows: [{ row: 5, points: 6 }, { row: 5, points: 11 }],
    };
    expect(validateTree(tree)).toContain("Talent gates need unique rows within the tree and valid point thresholds.");
    expect(validateTree({ ...tree, gateRows: [{ row: 5, points: 6 }] })).toEqual([]);
  });
});
