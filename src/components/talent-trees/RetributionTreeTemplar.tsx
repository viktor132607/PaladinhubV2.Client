"use client";

import TalentTree, {
  type TalentEdge,
  type TalentNode,
} from "./TalentTree";

const paladinNodes = [
  {
    id: "lay-on-hands",
    name: "Lay on Hands",
    column: 2,
    row: 1,
    cost: 1,
  },
  {
    id: "auras-of-the-resolute",
    name: "Auras of the Resolute",
    column: 4,
    row: 1,
    cost: 1,
  },
  {
    id: "hammer-of-wrath",
    name: "Hammer of Wrath",
    column: 6,
    row: 1,
    cost: 1,
  },
  {
    id: "improved-cleanse",
    name: "Improved Cleanse",
    column: 1,
    row: 2,
    cost: 1,
  },
  {
    id: "empyreal-ward",
    name: "Empyreal Ward",
    column: 2,
    row: 2,
    cost: 1,
  },
  {
    id: "fist-of-justice",
    name: "Fist of Justice",
    column: 3,
    row: 2,
    cost: 1,
  },
  {
    id: "blinding-light",
    name: "Blinding Light",
    column: 5,
    row: 2,
    cost: 1,
  },
  {
    id: "turn-evil",
    name: "Turn Evil",
    column: 7,
    row: 2,
    cost: 1,
  },
  {
    id: "a-just-reward",
    name: "A Just Reward",
    column: 1,
    row: 3,
    cost: 1,
  },
  {
    id: "afterimage",
    name: "Afterimage",
    column: 2,
    row: 3,
    cost: 1,
  },
  {
    id: "divine-steed",
    name: "Divine Steed",
    column: 4,
    row: 3,
    cost: 1,
  },
  {
    id: "light-s-countenance",
    name: "Light's Countenance",
    column: 5,
    row: 3,
    cost: 1,
  },
  {
    id: "greater-judgment",
    name: "Greater Judgment",
    column: 6,
    row: 3,
    cost: 1,
  },
  {
    id: "wrench-evil",
    name: "Wrench Evil",
    column: 7,
    row: 3,
    cost: 1,
  },
  {
    id: "holy-reprieve",
    name: "Holy Reprieve",
    column: 1,
    row: 4,
    cost: 1,
  },
  {
    id: "cavalier",
    name: "Cavalier",
    column: 3,
    row: 4,
    cost: 1,
  },
  {
    id: "divine-spurs",
    name: "Divine Spurs",
    column: 4,
    row: 4,
    cost: 1,
  },
  {
    id: "blessing-of-freedom",
    name: "Blessing of Freedom",
    column: 5,
    row: 4,
    cost: 1,
  },
  {
    id: "rebuke",
    name: "Rebuke",
    column: 7,
    row: 4,
    cost: 1,
  },
  {
    id: "obduracy",
    name: "Obduracy",
    column: 2,
    row: 5,
    cost: 1,
  },
  {
    id: "divine-toll",
    name: "Divine Toll",
    column: 4,
    row: 5,
    cost: 1,
  },
  {
    id: "echoing-blessings",
    name: "Echoing Blessings",
    column: 5,
    row: 5,
    cost: 1,
  },
  {
    id: "sanctified-plates",
    name: "Sanctified Plates",
    column: 6,
    row: 5,
    cost: 1,
  },
  {
    id: "punishment",
    name: "Punishment",
    column: 7,
    row: 5,
    cost: 1,
  },
  {
    id: "divine-reach",
    name: "Divine Reach",
    column: 1,
    row: 6,
    cost: 1,
  },
  {
    id: "blessing-of-sacrifice",
    name: "Blessing of Sacrifice",
    column: 3,
    row: 6,
    cost: 1,
  },
  {
    id: "quickened-invocation",
    name: "Quickened Invocation",
    column: 4,
    row: 6,
    cost: 1,
  },
  {
    id: "blessing-of-protection",
    name: "Blessing of Protection",
    column: 5,
    row: 6,
    cost: 1,
  },
  {
    id: "consecrated-ground",
    name: "Consecrated Ground",
    column: 7,
    row: 6,
    cost: 1,
  },
  {
    id: "holy-aegis",
    name: "Holy Aegis",
    column: 2,
    row: 7,
    cost: 1,
  },
  {
    id: "sacrifice-of-the-just",
    name: "Sacrifice of the Just",
    column: 3,
    row: 7,
    cost: 1,
  },
  {
    id: "divine-purpose",
    name: "Divine Purpose",
    column: 4,
    row: 7,
    cost: 1,
  },
  {
    id: "improved-blessing-of-protection",
    name: "Improved Blessing of Protection",
    column: 5,
    row: 7,
    cost: 1,
  },
  {
    id: "unbreakable-spirit",
    name: "Unbreakable Spirit",
    column: 6,
    row: 7,
    cost: 1,
  },
  {
    id: "lightforged-blessing",
    name: "Lightforged Blessing",
    column: 1,
    row: 8,
    cost: 1,
  },
  {
    id: "lead-the-charge",
    name: "Lead the Charge",
    column: 2,
    row: 8,
    cost: 1,
  },
  {
    id: "righteous-protection",
    name: "Righteous Protection",
    column: 3,
    row: 8,
    cost: 1,
  },
  {
    id: "holy-ritual",
    name: "Holy Ritual",
    column: 4,
    row: 8,
    cost: 1,
  },
  {
    id: "blessed-calling",
    name: "Blessed Calling",
    column: 5,
    row: 8,
    cost: 1,
  },
  {
    id: "inspired-guard",
    name: "Inspired Guard",
    column: 6,
    row: 8,
    cost: 1,
  },
  {
    id: "judgment-of-light",
    name: "Judgment of Light",
    column: 7,
    row: 8,
    cost: 1,
  },
  {
    id: "faith-s-armor",
    name: "Faith's Armor",
    column: 1,
    row: 9,
    cost: 1,
  },
  {
    id: "stoicism",
    name: "Stoicism",
    column: 2,
    row: 9,
    cost: 1,
  },
  {
    id: "seal-of-might",
    name: "Seal of Might",
    column: 3,
    row: 9,
    cost: 1,
  },
  {
    id: "seal-of-the-crusader",
    name: "Seal of the Crusader",
    column: 4,
    row: 9,
    cost: 1,
  },
  {
    id: "vengeful-wrath",
    name: "Vengeful Wrath",
    column: 5,
    row: 9,
    cost: 1,
  },
  {
    id: "eye-for-an-eye",
    name: "Eye for an Eye",
    column: 6,
    row: 9,
    cost: 1,
  },
  {
    id: "golden-path",
    name: "Golden Path",
    column: 7,
    row: 9,
    cost: 1,
  },
  {
    id: "of-dusk-and-dawn",
    name: "Of Dusk and Dawn",
    column: 2,
    row: 10,
    cost: 1,
  },
  {
    id: "lightbearer",
    name: "Lightbearer",
    column: 4,
    row: 10,
    cost: 1,
  },
  {
    id: "light-s-revocation",
    name: "Light's Revocation",
    column: 6,
    row: 10,
    cost: 1,
  },
] satisfies TalentNode[];

