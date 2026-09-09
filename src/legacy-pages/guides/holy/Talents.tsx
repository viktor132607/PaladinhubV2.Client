"use client";

import { GuidePageHeader } from "@/components/migration/MigratedView";
import SectionTalentTrees from "@/components/talent-trees/SectionTalentTrees";

export default function Talents() {
  return (
    <>
      <GuidePageHeader />
      <div className="outer-wrapper">
        <div className="page-container">
          <div className="main-wrapper">
            <SectionTalentTrees section="holy" />
          </div>
        </div>
      </div>
    </>
  );
}
