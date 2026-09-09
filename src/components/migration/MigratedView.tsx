"use client";

import type { FormEvent, HTMLAttributes } from "react";
import { useLocation } from "@/router/nextCompat";
import styles from "./MigratedView.module.css";

type HtmlViewProps = {
  html: string;
  className?: string;
};

type PageViewProps = HtmlViewProps & {
  title?: string;
};

type GuideSection = "holy" | "protection" | "retribution";
type GuidePage = "overview" | "gear" | "talents" | "consumables" | "rotation" | "stats";

type GuideButton = {
  url: string;
  text: string;
  icon: string;
};

const stopLegacyFormSubmission = (event: FormEvent<HTMLDivElement>) => {
  event.preventDefault();
};

const guideMeta: Record<GuideSection, { cover: string; titles: Record<GuidePage, string>; texts: Record<GuidePage, string> }> = {
  holy: {
    cover: "/images/TheHolyCover2.jpg",
    titles: {
      overview: "Holy Paladin Healer Guide - The War Within",
      gear: "Holy Paladin Gear and Best in Slot - The War Within",
      talents: "Best Holy Paladin Talent Tree Builds - The War Within",
      consumables: "Holy Paladin Enchants & Consumables - The War Within",
      rotation: "Holy Paladin Rotation Guide - The War Within",
      stats: "Holy Paladin Stat Priority - The War Within",
    },
    texts: {
      overview: "\t\t\t\t\tHoly Paladin is a plate-wearing Healer specialization with a wide range of damage reduction and defensive abilities. We specialize in healing specific targets with large single-target heals, commonly referred to as “spot healing”. Holy Paladin gets access to the iconic Beacon of Light ability at level 16, which allows us to keep a consistent stream of healing on a specific target while healing other allies who might need it!\r\n\r\n\t\t\t\t\tBesides the classic Healer resource, Mana, Holy Paladins also utilize a secondary resource known as Holy Power, which functions similarly to Combo Points. Most of our spells generate this resource, which we can then use to cast our most powerful heals, Word of Glory and Light of Dawn.\r\n",
      talents: "Here are all the best Holy Paladin Talent Tree builds in the Patch 11.1.7 & Season 2 for raids and Mythic+, including export links to import these builds directly into the game.\r\n\r\nFor recommended talent builds for each raid boss and Mythic+ dungeon, check out our Liberation of Undermine Raid Page and Mythic+ page.",
      gear: "\t\t\t\t\tGear is one of the most important elements in WoW to strengthen your Holy Paladin, providing massive amounts of stats as well as armor, procs, and set bonuses.\r\n\r\n\t\t\t\t\tThis guide will explain how to obtain the best gear for your Holy Paladin in Patch 11.1.5 & Season 2 and how to check if a piece is Best in Slot (BiS), an upgrade, or just bad.\r\n\t\t\t\t\tThis guide will help you select the best pieces of gear from Dungeons and Raids in The War Within, whether they be weapons, trinkets, or armor.\r\n",
      consumables: "Consumables are a vital part of high-level content in WoW, like Mythic+ Dungeons and Raids, providing additional ways for players to improve and customize their stats outside of gear.\r\n\r\nIn this guide, we will explain the best Holy Paladin gems, Holy Paladin flasks, Holy Paladin potions, and Holy Paladin enchants in Patch 11.1.7 & Season 2, as well as cheaper alternatives.\r\nBelow you will find the best Holy Paladin enchants and consumables. Make sure to also check our The War Within Profession Guide for all profession details, updated for Patch 11.1.7 & Season 2.",
      stats: "Stats are a key component when customizing your Holy Paladin in World of Warcraft The War Within--having the right combination of them can be crucial to your performance.\r\n\r\nIn this guide, we will detail the best stat priority for your Holy Paladin, as well as provide explanations covering how to determine Holy Paladin stat priorities personalized for your character in Patch 11.1.7 & Season 2, as well as how to check if a piece of gear is BiS, upgrade or just bad for you.\r\n\r\nBesides talking about your Holy Paladin stat priority, we will also cover your stats in-depth, explaining nuances and synergies for niche situations that go beyond a generic Holy Paladin priority.",
      rotation: "Learn the best Holy Paladin rotation for The War Within Season 2. Details about how to excel at your Holy Paladin and the optimal rotation for all talent builds in dungeons and raids for Patch 11.1.7 & Season 2.",
    },
  },
  protection: {
    cover: "/images/ProtCoverV5.png",
    titles: {
      overview: "Protection Paladin Main Guide – The War Within",
      gear: "Protection Paladin Best in Slot – The War Within",
      talents: "Best Protection Paladin Talent Tree Builds – The War Within",
      consumables: "Protection Paladin Consumables – The War Within",
      rotation: "Protection Paladin Rotation Guide – The War Within",
      stats: "Protection Paladin Stat Priority – The War Within",
    },
    texts: {
      overview: "Welcome to the 11.1.7 Season 2 Protection Paladin guide. This guide will help you master your Protection Paladin in all aspects of the game including raids and dungeons.",
      talents: "This page covers the best Protection Paladin talent tree builds for Season 2 in raids and Mythic+, including exports to import these builds directly into the game.",
      gear: "Gear is one of the most important elements in WoW to strengthen your Protection Paladin, providing massive amounts of stats as well as armor, procs, and set bonuses.",
      consumables: "Consumables can add a vital amount of high-value secondary stats and buffs, providing another way for players to improve and customize their stats outside of gear.",
      stats: "Stats are a key component when customizing your Protection Paladin for raiding and Mythic+.",
      rotation: "Learn the best Protection Paladin rotation for The War Within Season 2. Details about how to excel at your Protection Paladin and the optimal rotation for all talent builds in dungeons and raids.",
    },
  },
  retribution: {
    cover: "/images/RetributionCoverOrig.jpg",
    titles: {
      overview: "Retribution Paladin DPS Guide - The War Within",
      gear: "Retribution Paladin Gear and Best in Slot - The War Within",
      talents: "Best Retribution Paladin Talent Tree Builds - The War Within",
      consumables: "Retribution Paladin Enchants & Consumables - The War Within",
      rotation: "Retribution Paladin Rotation Guide - The War Within",
      stats: "Retribution Paladin Stat Priority - The War Within",
    },
    texts: {
      overview: "Welcome to Patch 11.1.7 & Season 2 Retribution Paladin guide. This guide will help you master your Retribution Paladin in all aspects of the game including raids and dungeons.",
      talents: "Here are all the best Retribution Paladin Talent Tree builds in the Patch 11.1.7 & Season 2 for raids and Mythic+, including export links to import these builds directly into the game.\r\n\r\nFor recommended talent builds for each raid boss and Mythic+ dungeon, check out our Liberation of Undermine Raid Page and Mythic+ page.",
      gear: "Gear is one of the most important elements in WoW to strengthen your Retribution Paladin, providing massive amounts of stats as well as armor, procs, and set bonuses.\r\n\r\nWe will explain how to obtain the best gear for your Retribution Paladin in Patch 11.1.7 & Season 2 and how to check if a piece is BiS, an upgrade, or just bad. This guide will help you select the best pieces of gear from Dungeons and Raids in The War Within, whether they be weapons, trinkets, or armor.\r\n",
      consumables: "Consumables are a vital part of high-level content in WoW, like Mythic+ Dungeons and Raids, providing additional ways for players to improve and customize their stats outside of gear.\r\n\r\nIn this guide, we will explain the best Retribution Paladin gems, Retribution Paladin flasks, Retribution Paladin potions, and Retribution Paladin enchants in Patch 11.1.7 & Season 2, as well as cheaper alternatives.\r\nBelow you will find the best Retribution Paladin enchants and consumables. Make sure to also check our The War Within Profession Guide for all profession details, updated for Patch 11.1.7 & Season 2.\r\n",
      stats: "Stats are a key component when customizing your Retribution Paladin in World of Warcraft The War Within--having the right combination of them can be crucial to your performance.\r\n\r\nIn this guide, we will detail the best stat priority for your Retribution Paladin, as well as provide explanations covering how to determine Retribution Paladin stat priorities personalized for your character in Patch 11.1.7 & Season 2, as well as how to check if a piece of gear is BiS, upgrade or just bad for you.\r\n\r\nBesides talking about your Retribution Paladin stat priority, we will also cover your stats in-depth, explaining nuances and synergies for niche situations that go beyond a generic Retribution Paladin priority.\r\n",
      rotation: "Learn the best Retribution Paladin rotation for The War Within Season 2. Details about how to excel at your Retribution Paladin and the optimal rotation for all talent builds in dungeons and raids for Patch 11.1.7 & Season 2.",
    },
  },
};