const retributionTemplarNodes = [
  {
    id: "light-s-guidance",
    name: "Light's Guidance",
    column: 2,
    row: 1,
    cost: 1,
  },
  {
    id: "zealous-vindication",
    name: "Zealous Vindication",
    column: 1,
    row: 2,
    cost: 1,
  },
  {
    id: "shake-the-heavens",
    name: "Shake the Heavens",
    column: 2,
    row: 2,
    cost: 1,
  },
  {
    id: "wrathful-descent",
    name: "Wrathful Descent",
    column: 3,
    row: 2,
    cost: 1,
  },
  {
    id: "sacrosanct-crusade",
    name: "Sacrosanct Crusade",
    column: 1,
    row: 3,
    cost: 1,
  },
  {
    id: "higher-calling",
    name: "Higher Calling",
    column: 2,
    row: 3,
    cost: 1,
  },
  {
    id: "unrelenting-charger",
    name: "Unrelenting Charger",
    column: 3,
    row: 3,
    cost: 1,
  },
  {
    id: "sanctification",
    name: "Sanctification",
    column: 1,
    row: 4,
    cost: 1,
  },
  {
    id: "hammerfall",
    name: "Hammerfall",
    column: 2,
    row: 4,
    cost: 1,
  },
  {
    id: "undisputed-ruling",
    name: "Undisputed Ruling",
    column: 3,
    row: 4,
    cost: 1,
  },
  {
    id: "light-s-deliverance",
    name: "Light's Deliverance",
    column: 2,
    row: 5,
    cost: 1,
  },
] satisfies TalentNode[];

