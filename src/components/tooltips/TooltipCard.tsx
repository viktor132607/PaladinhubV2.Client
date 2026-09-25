import type { CSSProperties } from "react";
import styles from "./tooltips.module.css";
import { useLocalization } from "@/localization/LocalizationContext";
import { formatMessage } from "@/localization/catalog";

export type TooltipCardProps = {
  name?: string;
  description?: string;
  icon?: string;
  quality?: string;
  level?: string;
  detail?: string;
  requirement?: string;
  choices?: { name: string; icon?: string; description?: string }[];
  selectedChoice?: number;
  rank?: string;
  lockedPoints?: number;
};

const qualityColors: Record<string, string> = {
  poor: "#9d9d9d", common: "#fff", uncommon: "#1eff00",
  rare: "#0070dd", epic: "#a335ee", legendary: "#ff8000",
};

export default function TooltipCard({
  kind, name, description, icon, quality, level, detail, requirement, choices, selectedChoice, rank, lockedPoints,
}: TooltipCardProps & { kind: "item" | "spell" | "talent" }) {
  const { t } = useLocalization();
  const color = qualityColors[quality?.toLowerCase() ?? ""] ?? (kind === "item" ? "#a335ee" : "#ffd100");
  if (kind === "talent") return (
    <div className={styles.talentCard}>
      <strong className={styles.talentName}>{name || "Talent"}</strong>
      {rank && <span className={styles.talentRank}>{t("talent.rank.label", "Rank")} {rank}</span>}
      {(description || choices?.length) && <div className={styles.talentPassive}>{t("talent.passive", "Passive")}</div>}
      {description && <p className={styles.talentEffect}>{description}</p>}
      {choices?.length === 2 && <div className={styles.talentChoices}>
        {choices.map((choice, index) => (
          <div key={index} className={`${styles.talentChoice} ${selectedChoice === index ? styles.talentChoiceSelected : styles.talentChoiceInactive}`}>
            <strong>{choice.name}</strong>
            <span>{selectedChoice === index
              ? t("talent.choice.selected", "Selected") : t("talent.choice.inactive", "Inactive")}</span>
            {choice.description && <p>{choice.description}</p>}
          </div>
        ))}
      </div>}
      {requirement && <p className={styles.talentRequirement}>{requirement}</p>}
      {lockedPoints !== undefined && lockedPoints > 0 && <p className={styles.talentLock}>
        {formatMessage(t("talent.unlock.points", "Spend {points} more points to unlock this talent."), { points: lockedPoints })}
      </p>}
    </div>
  );
  return (
    <div className={styles.card} style={{ "--tooltip-quality": color } as CSSProperties}>
      <div className={styles.heading}>
        {icon && <img src={icon} alt="" className={styles.icon} />}
        <div>
          <strong className={styles.name}>{name || (kind === "item" ? "Item" : kind === "spell" ? "Spell" : "Talent")}</strong>
          {level && <span className={styles.level}>{kind === "item" ? `Item Level ${level}` : level}</span>}
        </div>
      </div>
      {detail && <div className={styles.detail}>{detail}</div>}
      {description && <p className={styles.description}>{description}</p>}
      {requirement && <p className={styles.requirement}>{requirement}</p>}
    </div>
  );
}
