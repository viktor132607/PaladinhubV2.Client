"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchBackend } from "@/config/api";
import { type Tree } from "@/features/dynamic-talents/model";
import PublishedTalentTrees, { validPublishedTrees } from "./PublishedTalentTrees";

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
  const [published, setPublished] = useState<Record<string, Tree[]>>({});
  useEffect(() => {
    const controller = new AbortController();
    setPublished({});
    void fetchBackend(`/api/talent-layouts/${section}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<Record<string, unknown>> : {})
      .then((layouts) => {
        if (controller.signal.aborted) return;
        setPublished(Object.fromEntries(Object.entries(layouts).filter((entry): entry is [string, Tree[]] => validPublishedTrees(entry[1]))));
      })
      .catch(() => { /* Keep the built-in guide when the API is unavailable. */ });
    return () => controller.abort();
  }, [section]);

  const show = (key: string, fallback: ReactNode) =>
    published[key] ? <PublishedTalentTrees layoutKey={key} trees={published[key]} /> : fallback;

  if (section === "holy") {
    return (
      <>
        <BuildSection id="talent-tree-1" title="Holy + Herald of the Sun" separator>
          {show("holy-herald", <HolyTalentTreeHerald />)}
        </BuildSection>
        <BuildSection id="talent-tree-2" title="Holy + Lightsmith">
          {show("holy-lightsmith", <HolyTalentTreeLightsmith />)}
        </BuildSection>
      </>
    );
  }

  if (section === "protection") {
    return (
      <>
        <BuildSection id="talent-tree-1" title="Protection + Lightsmith" separator>
          {show("protection-lightsmith", <ProtectionTreeLightsmith />)}
        </BuildSection>
        <BuildSection id="talent-tree-2" title="Protection + Templar">
          {show("protection-templar", <ProtectionTreeTemplar />)}
        </BuildSection>
      </>
    );
  }

  return (
    <>
      <BuildSection id="talent-tree-1" title="Retribution + Herald of the Sun" separator>
        {show("retribution-herald", <RetributionTreeHerald />)}
      </BuildSection>
      <BuildSection id="talent-tree-2" title="Retribution + Templar">
        {show("retribution-templar", <RetributionTreeTemplar />)}
      </BuildSection>
    </>
  );
}
