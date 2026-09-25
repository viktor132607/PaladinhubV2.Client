"use client";
import { spellIconSource } from "@/lib/spell-icons";
import talentSpells from "./talent-spells.json";


import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type CSSProperties,
} from "react";
import styles from "./TalentTree.module.css";
import { useLocalization } from "@/localization/LocalizationContext";
import { formatMessage } from "@/localization/catalog";
import { defaultTalentGates, evaluateTalentGates, lockedGateForRow, type TalentGate } from "./talentGates";

import {
  loadLocalTalentSelection,
  saveLocalTalentSelection,
  saveTalentState,
} from "@/features/talents/talentPersistence";
import { rulesForTree } from "@/features/talents/talentRules";

export type TalentNodeShape = "circle" | "square" | "hexagon";

export type TalentEdge = readonly [
  fromColumn: number,
  fromRow: number,
  toColumn: number,
  toRow: number,
];

export type TalentNode = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  url?: string;
  row?: number;
  column?: number;
  maxRank?: number;
  rank?: number;
  selectedChoice?: 0 | 1;
  alternative?: { name: string; icon?: string; description?: string; url?: string };
  cost?: number;
  requires?: string[];
  shape?: TalentNodeShape;
};

export type TalentTreeProps = {
  treeKey?: string;
  build?: string;
  nodes?: TalentNode[];
  selectedNodeIds?: string[];
  onChange?: (selected: string[]) => void;
  maxPoints?: number | null;
  adminMode?: boolean;
  autoSave?: boolean;
  readOnly?: boolean;
  columns?: number;
  edges?: TalentEdge[];
  gateRows?: TalentGate[];
};

type SaveStatus = "idle" | "saving" | "saved" | "local" | "error";

const CELL_WIDTH = 50;
const CELL_HEIGHT = 60;
const GRID_GAP = 20;
const STEP_X = CELL_WIDTH + GRID_GAP;
const STEP_Y = CELL_HEIGHT + GRID_GAP;
const NODE_SIZE = 50;
const ARROW_GAP = 28;

function defaultIconPath(name: string): string {
  const fileName = `${name.replace(/['’]/g, "")}.jpg`;
  return `/images/SpellIcons/${encodeURIComponent(fileName)}`;
}

function nodeStyle(node: TalentNode): CSSProperties {
  return {
    gridColumnStart: node.column ?? "auto",
    gridRowStart: node.row ?? "auto",
  };
}

export function edgeCoordinates(edge: TalentEdge) {
  const [fromColumn, fromRow, toColumn, toRow] = edge;
  const sourceX = (fromColumn - 1) * STEP_X + NODE_SIZE / 2;
  const sourceY = (fromRow - 1) * STEP_Y + CELL_HEIGHT / 2;
  const targetX = (toColumn - 1) * STEP_X + NODE_SIZE / 2;
  const targetY = (toRow - 1) * STEP_Y + CELL_HEIGHT / 2;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.hypot(dx, dy);
  if (distance <= ARROW_GAP * 2) return null;
  const unitX = dx / distance;
  const unitY = dy / distance;
  return {
    x1: sourceX + unitX * (NODE_SIZE / 2 + 2),
    y1: sourceY + unitY * (NODE_SIZE / 2 + 2),
    x2: targetX - unitX * ARROW_GAP,
    y2: targetY - unitY * ARROW_GAP,
  };
}

const positionKey = (column: number, row: number) => `${column}:${row}`;

