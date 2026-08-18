"use client";

import type { ReactNode } from "react";

import HolyTalentTreeHerald from "./HolyTalentTreeHerald";
import HolyTalentTreeLightsmith from "./HolyTalentTreeLightsmith";
import ProtectionTreeLightsmith from "./ProtectionTreeLightsmith";
import ProtectionTreeTemplar from "./ProtectionTreeTemplar";
import RetributionTreeHerald from "./RetributionTreeHerald";
import RetributionTreeTemplar from "./RetributionTreeTemplar";

export type SectionTalentTreesProps = {
  section?: "holy" | "protection" | "retribution";
};

type BuildSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  separator?: boolean;
};

function BuildSection({
  id,
  title,
  children,
  separator = false,
}: BuildSectionProps) {
  return (
    <>
      <section
        id={id}
        className="mb-4 w-full"
      >
        <h2
          className="
            mt-[10px]
            pb-[30px]
            text-center
            text-2xl
            font-bold
            text-white
          "
        >
          {title}
        </h2>

        {/*
          Някои от старите tree компоненти имат собствен header.
          Скриваме го тук, защото build title-ът трябва да е само един.
        */}
        <div className="w-full [&>section>header]:hidden">
          {children}
        </div>
      </section>

      {separator ? (
        <div
          className="
            my-5
            flex
            w-full
            justify-center
          "
        >
          <img
            src="/images/Separators/D1.png"
            alt=""
            aria-hidden="true"
            className="
              block
              h-auto
              w-[95%]
            "
          />
        </div>
      ) : null}
    </>
  );
}

export default function SectionTalentTrees({
  section = "holy",
}: SectionTalentTreesProps) {
  if (section === "holy") {
    return (
      <div className="w-full min-w-0">
        <BuildSection
          id="talent-tree-1"
          title="Holy + Herald of the Sun"
          separator
        >
          <HolyTalentTreeHerald />
        </BuildSection>

        <BuildSection
          id="talent-tree-2"
          title="Holy + Lightsmith"
        >
          <HolyTalentTreeLightsmith />
        </BuildSection>
      </div>
    );
  }

  if (section === "protection") {
    return (
      <div className="w-full min-w-0">
        <BuildSection
          id="talent-tree-1"
          title="Protection + Lightsmith"
          separator
        >
          <ProtectionTreeLightsmith />
        </BuildSection>

        <BuildSection
          id="talent-tree-2"
          title="Protection + Templar"
        >
          <ProtectionTreeTemplar />
        </BuildSection>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <BuildSection
        id="talent-tree-1"
        title="Retribution + Herald of the Sun"
        separator
      >
        <RetributionTreeHerald />
      </BuildSection>

      <BuildSection
        id="talent-tree-2"
        title="Retribution + Templar"
      >
        <RetributionTreeTemplar />
      </BuildSection>
    </div>
  );
}