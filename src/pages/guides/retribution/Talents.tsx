"use client";

import TalentTree, { type TalentNode } from "@/components/talent-trees/TalentTree";

const paladinNodes = [
  {
    "id": "lay-on-hands",
    "name": "Lay on Hands",
    "column": 2,
    "row": 1,
    "cost": 1
  },
  {
    "id": "auras-of-the-resolute",
    "name": "Auras of the Resolute",
    "column": 4,
    "row": 1,
    "cost": 1
  },
  {
    "id": "hammer-of-wrath",
    "name": "Hammer of Wrath",
    "column": 6,
    "row": 1,
    "cost": 1
  },
  {
    "id": "improved-cleanse",
    "name": "Improved Cleanse",
    "column": 1,
    "row": 2,
    "cost": 1
  },
  {
    "id": "empyreal-ward",
    "name": "Empyreal Ward",
    "column": 2,
    "row": 2,
    "cost": 1
  },
  {
    "id": "fist-of-justice",
    "name": "Fist of Justice",
    "column": 3,
    "row": 2,
    "cost": 1
  },
  {
    "id": "blinding-light",
    "name": "Blinding Light",
    "column": 5,
    "row": 2,
    "cost": 1
  },
  {
    "id": "turn-evil",
    "name": "Turn Evil",
    "column": 7,
    "row": 2,
    "cost": 1
  },
  {
    "id": "a-just-reward",
    "name": "A Just Reward",
    "column": 1,
    "row": 3,
    "cost": 1
  },
  {
    "id": "afterimage",
    "name": "Afterimage",
    "column": 2,
    "row": 3,
    "cost": 1
  },
  {
    "id": "divine-steed",
    "name": "Divine Steed",
    "column": 4,
    "row": 3,
    "cost": 1
  },
  {
    "id": "light-s-countenance",
    "name": "Light's Countenance",
    "column": 5,
    "row": 3,
    "cost": 1
  },
  {
    "id": "greater-judgment",
    "name": "Greater Judgment",
    "column": 6,
    "row": 3,
    "cost": 1
  },
  {
    "id": "wrench-evil",
    "name": "Wrench Evil",
    "column": 7,
    "row": 3,
    "cost": 1
  },
  {
    "id": "holy-reprieve",
    "name": "Holy Reprieve",
    "column": 1,
    "row": 4,
    "cost": 1
  },
  {
    "id": "cavalier",
    "name": "Cavalier",
    "column": 3,
    "row": 4,
    "cost": 1
  },
  {
    "id": "divine-spurs",
    "name": "Divine Spurs",
    "column": 4,
    "row": 4,
    "cost": 1
  },
  {
    "id": "blessing-of-freedom",
    "name": "Blessing of Freedom",
    "column": 5,
    "row": 4,
    "cost": 1
  },
  {
    "id": "rebuke",
    "name": "Rebuke",
    "column": 7,
    "row": 4,
    "cost": 1
  },
  {
    "id": "obduracy",
    "name": "Obduracy",
    "column": 2,
    "row": 5,
    "cost": 1
  },
  {
    "id": "divine-toll",
    "name": "Divine Toll",
    "column": 4,
    "row": 5,
    "cost": 1
  },
  {
    "id": "echoing-blessings",
    "name": "Echoing Blessings",
    "column": 5,
    "row": 5,
    "cost": 1
  },
  {
    "id": "sanctified-plates",
    "name": "Sanctified Plates",
    "column": 6,
    "row": 5,
    "cost": 1
  },
  {
    "id": "punishment",
    "name": "Punishment",
    "column": 7,
    "row": 5,
    "cost": 1
  },
  {
    "id": "divine-reach",
    "name": "Divine Reach",
    "column": 1,
    "row": 6,
    "cost": 1
  },
  {
    "id": "blessing-of-sacrifice",
    "name": "Blessing of Sacrifice",
    "column": 3,
    "row": 6,
    "cost": 1
  },
  {
    "id": "quickened-invocation",
    "name": "Quickened Invocation",
    "column": 4,
    "row": 6,
    "cost": 1
  },
  {
    "id": "blessing-of-protection",
    "name": "Blessing of Protection",
    "column": 5,
    "row": 6,
    "cost": 1
  },
  {
    "id": "consecrated-ground",
    "name": "Consecrated Ground",
    "column": 7,
    "row": 6,
    "cost": 1
  },
  {
    "id": "holy-aegis",
    "name": "Holy Aegis",
    "column": 2,
    "row": 7,
    "cost": 1
  },
  {
    "id": "sacrifice-of-the-just",
    "name": "Sacrifice of the Just",
    "column": 3,
    "row": 7,
    "cost": 1
  },
  {
    "id": "divine-purpose",
    "name": "Divine Purpose",
    "column": 4,
    "row": 7,
    "cost": 1
  },
  {
    "id": "improved-blessing-of-protection",
    "name": "Improved Blessing of Protection",
    "column": 5,
    "row": 7,
    "cost": 1
  },
  {
    "id": "unbreakable-spirit",
    "name": "Unbreakable Spirit",
    "column": 6,
    "row": 7,
    "cost": 1
  },
  {
    "id": "lightforged-blessing",
    "name": "Lightforged Blessing",
    "column": 1,
    "row": 8,
    "cost": 1
  },
  {
    "id": "lead-the-charge",
    "name": "Lead the Charge",
    "column": 2,
    "row": 8,
    "cost": 1
  },
  {
    "id": "righteous-protection",
    "name": "Righteous Protection",
    "column": 3,
    "row": 8,
    "cost": 1
  },
  {
    "id": "holy-ritual",
    "name": "Holy Ritual",
    "column": 4,
    "row": 8,
    "cost": 1
  },
  {
    "id": "blessed-calling",
    "name": "Blessed Calling",
    "column": 5,
    "row": 8,
    "cost": 1
  },
  {
    "id": "inspired-guard",
    "name": "Inspired Guard",
    "column": 6,
    "row": 8,
    "cost": 1
  },
  {
    "id": "judgment-of-light",
    "name": "Judgment of Light",
    "column": 7,
    "row": 8,
    "cost": 1
  },
  {
    "id": "faith-s-armor",
    "name": "Faith's Armor",
    "column": 1,
    "row": 9,
    "cost": 1
  },
  {
    "id": "stoicism",
    "name": "Stoicism",
    "column": 2,
    "row": 9,
    "cost": 1
  },
  {
    "id": "seal-of-might",
    "name": "Seal of Might",
    "column": 3,
    "row": 9,
    "cost": 1
  },
  {
    "id": "seal-of-the-crusader",
    "name": "Seal of the Crusader",
    "column": 4,
    "row": 9,
    "cost": 1
  },
  {
    "id": "vengeful-wrath",
    "name": "Vengeful Wrath",
    "column": 5,
    "row": 9,
    "cost": 1
  },
  {
    "id": "eye-for-an-eye",
    "name": "Eye for an Eye",
    "column": 6,
    "row": 9,
    "cost": 1
  },
  {
    "id": "golden-path",
    "name": "Golden Path",
    "column": 7,
    "row": 9,
    "cost": 1
  },
  {
    "id": "of-dusk-and-dawn",
    "name": "Of Dusk and Dawn",
    "column": 2,
    "row": 10,
    "cost": 1
  },
  {
    "id": "lightbearer",
    "name": "Lightbearer",
    "column": 4,
    "row": 10,
    "cost": 1
  },
  {
    "id": "light-s-revocation",
    "name": "Light's Revocation",
    "column": 6,
    "row": 10,
    "cost": 1
  }
] satisfies TalentNode[];
const retributionNodes = [
  {
    "id": "blade-of-justice",
    "name": "Blade of Justice",
    "column": 5,
    "row": 1,
    "cost": 1
  },
  {
    "id": "divine-storm",
    "name": "Divine Storm",
    "column": 5,
    "row": 2,
    "cost": 1
  },
  {
    "id": "swift-justice",
    "name": "Swift Justice",
    "column": 2,
    "row": 3,
    "cost": 1
  },
  {
    "id": "expurgation",
    "name": "Expurgation",
    "column": 4,
    "row": 3,
    "cost": 1
  },
  {
    "id": "judgement-of-justice",
    "name": "Judgement of Justice",
    "column": 6,
    "row": 3,
    "cost": 1
  },
  {
    "id": "holy-blade",
    "name": "Holy Blade",
    "column": 8,
    "row": 3,
    "cost": 1
  },
  {
    "id": "final-verdict",
    "name": "Final Verdict",
    "column": 2,
    "row": 4,
    "cost": 1
  },
  {
    "id": "guided-prayer",
    "name": "Guided Prayer",
    "column": 5,
    "row": 4,
    "cost": 1
  },
  {
    "id": "art-of-war",
    "name": "Art of War",
    "column": 8,
    "row": 4,
    "cost": 1
  },
  {
    "id": "jurisdiction",
    "name": "Jurisdiction",
    "column": 1,
    "row": 5,
    "cost": 1
  },
  {
    "id": "tempest-of-the-lightbringer",
    "name": "Tempest of the Lightbringer",
    "column": 3,
    "row": 5,
    "cost": 1
  },
  {
    "id": "crusade",
    "name": "Crusade",
    "column": 5,
    "row": 5,
    "cost": 1
  },
  {
    "id": "vanguard-s-momentum",
    "name": "Vanguard's Momentum",
    "column": 7,
    "row": 5,
    "cost": 1
  },
  {
    "id": "zealot-s-fervor",
    "name": "Zealot's Fervor",
    "column": 8,
    "row": 5,
    "cost": 1
  },
  {
    "id": "rush-of-light",
    "name": "Rush of Light",
    "column": 9,
    "row": 5,
    "cost": 1
  },
  {
    "id": "boundless-judgment",
    "name": "Boundless Judgment",
    "column": 2,
    "row": 6,
    "cost": 1
  },
  {
    "id": "crusading-strikes",
    "name": "Crusading Strikes",
    "column": 4,
    "row": 6,
    "cost": 1
  },
  {
    "id": "divine-wrath",
    "name": "Divine Wrath",
    "column": 5,
    "row": 6,
    "cost": 1
  },
  {
    "id": "divine-hammer",
    "name": "Divine Hammer",
    "column": 6,
    "row": 6,
    "cost": 1
  },
  {
    "id": "holy-flames",
    "name": "Holy Flames",
    "column": 8,
    "row": 6,
    "cost": 1
  },
  {
    "id": "empyrean-legacy",
    "name": "Empyrean Legacy",
    "column": 1,
    "row": 7,
    "cost": 1
  },
  {
    "id": "heart-of-the-crusader",
    "name": "Heart of the Crusader",
    "column": 2,
    "row": 7,
    "cost": 1
  },
  {
    "id": "highlord-s-wrath",
    "name": "Highlord's Wrath",
    "column": 3,
    "row": 7,
    "cost": 1
  },
  {
    "id": "wake-of-ashes",
    "name": "Wake of Ashes",
    "column": 5,
    "row": 7,
    "cost": 1
  },
  {
    "id": "blessed-champion",
    "name": "Blessed Champion",
    "column": 7,
    "row": 7,
    "cost": 1
  },
  {
    "id": "judge-jury-and-executioner",
    "name": "Judge, Jury and Executioner",
    "column": 9,
    "row": 7,
    "cost": 1
  },
  {
    "id": "adjudication",
    "name": "Adjudication",
    "column": 2,
    "row": 8,
    "cost": 1
  },
  {
    "id": "shield-of-vengeance",
    "name": "Shield of Vengeance",
    "column": 5,
    "row": 8,
    "cost": 1
  },
  {
    "id": "penitence",
    "name": "Penitence",
    "column": 8,
    "row": 8,
    "cost": 1
  },
  {
    "id": "blades-of-light",
    "name": "Blades of Light",
    "column": 2,
    "row": 9,
    "cost": 1
  },
  {
    "id": "execution-sentence",
    "name": "Execution Sentence",
    "column": 4,
    "row": 9,
    "cost": 1
  },
  {
    "id": "seething-flames",
    "name": "Seething Flames",
    "column": 6,
    "row": 9,
    "cost": 1
  },
  {
    "id": "burning-crusade",
    "name": "Burning Crusade",
    "column": 8,
    "row": 9,
    "cost": 1
  },
  {
    "id": "divine-arbiter",
    "name": "Divine Arbiter",
    "column": 2,
    "row": 10,
    "cost": 1
  },
  {
    "id": "executioner-s-will",
    "name": "Executioner's Will",
    "column": 3,
    "row": 10,
    "cost": 1
  },
  {
    "id": "divine-auxiliary",
    "name": "Divine Auxiliary",
    "column": 4,
    "row": 10,
    "cost": 1
  },
  {
    "id": "radiant-glory",
    "name": "Radiant Glory",
    "column": 6,
    "row": 10,
    "cost": 1
  },
  {
    "id": "burn-to-ash",
    "name": "Burn to Ash",
    "column": 7,
    "row": 10,
    "cost": 1
  },
  {
    "id": "searing-light",
    "name": "Searing Light",
    "column": 8,
    "row": 10,
    "cost": 1
  }
] satisfies TalentNode[];
const retribution_heraldNodes = [
  {
    "id": "dawnlight",
    "name": "Dawnlight",
    "column": 2,
    "row": 1,
    "cost": 1
  },
  {
    "id": "gleaming-rays",
    "name": "Gleaming Rays",
    "column": 1,
    "row": 2,
    "cost": 1
  },
  {
    "id": "eternal-flame",
    "name": "Eternal Flame",
    "column": 2,
    "row": 2,
    "cost": 1
  },
  {
    "id": "luminosity",
    "name": "Luminosity",
    "column": 3,
    "row": 2,
    "cost": 1
  },
  {
    "id": "will-of-the-dawn",
    "name": "Will of the Dawn",
    "column": 1,
    "row": 3,
    "cost": 1
  },
  {
    "id": "blessing-of-anshe",
    "name": "Blessing of Anshe",
    "column": 2,
    "row": 3,
    "cost": 1
  },
  {
    "id": "sun-sear",
    "name": "Sun Sear",
    "column": 3,
    "row": 3,
    "cost": 1
  },
  {
    "id": "aurora",
    "name": "Aurora",
    "column": 1,
    "row": 4,
    "cost": 1
  },
  {
    "id": "solar-grace",
    "name": "Solar Grace",
    "column": 2,
    "row": 4,
    "cost": 1
  },
  {
    "id": "second-sunrise",
    "name": "Second Sunrise",
    "column": 3,
    "row": 4,
    "cost": 1
  },
  {
    "id": "dawnlight-2",
    "name": "Dawnlight",
    "column": 2,
    "row": 5,
    "cost": 1
  }
] satisfies TalentNode[];
const retribution_templarNodes = [
  {
    "id": "holy-bulwark",
    "name": "Holy Bulwark",
    "column": 2,
    "row": 1,
    "cost": 1
  },
  {
    "id": "rite-of-sanctification",
    "name": "Rite of Sanctification",
    "column": 1,
    "row": 2,
    "cost": 1
  },
  {
    "id": "solidarity",
    "name": "Solidarity",
    "column": 2,
    "row": 2,
    "cost": 1
  },
  {
    "id": "divine-guidance",
    "name": "Divine Guidance",
    "column": 3,
    "row": 2,
    "cost": 1
  },
  {
    "id": "laying-down-arms",
    "name": "Laying Down Arms",
    "column": 1,
    "row": 3,
    "cost": 1
  },
  {
    "id": "divine-inspiration",
    "name": "Divine Inspiration",
    "column": 2,
    "row": 3,
    "cost": 1
  },
  {
    "id": "authoritative-rebuke",
    "name": "Authoritative Rebuke",
    "column": 3,
    "row": 3,
    "cost": 1
  },
  {
    "id": "shared-resolve",
    "name": "Shared Resolve",
    "column": 1,
    "row": 4,
    "cost": 1
  },
  {
    "id": "valiance",
    "name": "Valiance",
    "column": 2,
    "row": 4,
    "cost": 1
  },
  {
    "id": "hammer-and-anvil",
    "name": "Hammer and Anvil",
    "column": 3,
    "row": 4,
    "cost": 1
  },
  {
    "id": "blessing-of-the-forge",
    "name": "Blessing of the Forge",
    "column": 2,
    "row": 5,
    "cost": 1
  }
] satisfies TalentNode[];

