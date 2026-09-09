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

function BuildSection({ id, title, children, separator = false }: BuildSectionProps) {
  return (
    <>
      <section className="mb-4" id={id}>
        <h2 style={{ textAlign: "center", marginTop: "10px" }}>{title}</h2>
        {children}
      </section>
      {separator ? (
        <div className="separator-container">
          <img src="/images/Separators/D1.png" alt="Separator 1" className="separator" />
        </div>
      ) : null}
    </>
  );
}

export default function SectionTalentTrees({ section = "holy" }: SectionTalentTreesProps) {
  if (section === "holy") {
    return (
      <>
        <BuildSection id="talent-tree-1" title="Holy + Herald of the Sun" separator>
          <HolyTalentTreeHerald />
        </BuildSection>
        <BuildSection id="talent-tree-2" title="Holy + Lightsmith">
          <HolyTalentTreeLightsmith />
        </BuildSection>
      </>
    );
  }

  if (section === "protection") {
    return (
      <>
        <BuildSection id="talent-tree-1" title="Protection + Lightsmith" separator>
          <ProtectionTreeLightsmith />
        </BuildSection>
        <BuildSection id="talent-tree-2" title="Protection + Templar">
          <ProtectionTreeTemplar />
        </BuildSection>
      </>
    );
  }

  return (
    <>
      <BuildSection id="talent-tree-1" title="Retribution + Herald of the Sun" separator>
        <RetributionTreeHerald />
      </BuildSection>
      <BuildSection id="talent-tree-2" title="Retribution + Templar">
        <RetributionTreeTemplar />
      </BuildSection>
    </>
  );
}