const currentButtons: Record<GuidePage, GuideButton[]> = {
  overview: [
    { url: "#rotation", text: "Scroll to Rotation", icon: "/images/icons/ui_spellbook_onebutton.jpg" },
    { url: "#talents", text: "Scroll to Talents", icon: "/images/itemIcons/talents.jpg" },
  ],
  gear: [
    { url: "#overall-bis", text: "Overall BiS", icon: "/images/SpellIcons/Divine Hammer.jpg" },
    { url: "#raid-mythic-bis", text: "Raid / Mythic+ BiS", icon: "/images/icons/inv_plate_raidpaladingoblin_d_01_helm.jpg" },
    { url: "#best-trinkets", text: "Best Trinkets", icon: "/images/icons/EyeOfKezan.jpg" },
    { url: "#upgrade-priorities", text: "Upgrade Priorities", icon: "/images/icons/inv_crestupgrade_undermine_gilded.jpg" },
    { url: "#cyrces-circlet", text: "Cyrce's Circlet", icon: "/images/icons/Cyrces Circlet.jpg" },
    { url: "#corruptions", text: "Corruptions", icon: "/images/icons/inv_eyeofnzothpet.jpg" },
    { url: "#cartel-chip-usage", text: "Cartel Chip Usage", icon: "/images/icons/inv_misc_curiouscoin.jpg" },
    { url: "#crafted-gear", text: "Crafted Gear", icon: "/images/icons/inv_spark_whole_orange (1).jpg" },
  ],
  consumables: [
    { url: "#enchants", text: "Enchants", icon: "/images/itemIcons/inv_misc_enchantedscroll.jpg" },
    { url: "#consumables", text: "Consumables", icon: "/images/itemIcons/inv_potion_green.jpg" },
    { url: "#food", text: "Food", icon: "/images/itemIcons/inv_misc_food_meat_cooked_02_color02.jpg" },
    { url: "#gems", text: "Gems", icon: "/images/itemIcons/inv_10_jewelcrafting_gem3primal_cut_red.jpg" },
  ],
  rotation: [
    { url: "#how-to-play", text: "How to Play", icon: "/images/SpellIcons/Unending Light.jpg" },
    { url: "#rotation-and-spell-priority", text: "Rotation and Spell Priority", icon: "/images/SpellIcons/Aura Mastery.jpg" },
    { url: "#single-button-rotation", text: "Single Button Rotation Assistant", icon: "/images/icons/ui_spellbook_onebutton.jpg" },
    { url: "#major-cooldown-usage", text: "Major Cooldown Usage", icon: "/images/SpellIcons/Divine Toll.jpg" },
    { url: "#advanced-insights", text: "Advanced Insights", icon: "/images/SpellIcons/Beacon of Virtue.jpg" },
  ],
  stats: [
    { url: "#stats-overview-section", text: "Stats Overview", icon: "/images/SpellIcons/Divine Hammer.jpg" },
    { url: "#best-stats-section", text: "Best Stats", icon: "/images/icons/inv_10_inscription2_repcontracts_scroll_02_uprez_color2.jpg" },
  ],
  talents: [
    { url: "#talents-tree-1", text: "Scroll to Talents", icon: "/images/itemIcons/talents.jpg" },
    { url: "#talents-tree-2", text: "Scroll to Talents", icon: "/images/itemIcons/talents.jpg" },
  ],
};