const retributionNodes = [
  {
    id: "blade-of-justice",
    name: "Blade of Justice",
    column: 5,
    row: 1,
    cost: 1,
  },
  {
    id: "divine-storm",
    name: "Divine Storm",
    column: 5,
    row: 2,
    cost: 1,
  },
  {
    id: "swift-justice",
    name: "Swift Justice",
    column: 2,
    row: 3,
    cost: 1,
  },
  {
    id: "expurgation",
    name: "Expurgation",
    column: 4,
    row: 3,
    cost: 1,
  },
  {
    id: "judgement-of-justice",
    name: "Judgement of Justice",
    column: 6,
    row: 3,
    cost: 1,
  },
  {
    id: "holy-blade",
    name: "Holy Blade",
    column: 8,
    row: 3,
    cost: 1,
  },
  {
    id: "final-verdict",
    name: "Final Verdict",
    column: 2,
    row: 4,
    cost: 1,
  },
  {
    id: "guided-prayer",
    name: "Guided Prayer",
    column: 5,
    row: 4,
    cost: 1,
  },
  {
    id: "art-of-war",
    name: "Art of War",
    column: 8,
    row: 4,
    cost: 1,
  },
  {
    id: "jurisdiction",
    name: "Jurisdiction",
    column: 1,
    row: 5,
    cost: 1,
  },
  {
    id: "tempest-of-the-lightbringer",
    name: "Tempest of the Lightbringer",
    column: 3,
    row: 5,
    cost: 1,
  },
  {
    id: "crusade",
    name: "Crusade",
    column: 5,
    row: 5,
    cost: 1,
  },
  {
    id: "vanguard-s-momentum",
    name: "Vanguard's Momentum",
    column: 7,
    row: 5,
    cost: 1,
  },
  {
    id: "zealot-s-fervor",
    name: "Zealot's Fervor",
    column: 8,
    row: 5,
    cost: 1,
  },
  {
    id: "rush-of-light",
    name: "Rush of Light",
    column: 9,
    row: 5,
    cost: 1,
  },
  {
    id: "boundless-judgment",
    name: "Boundless Judgment",
    column: 2,
    row: 6,
    cost: 1,
  },
  {
    id: "crusading-strikes",
    name: "Crusading Strikes",
    column: 4,
    row: 6,
    cost: 1,
  },
  {
    id: "divine-wrath",
    name: "Divine Wrath",
    column: 5,
    row: 6,
    cost: 1,
  },
  {
    id: "divine-hammer",
    name: "Divine Hammer",
    column: 6,
    row: 6,
    cost: 1,
  },
  {
    id: "holy-flames",
    name: "Holy Flames",
    column: 8,
    row: 6,
    cost: 1,
  },
  {
    id: "empyrean-legacy",
    name: "Empyrean Legacy",
    column: 1,
    row: 7,
    cost: 1,
  },
  {
    id: "heart-of-the-crusader",
    name: "Heart of the Crusader",
    column: 2,
    row: 7,
    cost: 1,
  },
  {
    id: "highlord-s-wrath",
    name: "Highlord's Wrath",
    column: 3,
    row: 7,
    cost: 1,
  },
  {
    id: "wake-of-ashes",
    name: "Wake of Ashes",
    column: 5,
    row: 7,
    cost: 1,
  },
  {
    id: "blessed-champion",
    name: "Blessed Champion",
    column: 7,
    row: 7,
    cost: 1,
  },
  {
    id: "judge-jury-and-executioner",
    name: "Judge, Jury and Executioner",
    column: 9,
    row: 7,
    cost: 1,
  },
  {
    id: "adjudication",
    name: "Adjudication",
    column: 2,
    row: 8,
    cost: 1,
  },
  {
    id: "shield-of-vengeance",
    name: "Shield of Vengeance",
    column: 5,
    row: 8,
    cost: 1,
  },
  {
    id: "penitence",
    name: "Penitence",
    column: 8,
    row: 8,
    cost: 1,
  },
  {
    id: "blades-of-light",
    name: "Blades of Light",
    column: 2,
    row: 9,
    cost: 1,
  },
  {
    id: "execution-sentence",
    name: "Execution Sentence",
    column: 4,
    row: 9,
    cost: 1,
  },
  {
    id: "seething-flames",
    name: "Seething Flames",
    column: 6,
    row: 9,
    cost: 1,
  },
  {
    id: "burning-crusade",
    name: "Burning Crusade",
    column: 8,
    row: 9,
    cost: 1,
  },
  {
    id: "divine-arbiter",
    name: "Divine Arbiter",
    column: 2,
    row: 10,
    cost: 1,
  },
  {
    id: "executioner-s-will",
    name: "Executioner's Will",
    column: 3,
    row: 10,
    cost: 1,
  },
  {
    id: "divine-auxiliary",
    name: "Divine Auxiliary",
    column: 4,
    row: 10,
    cost: 1,
  },
  {
    id: "radiant-glory",
    name: "Radiant Glory",
    column: 6,
    row: 10,
    cost: 1,
  },
  {
    id: "burn-to-ash",
    name: "Burn to Ash",
    column: 7,
    row: 10,
    cost: 1,
  },
  {
    id: "searing-light",
    name: "Searing Light",
    column: 8,
    row: 10,
    cost: 1,
  },
] satisfies TalentNode[];

