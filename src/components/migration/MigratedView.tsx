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

const stopLegacyFormSubmission = (event: FormEvent<HTMLDivElement>) => {
  event.preventDefault();
};

const guideMeta: Record<GuideSection, { cover: string; titles: Record<GuidePage, string> }> = {
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
  },
};

const guidePages = new Set<GuidePage>(["overview", "gear", "talents", "consumables", "rotation", "stats"]);
const guideSections = new Set<GuideSection>(["holy", "protection", "retribution"]);

function resolveGuide(pathname: string) {
  const [section, page] = pathname.toLowerCase().split("/").filter(Boolean) as [GuideSection?, GuidePage?];
  if (!section || !page || !guideSections.has(section) || !guidePages.has(page)) return null;
  return { section, page, ...guideMeta[section] };
}

function GuideHeader({ section, page, cover, titles }: ReturnType<typeof resolveGuide> extends infer T ? Exclude<T, null> : never) {
  return (
    <div className="outer-wrapper ph-guide-page-header">
      <div className="page-container">
        <div className="image-cover-container">
          <img src={cover} alt={`${section} Paladin`} className="image-cover" />
        </div>
        <div className="main-wrapper ph-guide-page-header-body">
          <br />
          <h1 className="page-title">{titles[page]}</h1>
        </div>
      </div>
    </div>
  );
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
