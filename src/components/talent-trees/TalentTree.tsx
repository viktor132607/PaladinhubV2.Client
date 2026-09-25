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
}: TalentTreeProps) {
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

  const ruleSet = useMemo(() => rulesForTree(treeKey), [treeKey]);
  const pointLimit = maxPoints === undefined ? ruleSet.max : maxPoints;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

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

  const isEdgeActive = useCallback(
    (edge: TalentEdge) => {
      const [fromColumn, fromRow, toColumn, toRow] = edge;
      const fromNode = nodeByPosition.get(positionKey(fromColumn, fromRow));
      const toNode = nodeByPosition.get(positionKey(toColumn, toRow));

      return Boolean(
        fromNode &&
          toNode &&
          selectedSet.has(fromNode.id) &&
          selectedSet.has(toNode.id),
      );
    },
    [nodeByPosition, selectedSet],
  );

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
              const gold = activeConnection || highlighted;
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

          {nodes.map((node) => {
            const isActive = selectedSet.has(node.id);
            const requirements = requirementsOf(node);
            const cost = costOf(node);
            const spell = talentSpells[node.name as keyof typeof talentSpells];
            const icon = spellIconSource(node.icon || spell?.icon || defaultIconPath(node.name));
            const description = node.description?.trim() || spell?.description || undefined;
            const url = node.url || spell?.url;
            const wowheadUrl = url && /^https:\/\/(?:www\.)?wowhead\.com\/spell=\d+(?:[/?#-]|$)/i.test(url) ? url : undefined;
            const attrs = {
              "data-id": node.id,
              className: `${styles.node} ${styles[node.shape ?? "circle"]} ${isActive ? styles.active : ""}
                ${flashNodeId === node.id ? styles.invalid : ""}
                ${readOnly && !wowheadUrl ? styles.informational : ""}`,
              style: nodeStyle(node),
              onMouseEnter: () => setHighlightedNodeId(node.id),
              onMouseLeave: () => setHighlightedNodeId(null),
              onFocus: () => setHighlightedNodeId(node.id),
              onBlur: () => setHighlightedNodeId(null),
              "aria-label": node.name,
              "data-tooltip-kind": readOnly && wowheadUrl ? undefined : "talent",
              "data-tooltip-name": node.name,
              "data-tooltip-description": description,
              "data-tooltip-icon": icon,
              "data-tooltip-detail": `Cost: ${cost} point${cost === 1 ? "" : "s"}`,
              "data-tooltip-requirement": requirements.length ? `Requires: ${requirements.join(", ")}` : undefined,
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
                <span className="sr-only">{node.name}</span>
              </>;
            return readOnly && wowheadUrl ? (
              <a key={node.id} {...attrs} href={wowheadUrl} target="_blank" rel="noopener noreferrer">{content}</a>
            ) : readOnly ? (
              <span key={node.id} {...attrs} tabIndex={0}>{content}</span>
            ) : (
              <button key={node.id} {...attrs} type="button" aria-pressed={isActive}
                onClick={() => toggleNode(node)} disabled={adminMode && !isEditing}>{content}</button>
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
