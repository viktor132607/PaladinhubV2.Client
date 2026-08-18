"use client";

import TalentTree, { type TalentEdge, type TalentNode } from "./TalentTree";

const paladinNodes = [
  { id: "lay-on-hands", name: "Lay on Hands", column: 2, row: 1, cost: 1 },
  { id: "auras-of-the-resolute", name: "Auras of the Resolute", column: 4, row: 1, cost: 1 },
  { id: "hammer-of-wrath", name: "Hammer of Wrath", column: 6, row: 1, cost: 1 },

  { id: "improved-cleanse", name: "Improved Cleanse", column: 1, row: 2, cost: 1 },
  { id: "empyreal-ward", name: "Empyreal Ward", column: 2, row: 2, cost: 1 },
  { id: "fist-of-justice", name: "Fist of Justice", column: 3, row: 2, cost: 1 },
  { id: "blinding-light", name: "Blinding Light", column: 5, row: 2, cost: 1 },
  { id: "turn-evil", name: "Turn Evil", column: 7, row: 2, cost: 1 },

  { id: "a-just-reward", name: "A Just Reward", column: 1, row: 3, cost: 1 },
  { id: "afterimage", name: "Afterimage", column: 2, row: 3, cost: 1 },
  { id: "divine-steed", name: "Divine Steed", column: 4, row: 3, cost: 1 },
  { id: "light-s-countenance", name: "Light's Countenance", column: 5, row: 3, cost: 1 },
  { id: "greater-judgment", name: "Greater Judgment", column: 6, row: 3, cost: 1 },
  { id: "wrench-evil", name: "Wrench Evil", column: 7, row: 3, cost: 1 },

  { id: "holy-reprieve", name: "Holy Reprieve", column: 1, row: 4, cost: 1 },
  { id: "cavalier", name: "Cavalier", column: 3, row: 4, cost: 1 },
  { id: "divine-spurs", name: "Divine Spurs", column: 4, row: 4, cost: 1 },
  { id: "blessing-of-freedom", name: "Blessing of Freedom", column: 5, row: 4, cost: 1 },
  { id: "rebuke", name: "Rebuke", column: 7, row: 4, cost: 1 },

  { id: "obduracy", name: "Obduracy", column: 2, row: 5, cost: 1 },
  { id: "divine-toll", name: "Divine Toll", column: 4, row: 5, cost: 1 },
  { id: "echoing-blessings", name: "Echoing Blessings", column: 5, row: 5, cost: 1 },
  { id: "sanctified-plates", name: "Sanctified Plates", column: 6, row: 5, cost: 1 },
  { id: "punishment", name: "Punishment", column: 7, row: 5, cost: 1 },

  { id: "divine-reach", name: "Divine Reach", column: 1, row: 6, cost: 1 },
  { id: "blessing-of-sacrifice", name: "Blessing of Sacrifice", column: 3, row: 6, cost: 1 },
  { id: "quickened-invocation", name: "Quickened Invocation", column: 4, row: 6, cost: 1 },
  { id: "blessing-of-protection", name: "Blessing of Protection", column: 5, row: 6, cost: 1 },
  { id: "consecrated-ground", name: "Consecrated Ground", column: 7, row: 6, cost: 1 },

  { id: "holy-aegis", name: "Holy Aegis", column: 2, row: 7, cost: 1 },
  { id: "sacrifice-of-the-just", name: "Sacrifice of the Just", column: 3, row: 7, cost: 1 },
  { id: "divine-purpose", name: "Divine Purpose", column: 4, row: 7, cost: 1 },
  {
    id: "improved-blessing-of-protection",
    name: "Improved Blessing of Protection",
    column: 5,
    row: 7,
    cost: 1,
  },
  { id: "unbreakable-spirit", name: "Unbreakable Spirit", column: 6, row: 7, cost: 1 },

  { id: "lightforged-blessing", name: "Lightforged Blessing", column: 1, row: 8, cost: 1 },
  { id: "lead-the-charge", name: "Lead the Charge", column: 2, row: 8, cost: 1 },
  { id: "righteous-protection", name: "Righteous Protection", column: 3, row: 8, cost: 1 },
  { id: "holy-ritual", name: "Holy Ritual", column: 4, row: 8, cost: 1 },
  { id: "blessed-calling", name: "Blessed Calling", column: 5, row: 8, cost: 1 },
  { id: "inspired-guard", name: "Inspired Guard", column: 6, row: 8, cost: 1 },
  { id: "judgment-of-light", name: "Judgment of Light", column: 7, row: 8, cost: 1 },

  { id: "faith-s-armor", name: "Faith's Armor", column: 1, row: 9, cost: 1 },
  { id: "stoicism", name: "Stoicism", column: 2, row: 9, cost: 1 },
  { id: "seal-of-might", name: "Seal of Might", column: 3, row: 9, cost: 1 },
  { id: "seal-of-the-crusader", name: "Seal of the Crusader", column: 4, row: 9, cost: 1 },
  { id: "vengeful-wrath", name: "Vengeful Wrath", column: 5, row: 9, cost: 1 },
  { id: "eye-for-an-eye", name: "Eye for an Eye", column: 6, row: 9, cost: 1 },
  { id: "golden-path", name: "Golden Path", column: 7, row: 9, cost: 1 },

  { id: "of-dusk-and-dawn", name: "Of Dusk and Dawn", column: 2, row: 10, cost: 1 },
  { id: "lightbearer", name: "Lightbearer", column: 4, row: 10, cost: 1 },
  { id: "light-s-revocation", name: "Light's Revocation", column: 6, row: 10, cost: 1 },
] satisfies TalentNode[];