export default function TalentTree({
  treeKey = "paladin",
  build = "",
  nodes = [],
  selectedNodeIds,
  onChange,
  maxPoints,
  adminMode = false,
  autoSave = true,
  readOnly = true,
  columns,
  edges = [],
  gateRows,
}: TalentTreeProps) {
  const { t } = useLocalization();
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedNodeIds ?? []);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const snapshotRef = useRef<string[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerId = useId().replace(/[^a-zA-Z0-9_-]/g, "_");

  useEffect(() => {
    if (!readOnly) return;
    const frame = requestAnimationFrame(() => {
      (window as Window & { $WowheadPower?: { refreshLinks?: () => void } })
        .$WowheadPower?.refreshLinks?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [readOnly, nodes, selectedNodeIds]);

  const ruleSet = useMemo(() => rulesForTree(treeKey), [treeKey]);
  const pointLimit = maxPoints === undefined ? ruleSet.max : maxPoints;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const displayedRank = useCallback((node: TalentNode) =>
    readOnly ? Math.min(Math.max(node.rank ?? (selectedSet.has(node.id) ? 1 : 0), 0), node.maxRank ?? 1)
      : selectedSet.has(node.id) ? 1 : 0,
  [readOnly, selectedSet]);

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const nodeByPosition = useMemo(() => {
    const map = new Map<string, TalentNode>();
    for (const node of nodes) {
      if (node.column != null && node.row != null) {
        map.set(positionKey(node.column, node.row), node);
      }
    }
    return map;
  }, [nodes]);

  const columnCount = useMemo(() => {
    if (columns && columns > 0) return columns;
    return Math.max(1, ...nodes.map((node) => node.column ?? 1));
  }, [columns, nodes]);

  const rowCount = useMemo(
    () => Math.max(1, ...nodes.map((node) => node.row ?? 1)),
    [nodes],
  );

  const gridStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: `repeat(${columnCount}, ${CELL_WIDTH}px)`,
      gridTemplateRows: `repeat(${rowCount}, ${CELL_HEIGHT}px)`,
    }),
    [columnCount, rowCount],
  );
  const gridWidth = columnCount * CELL_WIDTH + (columnCount - 1) * GRID_GAP;
  const gridHeight = rowCount * CELL_HEIGHT + (rowCount - 1) * GRID_GAP;

  const costOf = useCallback(
    (node: TalentNode): number => {
      const ruleCost = ruleSet.nodes[node.name]?.cost;
      return node.cost ?? (Number.isFinite(ruleCost) ? ruleCost! : 1);
    },
    [ruleSet.nodes],
  );

  const activeGates = useMemo(() => gateRows ?? defaultTalentGates(build, rowCount), [gateRows, build, rowCount]);
  const gateStatuses = useMemo(() => evaluateTalentGates(nodes, activeGates, displayedRank, costOf),
    [nodes, activeGates, displayedRank, costOf]);
  const lockedFor = useCallback((node: TalentNode) => lockedGateForRow(gateStatuses, node.row ?? 1),
    [gateStatuses]);
  const effectiveRank = useCallback((node: TalentNode) => lockedFor(node) ? 0 : displayedRank(node),
    [lockedFor, displayedRank]);

  const isEdgeActive = useCallback((edge: TalentEdge) => {
    const fromNode = nodeByPosition.get(positionKey(edge[0], edge[1]));
    const toNode = nodeByPosition.get(positionKey(edge[2], edge[3]));
    return Boolean(fromNode && toNode && effectiveRank(fromNode) > 0 && effectiveRank(toNode) > 0);
  }, [nodeByPosition, effectiveRank]);

  const requirementsOf = useCallback(
    (node: TalentNode): string[] =>
      node.requires ?? ruleSet.nodes[node.name]?.requires ?? [],
    [ruleSet.nodes],
  );

  const totalPoints = useMemo(
    () =>
      selectedIds.reduce((total, id) => {
        const node = nodeById.get(id);
        return node ? total + costOf(node) : total;
      }, 0),
    [costOf, nodeById, selectedIds],
  );

  const persist = useCallback(
    async (nextSelectedIds: string[]) => {
      saveLocalTalentSelection(treeKey, nextSelectedIds);

      if (nodes.length === 0) {
        setSaveStatus("local");
        return;
      }

      setSaveStatus("saving");
      const active = new Set(nextSelectedIds);
      const saved = await saveTalentState(
        treeKey,
        nodes.map((node) => ({ id: node.id, active: active.has(node.id) })),
      );
      setSaveStatus(saved ? "saved" : "local");
    },
    [nodes, treeKey],
  );

  useEffect(() => {
    setSelectedIds(selectedNodeIds ?? (readOnly ? [] : loadLocalTalentSelection(treeKey)));
    setIsHydrated(true);
    setSaveStatus("idle");
  }, [readOnly, selectedNodeIds, treeKey]);

  useEffect(() => {
    if (!isHydrated || readOnly || adminMode || !autoSave) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void persist(selectedIds), 250);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [adminMode, autoSave, isHydrated, persist, readOnly, selectedIds]);

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    [],
  );

  const updateSelection = (next: string[]) => {
    setSelectedIds(next);
    onChange?.(next);
  };

  const flash = (nodeId: string, message: string) => {
    setFlashNodeId(nodeId);
    setValidationMessage(message);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashNodeId(null), 300);
  };

  const removeWithDependents = (node: TalentNode): string[] => {
    const activeNames = new Set(
      selectedIds
        .map((id) => nodeById.get(id)?.name)
        .filter((name): name is string => Boolean(name)),
    );
    const namesToRemove = new Set<string>([node.name]);
    const queue = [node.name];

    while (queue.length > 0) {
      const removedName = queue.shift()!;
      nodes.forEach((candidate) => {
        if (
          activeNames.has(candidate.name) &&
          requirementsOf(candidate).includes(removedName) &&
          !namesToRemove.has(candidate.name)
        ) {
          namesToRemove.add(candidate.name);
          queue.push(candidate.name);
        }
      });
    }

    return selectedIds.filter((id) => {
      const selectedNode = nodeById.get(id);
      return selectedNode ? !namesToRemove.has(selectedNode.name) : false;
    });
  };

  const toggleNode = (node: TalentNode) => {
    if (readOnly || (adminMode && !isEditing)) return;
    setValidationMessage(null);

    const locked = lockedFor(node);
    if (locked) {
      flash(node.id, formatMessage(t("talent.unlock.points", "Spend {points} more points to unlock this talent."), { points: locked.missing }));
      return;
    }

    if (selectedSet.has(node.id)) {
      updateSelection(removeWithDependents(node));
      return;
    }

    const selectedNames = new Set(
      selectedIds
        .map((id) => nodeById.get(id)?.name)
        .filter((name): name is string => Boolean(name)),
    );
    const missingRequirements = requirementsOf(node).filter(
      (requiredName) => !selectedNames.has(requiredName),
    );

    if (missingRequirements.length > 0) {
      flash(node.id, `Requires: ${missingRequirements.join(", ")}`);
      return;
    }

    if (pointLimit !== null && totalPoints + costOf(node) > pointLimit) {
      flash(node.id, `This tree is limited to ${pointLimit} points.`);
      return;
    }

    updateSelection([...selectedIds, node.id]);
  };

  const beginEditing = () => {
    snapshotRef.current = [...selectedIds];
    setIsEditing(true);
    setSaveStatus("idle");
  };

  const cancelEditing = () => {
    updateSelection(snapshotRef.current);
    setIsEditing(false);
    setValidationMessage(null);
    setSaveStatus("idle");
  };

  const saveEditing = async () => {
    await persist(selectedIds);
    setIsEditing(false);
  };

  return (
    <section className="w-full text-white" data-tree-key={treeKey} data-build={build}>
      {!readOnly && <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-[#aaa]">
          {totalPoints}{pointLimit !== null ? ` / ${pointLimit}` : ""} points
        </span>

        {adminMode ? (
          <div className="flex gap-2" data-tree-key={treeKey}>
            {!isEditing ? (
              <button
                type="button"
                className="rounded border border-[#777] px-3 py-1 text-sm text-white"
                onClick={beginEditing}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded bg-[#FFD700] px-3 py-1 text-sm font-semibold text-black"
                  onClick={() => void saveEditing()}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded border border-[#777] px-3 py-1 text-sm text-white"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>}

      {validationMessage ? (
        <p className="mb-3 text-sm text-[#FFD700]" role="status">
          {validationMessage}
        </p>
      ) : null}

      {!readOnly && saveStatus !== "idle" ? (
        <p className="mb-3 text-xs text-[#aaa]" aria-live="polite">
          {saveStatus === "saving"
            ? "Saving talent selection..."
            : saveStatus === "saved"
              ? "Talent selection saved."
              : saveStatus === "local"
                ? "Saved locally; backend save was unavailable."
                : "Could not save talent selection."}
        </p>
      ) : null}

      {nodes.length > 0 ? (
        <div
          className="relative mx-auto grid w-fit auto-rows-[60px] gap-5"
          style={gridStyle}
          data-tree-key={treeKey}
          data-edit-mode={readOnly ? "readonly" : isEditing ? "1" : "0"}
        >
          <svg className="pointer-events-none absolute inset-0 z-[1] overflow-visible" width={gridWidth} height={gridHeight} aria-hidden="true">
            <defs>
              <marker id={`${markerId}-muted`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 7 4 L 0 8 Z" fill="#666" />
              </marker>
              <marker id={`${markerId}-gold`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 7 4 L 0 8 Z" fill="#d5aa31" />
              </marker>
            </defs>
            {edges.map((edge, index) => {
              const coordinates = edgeCoordinates(edge);
              if (!coordinates) return null;
              const fromNode = nodeByPosition.get(positionKey(edge[0], edge[1]));
              const toNode = nodeByPosition.get(positionKey(edge[2], edge[3]));
              const activeConnection = isEdgeActive(edge);
              const highlighted = highlightedNodeId !== null &&
                (fromNode?.id === highlightedNodeId || toNode?.id === highlightedNodeId);
              const gold = activeConnection || (highlighted && Boolean(fromNode && toNode &&
                effectiveRank(fromNode) > 0 && effectiveRank(toNode) > 0));
              return (
                <line key={`${edge.join("-")}-${index}`} {...coordinates}
                  data-active-connection={activeConnection ? "1" : "0"}
                  stroke={gold ? "#d5aa31" : "#666"}
                  strokeWidth={gold ? 2.25 : 1.5}
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId}-${gold ? "gold" : "muted"})`}
                />
              );
            })}
          </svg>

          {gateStatuses.filter((gate) => gate.row <= rowCount && gate.missing > 0).map((gate) => (
            <div key={gate.row} className={styles.gate}
              style={{ top: `${(gate.row - 1) * STEP_Y - GRID_GAP / 2}px` }}
              data-gate-row={gate.row} data-gate-required={gate.points} data-gate-spent={gate.spent}
              aria-label={formatMessage(t("talent.gate.aria", "Row {row} requires {points} points above"), gate)}>
              <span className={styles.gatePoints}>{gate.points}</span><span className={styles.gateLock} aria-hidden="true" />
              <span className={styles.gateLine} />
            </div>
          ))}

          {nodes.map((node) => {
            const locked = lockedFor(node);
            const rank = effectiveRank(node);
            const maxRank = node.maxRank ?? 1;
            const isActive = rank > 0;
            const requirements = requirementsOf(node);
            const cost = costOf(node);
            const spell = talentSpells[node.name as keyof typeof talentSpells];
            const primaryIcon = spellIconSource(node.icon || spell?.icon || defaultIconPath(node.name));
            const primaryDescription = node.description?.trim() || spell?.description || undefined;
            const alternative = node.alternative?.name.trim() ? node.alternative : undefined;
            const alternativeSpell = alternative && talentSpells[alternative.name as keyof typeof talentSpells];
            const alternativeIcon = alternative
              ? spellIconSource(alternative.icon || alternativeSpell?.icon || primaryIcon) : undefined;
            const selectedChoice = isActive ? node.selectedChoice ?? 0 : -1;
            const name = selectedChoice === 1 && alternative ? alternative.name : node.name;
            const icon = selectedChoice === 1 && alternativeIcon ? alternativeIcon : primaryIcon;
            const description = selectedChoice === 1 && alternative
              ? alternative.description?.trim() || alternativeSpell?.description || undefined
              : primaryDescription;
            const url = selectedChoice === 1 && alternative ? alternative.url || alternativeSpell?.url
              : node.url || spell?.url;
            const isWowheadSpell = (value?: string) => Boolean(value && /^https:\/\/(?:www\.)?wowhead\.com\/spell=\d+(?:[/?#-]|$)/i.test(value));
            const wowheadUrl = isWowheadSpell(url) ? url : undefined;
            const primaryChoiceUrl = node.url || spell?.url;
            const alternativeChoiceUrl = alternative?.url || alternativeSpell?.url;
            const choices = alternative ? JSON.stringify([
              { name: node.name, icon: primaryIcon, description: primaryDescription },
              { name: alternative.name, icon: alternativeIcon, description: alternative.description?.trim() || alternativeSpell?.description || undefined },
            ]) : undefined;
            const attrs = {
              "data-id": node.id,
              className: `${styles.node} ${styles[node.shape ?? "circle"]} ${isActive ? styles.active : styles.inactive}
                ${locked ? styles.locked : ""}
                ${flashNodeId === node.id ? styles.invalid : ""}
                ${readOnly && !wowheadUrl ? styles.informational : ""}`,
              onMouseEnter: () => setHighlightedNodeId(node.id),
              onMouseLeave: () => setHighlightedNodeId(null),
              onFocus: () => setHighlightedNodeId(node.id),
              onBlur: () => setHighlightedNodeId(null),
              "aria-label": `${name}, ${formatMessage(t("talent.rank.aria", "{rank} of {maxRank} ranks"), { rank, maxRank })}${alternative ? `, ${selectedChoice < 0
                ? t("talent.choice.none", "no choice selected")
                : formatMessage(t("talent.choice.aria", "choice {choice} of 2"), { choice: selectedChoice + 1 })}` : ""}`,
              "data-tooltip-kind": readOnly && wowheadUrl ? undefined : "talent",
              "data-tooltip-name": name,
              "data-tooltip-description": alternative ? undefined : description,
              "data-tooltip-icon": icon,
              "data-tooltip-choices": choices,
              "data-tooltip-selected-choice": alternative ? selectedChoice : undefined,
              "data-tooltip-rank": `${rank}/${maxRank}`,
              "data-tooltip-locked-points": locked?.missing,
              "data-tooltip-detail": `${t("talent.rank.label", "Rank")}: ${rank}/${maxRank} · ${formatMessage(t("talent.cost", "Cost: {cost} {unit}"), {
                cost, unit: cost === 1 ? t("talent.point", "point") : t("talent.points", "points"),
              })}`,
              "data-tooltip-requirement": requirements.length ? `${t("talent.requires", "Requires")}: ${requirements.join(", ")}` : undefined,
            } as const;
            const content = <>
                <img
                  src={icon}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/images/itemIcons/talents.jpg";
                  }}
                />
                <span className="sr-only">{name}</span>
              </>;
            return (
              <div key={node.id} className={styles.slot} style={nodeStyle(node)}>
                {alternative && <span className={styles.choiceArrows}>
                  {readOnly && isWowheadSpell(primaryChoiceUrl) ?
                    <a href={primaryChoiceUrl} target="_blank" rel="noopener noreferrer"
                      className={selectedChoice === 0 ? styles.choiceArrowActive : ""}
                      aria-label={node.name}>◀</a> :
                    <span className={selectedChoice === 0 ? styles.choiceArrowActive : ""}>◀</span>}
                  {readOnly && isWowheadSpell(alternativeChoiceUrl) ?
                    <a href={alternativeChoiceUrl} target="_blank" rel="noopener noreferrer"
                      className={selectedChoice === 1 ? styles.choiceArrowActive : ""}
                      aria-label={alternative.name}>▶</a> :
                    <span className={selectedChoice === 1 ? styles.choiceArrowActive : ""}
                      data-tooltip-kind={readOnly ? "talent" : undefined}
                      data-tooltip-name={alternative.name}
                      data-tooltip-description={alternative.description || alternativeSpell?.description}>▶</span>}
                </span>}
                {readOnly && wowheadUrl ? (
                  <a {...attrs} href={wowheadUrl} target="_blank" rel="noopener noreferrer">{content}</a>
                ) : readOnly ? (
                  <span {...attrs} tabIndex={0}>{content}</span>
                ) : (
                  <button {...attrs} type="button" aria-pressed={isActive}
                    onClick={() => toggleNode(node)} disabled={adminMode && !isEditing}>{content}</button>
                )}
                <span className={`${styles.rank} ${isActive ? styles.rankActive : ""}`}
                  aria-hidden="true">{rank}/{maxRank}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#aaa]">
          Talent nodes will be loaded from the backend for this tree.
        </p>
      )}
    </section>
  );
}