const guidePages = new Set<GuidePage>(["overview", "gear", "talents", "consumables", "rotation", "stats"]);
const guideSections = new Set<GuideSection>(["holy", "protection", "retribution"]);

function otherButtons(section: GuideSection): GuideButton[] {
  const base = `/${section[0].toUpperCase()}${section.slice(1)}`;
  return [
    { url: `${base}/Overview`, text: "Overview", icon: "/images/SpellIcons/Divine Hammer.jpg" },
    { url: `${base}/Gear`, text: "BiS Gear", icon: "/images/itemIcons/inv_chest_plate_earthendungeon_c_01.jpg" },
    { url: `${base}/Talents`, text: "Talent Builds", icon: "/images/itemIcons/talents.jpg" },
    { url: `${base}/Consumables`, text: "Consumables", icon: "/images/itemIcons/inv_potion_green.jpg" },
    { url: `${base}/Rotation`, text: "Rotation", icon: "/images/icons/ui_spellbook_onebutton.jpg" },
    { url: `${base}/Stats`, text: "Stats", icon: "/images/icons/inv_10_inscription2_repcontracts_scroll_02_uprez_color2.jpg" },
    { url: `${base}/Overview`, text: "CheatSheet", icon: "/images/itemIcons/inv_misc_note_03.jpg" },
    { url: `${base}/WA-Addons`, text: "WA & Addons", icon: "/images/icons/WA.png" },
  ];
}