const paladinEdges = [
  [2, 1, 1, 2],
  [2, 1, 2, 2],
  [2, 1, 3, 2],
  [4, 1, 3, 2],
  [4, 1, 5, 2],
  [4, 1, 4, 3],
  [6, 1, 5, 2],
  [6, 1, 7, 2],
  [6, 1, 6, 3],

  [1, 2, 1, 3],
  [1, 2, 2, 3],
  [2, 2, 2, 3],
  [3, 2, 2, 3],
  [3, 2, 4, 3],
  [5, 2, 4, 3],
  [5, 2, 5, 3],
  [5, 2, 6, 3],
  [7, 2, 7, 3],

  [1, 3, 1, 4],
  [2, 3, 1, 4],
  [2, 3, 2, 5],
  [4, 3, 3, 4],
  [4, 3, 4, 4],
  [4, 3, 5, 4],
  [6, 3, 6, 5],
  [6, 3, 7, 4],
  [7, 3, 7, 4],

  [1, 4, 2, 5],
  [1, 4, 1, 6],
  [3, 4, 2, 5],
  [3, 4, 4, 5],
  [3, 4, 3, 6],
  [5, 4, 4, 5],
  [5, 4, 5, 5],
  [5, 4, 6, 5],
  [7, 4, 6, 5],
  [7, 4, 7, 5],

  [2, 5, 1, 6],
  [2, 5, 3, 6],
  [2, 5, 2, 7],
  [4, 5, 3, 6],
  [4, 5, 4, 6],
  [4, 5, 5, 6],
  [5, 5, 5, 6],
  [6, 5, 5, 6],
  [6, 5, 7, 6],
  [6, 5, 6, 7],
  [7, 5, 7, 6],

  [1, 6, 2, 7],
  [1, 6, 1, 8],
  [3, 6, 2, 7],
  [3, 6, 3, 7],
  [3, 6, 4, 7],
  [5, 6, 5, 7],
  [5, 6, 6, 7],
  [5, 6, 4, 7],
  [7, 6, 6, 7],
  [7, 6, 7, 8],

  [2, 7, 1, 8],
  [2, 7, 2, 8],
  [3, 7, 2, 8],
  [3, 7, 3, 8],
  [3, 7, 4, 8],
  [4, 7, 4, 8],
  [4, 7, 5, 8],
  [5, 7, 5, 8],
  [5, 7, 6, 8],
  [6, 7, 6, 8],
  [6, 7, 7, 8],

  [1, 8, 1, 9],
  [2, 8, 1, 9],
  [2, 8, 2, 9],
  [2, 8, 3, 9],
  [3, 8, 3, 9],
  [4, 8, 3, 9],
  [4, 8, 4, 9],
  [4, 8, 5, 9],
  [5, 8, 5, 9],
  [6, 8, 5, 9],
  [6, 8, 6, 9],
  [6, 8, 7, 9],
  [7, 8, 7, 9],

  [1, 9, 2, 10],
  [2, 9, 2, 10],
  [3, 9, 2, 10],
  [3, 9, 4, 10],
  [4, 9, 4, 10],
  [5, 9, 4, 10],
  [5, 9, 6, 10],
  [6, 9, 6, 10],
  [7, 9, 6, 10],
] satisfies TalentEdge[];

