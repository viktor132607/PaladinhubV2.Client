import type { CSSProperties } from "react";
import styles from "./tooltips.module.css";

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
};

const qualityColors: Record<string, string> = {
  poor: "#9d9d9d", common: "#fff", uncommon: "#1eff00",
  rare: "#0070dd", epic: "#a335ee", legendary: "#ff8000",
};

export default function TooltipCard({
  kind, name, description, icon, quality, level, detail, requirement, choices, selectedChoice,
}: TooltipCardProps & { kind: "item" | "spell" | "talent" }) {
  const color = qualityColors[quality?.toLowerCase() ?? ""] ?? (kind === "item" ? "#a335ee" : "#ffd100");
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
      {choices?.length === 2 && <div className={styles.choices}>
        {choices.map((choice, index) => (
          <div key={index} className={`${styles.choice} ${selectedChoice === index ? styles.choiceSelected : styles.choiceInactive}`}>
            {choice.icon && <img src={choice.icon} alt="" className={styles.choiceIcon} />}
            <div>
              <strong>{choice.name}</strong>
              <span className={styles.choiceStatus}>{selectedChoice === index ? "Избран" : "Неактивен"}</span>
              {choice.description && <p>{choice.description}</p>}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