const builds = [
  { key: "retribution-herald", title: "Herald of the Sun", nodes: retribution_heraldNodes },
  { key: "retribution-templar", title: "Templar", nodes: retribution_templarNodes },
] as const;

function TreeColumn({ title, treeKey, nodes, maxPoints }: { title: string; treeKey: string; nodes: TalentNode[]; maxPoints: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-amber-400/40 bg-black/30 p-3">
      <h3 className="mb-3 text-center text-lg font-bold text-amber-200">{title}</h3>
      <TalentTree treeKey={treeKey} build={title} nodes={nodes} maxPoints={maxPoints} />
    </div>
  );
}

export default function Talents() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Retribution Paladin Talents</h1>
          <p className="mx-auto mt-3 max-w-3xl text-slate-300">
            Build the Paladin class tree, a hero tree and the Retribution specialization tree. Selections are saved locally and sent to the PaladinHub talent endpoint when available.
          </p>
        </header>

        {builds.map((build, index) => (
          <section key={build.key} id={`talent-tree-${index + 1}`} className="mb-10">
            <h2 className="mb-5 text-center text-2xl font-bold">Retribution + {build.title}</h2>
            <div className="grid gap-5 xl:grid-cols-3">
              <TreeColumn title="Paladin" treeKey="paladin" nodes={paladinNodes} maxPoints={31} />
              <TreeColumn title={build.title} treeKey={build.key} nodes={build.nodes} maxPoints={10} />
              <TreeColumn title="Retribution" treeKey="retribution" nodes={retributionNodes} maxPoints={31} />
            </div>
            {index < builds.length - 1 ? <div className="mx-auto mt-10 h-px max-w-5xl bg-amber-400/60" /> : null}
          </section>
        ))}
      </div>
    </main>
  );
}
