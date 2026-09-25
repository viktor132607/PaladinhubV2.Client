import type { TalentNode } from "./TalentTree";

// Initial display ranks for the bundled layouts. Admins can replace these per layout.
const twoRankTalents = new Set([
  "A Just Reward", "Obduracy", "Sanctified Plates", "Seal of Might",
  "Vengeful Wrath", "Zealot's Fervor", "Heart of the Crusader",
  "Blades of Light", "Divine Wrath",
]);

const initialRanks: Record<string, number> = {
  "A Just Reward": 1,
  Obduracy: 2,
  "Sanctified Plates": 0,
  "Seal of Might": 2,
};

export function seedTalentRanks(nodes: TalentNode[]): TalentNode[] {
  return nodes.map((node) => {
    const maxRank = Math.max(node.maxRank ?? 1, twoRankTalents.has(node.name) ? 2 : 1);
    const defaultRank = (node.row ?? 1) <= 2 ||
      ((node.column ?? 1) <= 3 ? (node.column === 2 || (node.row ?? 1) % 3 === 0)
        : (node.column ?? 1) % 2 === 0 && (node.row ?? 1) % 3 !== 0)
      ? maxRank : 0;
    return { ...node, maxRank, rank: initialRanks[node.name] ?? defaultRank };
  });
}
