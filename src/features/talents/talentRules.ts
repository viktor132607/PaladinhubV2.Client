export type TalentNodeRule = {
  cost?: number;
  requires?: string[];
};

export type TalentTreeRuleSet = {
  max: number | null;
  nodes: Record<string, TalentNodeRule>;
};

export const TALENT_RULES: Record<string, TalentTreeRuleSet> = {
  paladin: {
    max: 31,
    nodes: {
      "Lay on Hands": { cost: 1 },
      "Divine Steed": { cost: 1 },
      "Blessing of Freedom": { cost: 1, requires: ["Divine Steed"] },
    },
  },
  holy: {
    max: 31,
    nodes: {
      "Holy Shock": { cost: 1 },
      "Light of Dawn": { cost: 1, requires: ["Holy Shock"] },
      "Infusion of Light": { cost: 1, requires: ["Holy Shock"] },
    },
  },
  protection: { max: 31, nodes: {} },
  retribution: { max: 31, nodes: {} },
  "holy-herald": {
    max: 11,
    nodes: {
      Dawnlight: { cost: 1 },
      "Gleaming Rays": { cost: 1, requires: ["Dawnlight"] },
      "Eternal Flame": { cost: 1, requires: ["Dawnlight"] },
      Luminosity: { cost: 1, requires: ["Dawnlight"] },
      "Will of the Dawn": {
        cost: 1,
        requires: ["Gleaming Rays", "Eternal Flame", "Luminosity"],
      },
      "Blessing of An'she": { cost: 1, requires: ["Gleaming Rays"] },
      "Sun Sear": { cost: 1, requires: ["Luminosity"] },
    },
  },
  "holy-herald-of-the-sun": {
    max: 11,
    nodes: {
      Dawnlight: { cost: 1 },
      "Gleaming Rays": { cost: 1, requires: ["Dawnlight"] },
      "Eternal Flame": { cost: 1, requires: ["Dawnlight"] },
      Luminosity: { cost: 1, requires: ["Dawnlight"] },
      "Will of the Dawn": {
        cost: 1,
        requires: ["Gleaming Rays", "Eternal Flame", "Luminosity"],
      },
      "Blessing of An'she": { cost: 1, requires: ["Gleaming Rays"] },
      "Sun Sear": { cost: 1, requires: ["Luminosity"] },
    },
  },
  "holy-lightsmith": {
    max: 11,
    nodes: {
      "Tempered in Light": { cost: 1 },
      "Steel Your Resolve": {
        cost: 1,
        requires: ["Tempered in Light"],
      },
      "Divine Inspiration": {
        cost: 1,
        requires: ["Tempered in Light"],
      },
    },
  },
  "protection-lightsmith": { max: 11, nodes: {} },
  "protection-templar": { max: 11, nodes: {} },
  "retribution-herald": { max: 11, nodes: {} },
  "retribution-templar": { max: 11, nodes: {} },
};

export function rulesForTree(treeKey: string): TalentTreeRuleSet {
  return TALENT_RULES[treeKey.toLowerCase()] ?? { max: null, nodes: {} };
}