function resolveGuide(pathname: string) {
  const [section, page] = pathname.toLowerCase().split("/").filter(Boolean) as [GuideSection?, GuidePage?];
  if (!section || !page || !guideSections.has(section) || !guidePages.has(page)) return null;
  return { section, page, ...guideMeta[section] };
}

function SectionGrid({ title, buttons }: { title: string; buttons: GuideButton[] }) {
  return (
    <>
      <div className="section-title" style={{ fontSize: "1.8em", textAlign: "center", color: "white" }}>{title} :</div>
      <div className="section-grid">
        {buttons.map((button) => (
          <a href={button.url} className="section-cell" key={`${button.url}-${button.text}`}>
            <span className="icon" style={{ backgroundImage: `url('${button.icon}')` }} />
            <span>{button.text}</span>
          </a>
        ))}
      </div>
    </>
  );
}

function GuideHeader({ page, cover, titles, texts }: ReturnType<typeof resolveGuide> extends infer T ? Exclude<T, null> : never) {
  return (
    <div className="outer-wrapper ph-guide-page-header">
      <div className="page-container">
        <div className="image-cover-container">
          <img src={cover} alt="Cover" className="image-cover" />
        </div>
        <div className="main-wrapper ph-guide-page-header-body">
          <br />
          <h1 className="page-title">{titles[page]}</h1>
          {texts[page] ? <p className="page-text">{texts[page]}</p> : null}
          <SectionGrid title="Current Sections" buttons={currentButtons[page]} />
          <SectionGrid title="Other Sections" buttons={otherButtons(resolveGuideSectionFromTitle(titles))} />
          <div className="separator-container">
            <img src="/images/Separators/D4.png" alt="Separator 4" className="separator" />
          </div>
          <br />
        </div>
      </div>
    </div>
  );
}

function resolveGuideSectionFromTitle(titles: Record<GuidePage, string>): GuideSection {
  if (titles === guideMeta.protection.titles) return "protection";
  if (titles === guideMeta.retribution.titles) return "retribution";
  return "holy";
}

export function GuidePageHeader() {
  const { pathname } = useLocation();
  const guide = resolveGuide(pathname);
  return guide ? <GuideHeader {...guide} /> : null;
}

export function HtmlContent({ html, className }: HtmlViewProps) {
  const classes = [styles.fragment, className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      data-migrated-content
      onSubmit={stopLegacyFormSubmission}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MigratedPageView({ title, html, className }: PageViewProps) {
  const { pathname } = useLocation();
  const guide = resolveGuide(pathname);
  const classes = [styles.content, className].filter(Boolean).join(" ");

  return (
    <main className={styles.page} data-migrated-page data-guide-page={guide ? `${guide.section}-${guide.page}` : undefined}>
      {guide ? <GuideHeader {...guide} /> : null}
      <div className={styles.pageInner} data-migrated-inner>
        {!guide && title ? <h1 className={styles.pageTitle}>{title}</h1> : undefined}
        <div
          className={classes}
          data-migrated-content
          onSubmit={stopLegacyFormSubmission}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  );
}

export type NativeDivProps = HTMLAttributes<HTMLDivElement>;