const templarEdges = [
  [2, 1, 1, 2],
  [2, 1, 2, 2],
  [2, 1, 3, 2],

  [1, 2, 1, 3],
  [2, 2, 2, 3],
  [3, 2, 3, 3],

  [1, 3, 1, 4],
  [2, 3, 2, 4],
  [3, 3, 3, 4],

  [1, 4, 2, 5],
  [2, 4, 2, 5],
  [3, 4, 2, 5],
] satisfies TalentEdge[];

const retributionEdges = [
  [5, 1, 5, 2],

  [5, 2, 4, 3],
  [5, 2, 6, 3],
  [5, 2, 2, 3],
  [5, 2, 8, 3],

  [2, 3, 2, 4],
  [2, 3, 5, 4],
  [4, 3, 5, 4],
  [6, 3, 5, 4],
  [8, 3, 5, 4],
  [8, 3, 8, 4],

  [2, 4, 1, 5],
  [2, 4, 2, 6],
  [2, 4, 3, 5],
  [5, 4, 3, 5],
  [5, 4, 5, 5],
  [5, 4, 7, 5],
  [8, 4, 7, 5],
  [8, 4, 8, 5],
  [8, 4, 9, 5],

  [1, 5, 1, 7],
  [2, 5, 2, 6],
  [3, 5, 2, 6],
  [3, 5, 3, 7],
  [5, 5, 4, 6],
  [5, 5, 5, 6],
  [5, 5, 6, 6],
  [7, 5, 7, 7],
  [7, 5, 8, 6],
  [8, 5, 8, 6],
  [9, 5, 8, 6],
  [9, 5, 9, 7],

  [2, 6, 1, 7],
  [2, 6, 2, 7],
  [2, 6, 3, 7],
  [4, 6, 3, 7],
  [4, 6, 3, 7],
  [4, 6, 5, 7],
  [5, 6, 5, 7],
  [6, 6, 5, 7],
  [6, 6, 7, 7],
  [8, 6, 7, 7],
  [8, 6, 8, 8],
  [8, 6, 9, 7],

  [1, 7, 2, 8],
  [2, 7, 2, 8],
  [3, 7, 2, 8],
  [5, 7, 2, 8],
  [5, 7, 5, 8],
  [5, 7, 8, 8],
  [7, 7, 8, 8],
  [9, 7, 8, 8],

  [2, 8, 2, 9],
  [5, 8, 4, 9],
  [5, 8, 6, 9],
  [8, 8, 8, 9],

  [2, 9, 2, 10],
  [4, 9, 3, 10],
  [4, 9, 4, 10],
  [6, 9, 6, 10],
  [6, 9, 7, 10],
  [8, 9, 8, 10],
] satisfies TalentEdge[];

