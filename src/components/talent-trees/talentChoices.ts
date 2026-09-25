import type { TalentNode } from "./TalentTree";

// Paladin choice slots shared by the bundled class, specialization and hero trees.
const alternatives: Record<string, string> = {
  "Wrench Evil": "Stand Against Evil",
  "Blessing of Freedom": "Steed of Liberty",
  "Echoing Blessings": "Unbound Freedom",
  "Quickened Invocation": "Divine Resonance",
  "Sacrifice of the Just": "Recompense",
  "Righteous Protection": "Worthy Sacrifice",
  "Golden Path": "Selfless Healer",
  "Blessing of An'she": "Lingering Radiance",
  "Rite of Sanctification": "Rite of Adjuration",
  "Divine Guidance": "Blessed Assurance",
  "Divine Inspiration": "Forewarning",
  "Authoritative Rebuke": "Tempered in Battle",
  "Unrelenting Charger": "Bonds of Fellowship",
  Sanctification: "Endless Wrath",
  "Swift Justice": "Light of Justice",
  "Holy Blade": "Improved Blade of Justice",
  "Art of War": "Righteous Cause",
  "Boundless Judgment": "Improved Judgment",
  "Crusading Strikes": "Templar Strikes",
  "Blessed Hammer": "Hammer of the Righteous",
  Redoubt: "Imbued Shield",
  "Blessing of Spellwarding": "Uther's Counsel",
  "Tirion's Devotion": "Light of the Titans",
  "Strength in Adversity": "Crusader's Resolve",
  "Beacon of Faith": "Beacon of Virtue",
  "Avenging Wrath": "Avenging Crusader",
  Awakening: "Sanctified Wrath",
};

const availableIcons = new Set([
  "Divine Resonance", "Uther's Counsel", "Avenging Crusader", "Beacon of Virtue",
  "Hammer of the Righteous", "Stand Against Evil", "Recompense", "Selfless Healer",
]);

const alternativeEffects: Record<string, { description: string; url?: string }> = {
  "Stand Against Evil": { description: "Turn Evil affects five additional enemies.", url: "https://www.wowhead.com/spell=469317/stand-against-evil" },
  "Steed of Liberty": { description: "Divine Steed also grants Blessing of Freedom for 3 seconds.", url: "https://www.wowhead.com/spell=469304/steed-of-liberty" },
  "Unbound Freedom": { description: "Blessing of Freedom increases movement speed by 30% and also affects you when cast on an ally.", url: "https://www.wowhead.com/spell=305394/unbound-freedom" },
  "Divine Resonance": { description: "After Divine Toll, periodically casts a specialization-specific ability for 15 seconds.", url: "https://www.wowhead.com/spell=386738/divine-resonance" },
  Recompense: { description: "Damage diverted by Blessing of Sacrifice adds bonus damage to your next Judgment or healing to your next Word of Glory.", url: "https://www.wowhead.com/spell=397191/recompense" },
  "Worthy Sacrifice": { description: "Automatically casts Blessing of Sacrifice on an ally below 35% health within 40 yards.", url: "https://www.wowhead.com/spell=469279/worthy-sacrifice" },
  "Lingering Radiance": { description: "Dawnlight leaves an Eternal Flame healing effect when it expires." },
  "Rite of Adjuration": { description: "Increases Stamina and gives Holy Power spenders a chance to heal nearby allies." },
  "Blessed Assurance": { description: "Holy Power spenders increase the damage of your next Hammer of the Righteous or Blessed Hammer." },
  "Beacon of Virtue": { description: "Applies a Beacon of Light effect to several allies for a short duration." },
};

export function withTalentChoice(node: TalentNode): TalentNode {
  if (node.alternative?.name.trim()) return { ...node, shape: "hexagon" };
  const alternativeName = alternatives[node.name];
  if (alternativeName && node.shape === "hexagon") {
    return { ...node, alternative: {
      name: alternativeName,
      ...alternativeEffects[alternativeName],
      icon: availableIcons.has(alternativeName)
        ? `/images/SpellIcons/${alternativeName.replace(/['’]/g, "")}.jpg` : undefined,
    } };
  }
  // A hexagonal node without two real choices would incorrectly imply a choice.
  return node.shape === "hexagon" ? { ...node, shape: "circle" } : node;
}