const holyLightsmithNodes = [
  { id: "holy-bulwark", name: "Holy Bulwark", column: 2, row: 1, cost: 1 },

  {
    id: "rite-of-sanctification",
    name: "Rite of Sanctification",
    column: 1,
    row: 2,
    cost: 1,
  },
  { id: "solidarity", name: "Solidarity", column: 2, row: 2, cost: 1 },
  { id: "divine-guidance", name: "Divine Guidance", column: 3, row: 2, cost: 1 },

  { id: "laying-down-arms", name: "Laying Down Arms", column: 1, row: 3, cost: 1 },
  { id: "divine-inspiration", name: "Divine Inspiration", column: 2, row: 3, cost: 1 },
  {
    id: "authoritative-rebuke",
    name: "Authoritative Rebuke",
    column: 3,
    row: 3,
    cost: 1,
  },

  { id: "shared-resolve", name: "Shared Resolve", column: 1, row: 4, cost: 1 },
  { id: "valiance", name: "Valiance", column: 2, row: 4, cost: 1 },
  { id: "hammer-and-anvil", name: "Hammer and Anvil", column: 3, row: 4, cost: 1 },

  {
    id: "blessing-of-the-forge",
    name: "Blessing of the Forge",
    column: 2,
    row: 5,
    cost: 1,
  },
] satisfies TalentNode[];