const squareNodeNames = new Set([
  "Lay on Hands",
  "Auras of the Resolute",
  "Hammer of Wrath",
  "Turn Evil",
  "Divine Steed",
  "Rebuke",
  "Divine Toll",
  "Blessing of Sacrifice",
  "Blessing of Protection",

  "Blade of Justice",
  "Divine Storm",
  "Divine Hammer",
  "Wake of Ashes",
]);

const hexagonNodeNames = new Set([
  "Blinding Light",
  "Wrench Evil",
  "Blessing of Freedom",
  "Echoing Blessings",
  "Quickened Invocation",
  "Sacrifice of the Just",
  "Righteous Protection",
  "Golden Path",

  "Zealous Vindication",
  "Unrelenting Charger",
  "Sanctification",

  "Swift Justice",
  "Holy Blade",
  "Final Verdict",
  "Guided Prayer",
  "Art of War",
  "Tempest of the Lightbringer",
  "Crusade",
  "Vanguard's Momentum",
  "Boundless Judgment",
  "Crusading Strikes",
  "Holy Flames",
  "Judge, Jury and Executioner",
  "Shield of Vengeance",
  "Execution Sentence",
]);

function withOriginalNodeShapes(
  nodes: TalentNode[],
): TalentNode[] {
  return nodes.map((node) => ({
    ...node,

    shape: squareNodeNames.has(node.name)
      ? "square"
      : hexagonNodeNames.has(node.name)
        ? "hexagon"
        : "circle",
  }));
}

const paladinTreeNodes =
  withOriginalNodeShapes(
    paladinNodes,
  );

const templarTreeNodes =
  withOriginalNodeShapes(
    retributionTemplarNodes,
  );

const retributionTreeNodes =
  withOriginalNodeShapes(
    retributionNodes,
  );

type TreeColumnProps = {
  title: string;
  treeKey: string;
  nodes: TalentNode[];
  maxPoints: number;
  columns: number;
  widthClass: string;
  edges: TalentEdge[];
};

function TreeColumn({
  title,
  treeKey,
  nodes,
  maxPoints,
  columns,
  widthClass,
  edges,
}: TreeColumnProps) {
  return (
    <section
      className={`
        ${widthClass}
        flex shrink-0
        flex-col items-center
        rounded-[8px]
        border border-white/20
        bg-[#1a1a1a]
        p-[15px]
      `}
    >
      <h2 className="mb-[15px] mt-5 text-center text-2xl font-bold text-white">
        {title}
      </h2>

      <TalentTree
        treeKey={treeKey}
        build={title}
        nodes={nodes}
        maxPoints={maxPoints}
        columns={columns}
        edges={edges}
      />
    </section>
  );
}

export default function RetributionTreeTemplar() {
  return (
    <section
      className="w-full bg-[#151515] text-white"
      data-build="retribution-templar"
    >
      <div className="w-full overflow-x-auto">
        <div
          className="
            mx-auto flex
            w-max min-w-[1580px]
            items-stretch
            justify-center
            gap-[15px]
            py-[15px]
          "
        >
          <TreeColumn
            title="Paladin"
            treeKey="paladin"
            nodes={paladinTreeNodes}
            maxPoints={31}
            columns={7}
            widthClass="w-[650px]"
            edges={paladinEdges}
          />

          <TreeColumn
            title="Templar"
            treeKey="retribution-templar"
            nodes={templarTreeNodes}
            maxPoints={10}
            columns={3}
            widthClass="w-[250px]"
            edges={templarEdges}
          />

          <TreeColumn
            title="Retribution"
            treeKey="retribution"
            nodes={retributionTreeNodes}
            maxPoints={31}
            columns={9}
            widthClass="w-[650px]"
            edges={retributionEdges}
          />
        </div>
      </div>
    </section>
  );
}