const holyNodes = [
  { id: "holy-shock", name: "Holy Shock", column: 5, row: 1, cost: 1 },

  { id: "extrication", name: "Extrication", column: 4, row: 2, cost: 1 },
  { id: "light-of-dawn", name: "Light of Dawn", column: 6, row: 2, cost: 1 },

  { id: "light-s-conviction", name: "Light's Conviction", column: 3, row: 3, cost: 1 },
  { id: "aura-mastery", name: "Aura Mastery", column: 5, row: 3, cost: 1 },
  {
    id: "beacon-of-the-lightbringer",
    name: "Beacon of the Lightbringer",
    column: 7,
    row: 3,
    cost: 1,
  },

  { id: "tower-of-radiance", name: "Tower of Radiance", column: 2, row: 4, cost: 1 },
  { id: "tirion-s-devotion", name: "Tirion's Devotion", column: 4, row: 4, cost: 1 },
  { id: "unending-light", name: "Unending Light", column: 6, row: 4, cost: 1 },
  { id: "awestruck", name: "Awestruck", column: 8, row: 4, cost: 1 },

  { id: "moment-of-compassion", name: "Moment of Compassion", column: 1, row: 5, cost: 1 },
  { id: "holy-prism", name: "Holy Prism", column: 3, row: 5, cost: 1 },
  { id: "protection-of-tyr", name: "Protection of Tyr", column: 5, row: 5, cost: 1 },
  { id: "imbued-infusions", name: "Imbued Infusions", column: 7, row: 5, cost: 1 },
  { id: "light-of-the-martyr", name: "Light of the Martyr", column: 9, row: 5, cost: 1 },

  { id: "righteous-judgment", name: "Righteous Judgment", column: 2, row: 6, cost: 1 },
  { id: "divine-favor", name: "Divine Favor", column: 3, row: 6, cost: 1 },
  { id: "saved-by-the-light", name: "Saved by the Light", column: 4, row: 6, cost: 1 },
  { id: "light-s-protection", name: "Light's Protection", column: 6, row: 6, cost: 1 },
  { id: "overflowing-light", name: "Overflowing Light", column: 7, row: 6, cost: 1 },
  { id: "shining-righteousness", name: "Shining Righteousness", column: 8, row: 6, cost: 1 },

  { id: "liberation", name: "Liberation", column: 1, row: 7, cost: 1 },
  { id: "commanding-light", name: "Commanding Light", column: 3, row: 7, cost: 1 },
  { id: "glistening-radiance", name: "Glistening Radiance", column: 4, row: 7, cost: 1 },
  { id: "breaking-dawn", name: "Breaking Dawn", column: 5, row: 7, cost: 1 },
  { id: "divine-revelations", name: "Divine Revelations", column: 6, row: 7, cost: 1 },
  { id: "divine-glimpse", name: "Divine Glimpse", column: 7, row: 7, cost: 1 },
  { id: "bestow-light", name: "Bestow Light", column: 9, row: 7, cost: 1 },

  { id: "beacon-of-faith", name: "Beacon of Faith", column: 2, row: 8, cost: 1 },
  { id: "empyrean-legacy", name: "Empyrean Legacy", column: 3, row: 8, cost: 1 },
  { id: "veneration", name: "Veneration", column: 4, row: 8, cost: 1 },
  { id: "avenging-wrath", name: "Avenging Wrath", column: 6, row: 8, cost: 1 },
  {
    id: "power-of-the-silver-hand",
    name: "Power of the Silver Hand",
    column: 7,
    row: 8,
    cost: 1,
  },
  { id: "tyr-s-deliverance", name: "Tyr's Deliverance", column: 8, row: 8, cost: 1 },

  { id: "truth-prevails", name: "Truth Prevails", column: 1, row: 9, cost: 1 },
  { id: "crusader-s-might", name: "Crusader's Might", column: 3, row: 9, cost: 1 },
  { id: "awakening", name: "Awakening", column: 5, row: 9, cost: 1 },
  { id: "reclamation", name: "Reclamation", column: 7, row: 9, cost: 1 },
  { id: "relentless-inquisitor", name: "Relentless Inquisitor", column: 9, row: 9, cost: 1 },

  { id: "rising-sunlight", name: "Rising Sunlight", column: 2, row: 10, cost: 1 },
  { id: "glorious-dawn", name: "Glorious Dawn", column: 4, row: 10, cost: 1 },
  { id: "blessing-of-summer", name: "Blessing of Summer", column: 5, row: 10, cost: 1 },
  {
    id: "inflorescence-of-the-sunwell",
    name: "Inflorescence of the Sunwell",
    column: 6,
    row: 10,
    cost: 1,
  },
  { id: "boundless-salvation", name: "Boundless Salvation", column: 8, row: 10, cost: 1 },
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

const lightsmithEdges = [
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

const holyEdges = [
  [5, 1, 4, 2],
  [5, 1, 6, 2],

  [4, 2, 3, 3],
  [4, 2, 5, 3],
  [6, 2, 5, 3],
  [6, 2, 7, 3],

  [3, 3, 2, 4],
  [3, 3, 4, 4],
  [3, 3, 3, 5],
  [5, 3, 5, 5],
  [7, 3, 6, 4],
  [7, 3, 8, 4],
  [7, 3, 7, 5],

  [2, 4, 1, 5],
  [2, 4, 2, 6],
  [4, 4, 4, 6],
  [6, 4, 6, 6],
  [8, 4, 9, 5],
  [8, 4, 8, 6],

  [1, 5, 1, 7],
  [3, 5, 2, 6],
  [3, 5, 3, 6],
  [3, 5, 4, 6],
  [5, 5, 4, 6],
  [5, 5, 6, 6],
  [7, 5, 6, 6],
  [7, 5, 7, 6],
  [7, 5, 8, 6],
  [9, 5, 9, 7],

  [2, 6, 1, 7],
  [2, 6, 3, 7],
  [3, 6, 3, 7],
  [4, 6, 3, 7],
  [4, 6, 4, 7],
  [4, 6, 5, 7],
  [6, 6, 5, 7],
  [6, 6, 6, 7],
  [6, 6, 7, 7],
  [7, 6, 7, 7],
  [8, 6, 7, 7],

  [1, 7, 2, 8],
  [3, 7, 2, 8],
  [3, 7, 3, 8],
  [3, 7, 4, 8],
  [4, 7, 4, 8],
  [5, 7, 4, 8],
  [5, 7, 6, 8],
  [6, 7, 6, 8],
  [7, 7, 6, 8],
  [7, 7, 7, 8],
  [7, 7, 8, 8],
  [9, 7, 8, 8],

  [2, 8, 1, 9],
  [2, 8, 3, 9],
  [2, 8, 2, 10],
  [3, 8, 3, 9],
  [4, 8, 3, 9],
  [6, 8, 5, 9],
  [6, 8, 7, 9],
  [7, 8, 7, 9],
  [8, 8, 7, 9],
  [8, 8, 8, 10],
  [8, 8, 9, 9],

  [3, 9, 4, 10],
  [5, 9, 4, 10],
  [5, 9, 5, 10],
  [5, 9, 6, 10],
  [7, 9, 6, 10],
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
  "Holy Bulwark",
  "Holy Shock",
  "Light of Dawn",
  "Aura Mastery",
  "Tyr's Deliverance",
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
  "Rite of Sanctification",
  "Divine Guidance",
  "Divine Inspiration",
  "Authoritative Rebuke",
  "Moment of Compassion",
  "Holy Prism",
  "Protection of Tyr",
  "Divine Favor",
  "Beacon of Faith",
  "Avenging Wrath",
  "Awakening",
  "Blessing of Summer",
]);

function withOriginalNodeShapes(nodes: TalentNode[]): TalentNode[] {
  return nodes.map((node) => ({
    ...node,
    shape: squareNodeNames.has(node.name)
      ? "square"
      : hexagonNodeNames.has(node.name)
        ? "hexagon"
        : "circle",
  }));
}

const paladinTreeNodes = withOriginalNodeShapes(paladinNodes);
const lightsmithTreeNodes = withOriginalNodeShapes(holyLightsmithNodes);
const holyTreeNodes = withOriginalNodeShapes(holyNodes);

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
      className={`${widthClass} box-border flex shrink-0 flex-col items-center rounded-[8px] border border-white/20 bg-[#1a1a1a] p-[15px]`}
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

export default function HolyTalentTreeLightsmith() {
  return (
    <section
      className="w-full bg-[#151515] text-white"
      data-build="holy-lightsmith"
    >
      <div className="w-full overflow-x-auto">
        <div
          className="
            mx-auto
            flex
            w-[1490px]
            min-w-[1490px]
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
            widthClass="w-[560px]"
            edges={paladinEdges}
          />

          <TreeColumn
            title="Lightsmith"
            treeKey="holy-lightsmith"
            nodes={lightsmithTreeNodes}
            maxPoints={10}
            columns={3}
            widthClass="w-[220px]"
            edges={lightsmithEdges}
          />

          <TreeColumn
            title="Holy"
            treeKey="holy"
            nodes={holyTreeNodes}
            maxPoints={31}
            columns={9}
            widthClass="w-[680px]"
            edges={holyEdges}
          />
        </div>
      </div>
    </section>
  );
}