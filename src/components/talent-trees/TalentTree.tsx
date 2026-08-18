"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  loadLocalTalentSelection,
  saveLocalTalentSelection,
  saveTalentState,
} from "@/features/talents/talentPersistence";

import { rulesForTree } from "@/features/talents/talentRules";

export type TalentNodeShape =
  | "circle"
  | "square"
  | "hexagon";

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
  onChange?: (
    selected: string[],
  ) => void;
  maxPoints?: number | null;
  adminMode?: boolean;
  autoSave?: boolean;
  columns?: number;
  edges?: TalentEdge[];
};

type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "local"
  | "error";

const CELL_WIDTH = 50;
const CELL_HEIGHT = 60;
const GRID_GAP = 20;

const STEP_X =
  CELL_WIDTH + GRID_GAP;

const STEP_Y =
  CELL_HEIGHT + GRID_GAP;

const LINE_OFFSET_X = -8;
const LINE_OFFSET_Y = -8;

const HEXAGON_CLIP =
  "polygon(0% 25%, 0% 75%, 25% 100%, 75% 100%, 100% 75%, 100% 25%, 75% 0%, 25% 0%)";

function defaultIconPath(
  name: string,
): string {
  const fileName =
    `${name.replace(
      /['’]/g,
      "",
    )}.jpg`;

  return `/images/SpellIcons/${encodeURIComponent(
    fileName,
  )}`;
}

function nodeShapeClass(
  shape:
    | TalentNodeShape
    | undefined,
): string {
  if (
    shape === "square" ||
    shape === "hexagon"
  ) {
    return "rounded-none";
  }

  return "rounded-full";
}

function nodeStyle(
  node: TalentNode,
): CSSProperties {
  const style: CSSProperties = {
    gridColumnStart:
      node.column ?? "auto",

    gridRowStart:
      node.row ?? "auto",
  };

  if (
    node.shape ===
    "hexagon"
  ) {
    style.clipPath =
      HEXAGON_CLIP;
  }

  return style;
}

/*
 * EXACTLY follows the original
 * SpellsAndItemsView.LineStyle().
 *
 * Original:
 *
 * stepX = 50 + 20 = 70
 * stepY = 60 + 20 = 80
 *
 * x =
 *   (col - 1) * stepX
 *   + stepX / 2
 *   - 8
 *
 * y =
 *   (row - 1) * stepY
 *   + stepY / 2
 *   - 8
 */
function edgeStyle(
  edge: TalentEdge,
): CSSProperties {
  const [
    fromColumn,
    fromRow,
    toColumn,
    toRow,
  ] = edge;

  const x =
    (fromColumn - 1) *
      STEP_X +
    STEP_X / 2 +
    LINE_OFFSET_X;

  const y =
    (fromRow - 1) *
      STEP_Y +
    STEP_Y / 2 +
    LINE_OFFSET_Y;

  const dx =
    (toColumn -
      fromColumn) *
    STEP_X;

  const dy =
    (toRow -
      fromRow) *
    STEP_Y;

  const length =
    Math.sqrt(
      dx * dx +
        dy * dy,
    );

  const angle =
    Math.atan2(
      dy,
      dx,
    ) *
    (180 / Math.PI);

  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${length}px`,
    transform:
      `rotate(${angle}deg)`,
  };
}

export default function TalentTree({
  treeKey = "paladin",
  build = "",
  nodes = [],
  selectedNodeIds,
  onChange,
  maxPoints,
  adminMode = false,
  autoSave = true,
  columns,
  edges = [],
}: TalentTreeProps) {
  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>(
    selectedNodeIds ?? [],
  );

  const [
    isHydrated,
    setIsHydrated,
  ] = useState(false);

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    flashNodeId,
    setFlashNodeId,
  ] = useState<
    string | null
  >(null);

  const [
    validationMessage,
    setValidationMessage,
  ] = useState<
    string | null
  >(null);

  const [
    saveStatus,
    setSaveStatus,
  ] =
    useState<SaveStatus>(
      "idle",
    );

  const snapshotRef =
    useRef<string[]>([]);

  const saveTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const flashTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const ruleSet =
    useMemo(
      () =>
        rulesForTree(
          treeKey,
        ),
      [treeKey],
    );

  const pointLimit =
    maxPoints ===
    undefined
      ? ruleSet.max
      : maxPoints;

  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedIds,
        ),
      [selectedIds],
    );

  const nodeById =
    useMemo(
      () =>
        new Map(
          nodes.map(
            (node) => [
              node.id,
              node,
            ],
          ),
        ),
      [nodes],
    );

  const columnCount =
    useMemo(() => {
      if (
        columns &&
        columns > 0
      ) {
        return columns;
      }

      return Math.max(
        1,
        ...nodes.map(
          (node) =>
            node.column ??
            1,
        ),
      );
    }, [
      columns,
      nodes,
    ]);

  const rowCount =
    useMemo(
      () =>
        Math.max(
          1,
          ...nodes.map(
            (node) =>
              node.row ??
              1,
          ),
        ),
      [nodes],
    );

  /*
   * IMPORTANT:
   *
   * The grid itself must be exactly
   * the width of its tracks.
   *
   * If this div is width:100% and
   * justify-content:center is used,
   * the nodes move but the absolute
   * line coordinates remain measured
   * from the full-width div.
   *
   * That was the reason for the
   * displaced lines.
   */
  const gridStyle =
    useMemo<CSSProperties>(
      () => ({
        gridTemplateColumns:
          `repeat(${columnCount}, ${CELL_WIDTH}px)`,

        gridTemplateRows:
          `repeat(${rowCount}, ${CELL_HEIGHT}px)`,
      }),
      [
        columnCount,
        rowCount,
      ],
    );

  const costOf =
    useCallback(
      (
        node: TalentNode,
      ): number => {
        const ruleCost =
          ruleSet.nodes[
            node.name
          ]?.cost;

        return (
          node.cost ??
          (Number.isFinite(
            ruleCost,
          )
            ? ruleCost!
            : 1)
        );
      },
      [
        ruleSet.nodes,
      ],
    );

  const requirementsOf =
    useCallback(
      (
        node: TalentNode,
      ): string[] =>
        node.requires ??
        ruleSet.nodes[
          node.name
        ]?.requires ??
        [],
      [
        ruleSet.nodes,
      ],
    );

  const totalPoints =
    useMemo(
      () =>
        selectedIds.reduce(
          (
            total,
            id,
          ) => {
            const node =
              nodeById.get(
                id,
              );

            return node
              ? total +
                  costOf(
                    node,
                  )
              : total;
          },
          0,
        ),
      [
        costOf,
        nodeById,
        selectedIds,
      ],
    );

  const persist =
    useCallback(
      async (
        nextSelectedIds:
          string[],
      ) => {
        saveLocalTalentSelection(
          treeKey,
          nextSelectedIds,
        );

        if (
          nodes.length === 0
        ) {
          setSaveStatus(
            "local",
          );

          return;
        }

        setSaveStatus(
          "saving",
        );

        const active =
          new Set(
            nextSelectedIds,
          );

        const saved =
          await saveTalentState(
            treeKey,

            nodes.map(
              (node) => ({
                id: node.id,

                active:
                  active.has(
                    node.id,
                  ),
              }),
            ),
          );

        setSaveStatus(
          saved
            ? "saved"
            : "local",
        );
      },
      [
        nodes,
        treeKey,
      ],
    );

  useEffect(() => {
    const initialSelection =
      selectedNodeIds ??
      loadLocalTalentSelection(
        treeKey,
      );

    setSelectedIds(
      initialSelection,
    );

    setIsHydrated(
      true,
    );

    setSaveStatus(
      "idle",
    );
  }, [
    selectedNodeIds,
    treeKey,
  ]);

  useEffect(() => {
    if (
      !isHydrated ||
      adminMode ||
      !autoSave
    ) {
      return;
    }

    if (
      saveTimerRef.current
    ) {
      clearTimeout(
        saveTimerRef.current,
      );
    }

    saveTimerRef.current =
      setTimeout(() => {
        void persist(
          selectedIds,
        );
      }, 250);

    return () => {
      if (
        saveTimerRef.current
      ) {
        clearTimeout(
          saveTimerRef.current,
        );
      }
    };
  }, [
    adminMode,
    autoSave,
    isHydrated,
    persist,
    selectedIds,
  ]);

  useEffect(
    () => () => {
      if (
        flashTimerRef.current
      ) {
        clearTimeout(
          flashTimerRef.current,
        );
      }
    },
    [],
  );

  const updateSelection = (
    next: string[],
  ) => {
    setSelectedIds(
      next,
    );

    onChange?.(
      next,
    );
  };

  const flash = (
    nodeId: string,
    message: string,
  ) => {
    setFlashNodeId(
      nodeId,
    );

    setValidationMessage(
      message,
    );

    if (
      flashTimerRef.current
    ) {
      clearTimeout(
        flashTimerRef.current,
      );
    }

    flashTimerRef.current =
      setTimeout(() => {
        setFlashNodeId(
          null,
        );
      }, 300);
  };

  const removeWithDependents = (
    node: TalentNode,
  ): string[] => {
    const activeNames =
      new Set(
        selectedIds
          .map(
            (id) =>
              nodeById.get(
                id,
              )?.name,
          )
          .filter(
            (
              name,
            ): name is string =>
              Boolean(
                name,
              ),
          ),
      );

    const namesToRemove =
      new Set<string>([
        node.name,
      ]);

    const queue = [
      node.name,
    ];

    while (
      queue.length > 0
    ) {
      const removedName =
        queue.shift()!;

      nodes.forEach(
        (candidate) => {
          if (
            activeNames.has(
              candidate.name,
            ) &&
            requirementsOf(
              candidate,
            ).includes(
              removedName,
            ) &&
            !namesToRemove.has(
              candidate.name,
            )
          ) {
            namesToRemove.add(
              candidate.name,
            );

            queue.push(
              candidate.name,
            );
          }
        },
      );
    }

    return selectedIds.filter(
      (id) => {
        const selectedNode =
          nodeById.get(
            id,
          );

        return selectedNode
          ? !namesToRemove.has(
              selectedNode.name,
            )
          : false;
      },
    );
  };

  const toggleNode = (
    node: TalentNode,
  ) => {
    if (
      adminMode &&
      !isEditing
    ) {
      return;
    }

    setValidationMessage(
      null,
    );

    if (
      selectedSet.has(
        node.id,
      )
    ) {
      updateSelection(
        removeWithDependents(
          node,
        ),
      );

      return;
    }

    const selectedNames =
      new Set(
        selectedIds
          .map(
            (id) =>
              nodeById.get(
                id,
              )?.name,
          )
          .filter(
            (
              name,
            ): name is string =>
              Boolean(
                name,
              ),
          ),
      );

    const missingRequirements =
      requirementsOf(
        node,
      ).filter(
        (
          requiredName,
        ) =>
          !selectedNames.has(
            requiredName,
          ),
      );

    if (
      missingRequirements.length >
      0
    ) {
      flash(
        node.id,

        `Requires: ${missingRequirements.join(
          ", ",
        )}`,
      );

      return;
    }

    const nextPointTotal =
      totalPoints +
      costOf(node);

    if (
      pointLimit !==
        null &&
      nextPointTotal >
        pointLimit
    ) {
      flash(
        node.id,

        `This tree is limited to ${pointLimit} points.`,
      );

      return;
    }

    updateSelection([
      ...selectedIds,
      node.id,
    ]);
  };

  const beginEditing =
    () => {
      snapshotRef.current =
        [
          ...selectedIds,
        ];

      setIsEditing(
        true,
      );

      setSaveStatus(
        "idle",
      );
    };

  const cancelEditing =
    () => {
      updateSelection(
        snapshotRef.current,
      );

      setIsEditing(
        false,
      );

      setValidationMessage(
        null,
      );

      setSaveStatus(
        "idle",
      );
    };

  const saveEditing =
    async () => {
      await persist(
        selectedIds,
      );

      setIsEditing(
        false,
      );
    };

  return (
    <section
      className="w-full text-white"
      data-tree-key={
        treeKey
      }
      data-build={
        build
      }
    >
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-[#aaa]">
          {totalPoints}

          {pointLimit !==
          null
            ? ` / ${pointLimit}`
            : ""}{" "}
          points
        </span>

        {adminMode ? (
          <div
            className="flex gap-2"
            data-tree-key={
              treeKey
            }
          >
            {!isEditing ? (
              <button
                type="button"
                className="rounded border border-[#777] px-3 py-1 text-sm text-white"
                onClick={
                  beginEditing
                }
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded bg-[#FFD700] px-3 py-1 text-sm font-semibold text-black"
                  onClick={() =>
                    void saveEditing()
                  }
                >
                  Save
                </button>

                <button
                  type="button"
                  className="rounded border border-[#777] px-3 py-1 text-sm text-white"
                  onClick={
                    cancelEditing
                  }
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {validationMessage ? (
        <p
          className="mb-3 text-sm text-[#FFD700]"
          role="status"
        >
          {
            validationMessage
          }
        </p>
      ) : null}

      {saveStatus !==
      "idle" ? (
        <p
          className="mb-3 text-xs text-[#aaa]"
          aria-live="polite"
        >
          {saveStatus ===
          "saving"
            ? "Saving talent selection..."
            : saveStatus ===
                "saved"
              ? "Talent selection saved."
              : saveStatus ===
                  "local"
                ? "Saved locally; backend save was unavailable."
                : "Could not save talent selection."}
        </p>
      ) : null}

      {nodes.length >
      0 ? (
        <div
          className="
            relative
            mx-auto
            grid
            w-fit
            auto-rows-[60px]
            gap-5
          "
          style={
            gridStyle
          }
          data-tree-key={
            treeKey
          }
          data-edit-mode={
            isEditing
              ? "1"
              : "0"
          }
        >
          {edges.map(
            (
              edge,
              index,
            ) => (
              <span
                key={`${edge.join(
                  "-",
                )}-${index}`}
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  z-[1]
                  h-px
                  origin-left
                  rounded
                  bg-[#ffff00]
                "
                style={edgeStyle(
                  edge,
                )}
              />
            ),
          )}

          {nodes.map(
            (node) => {
              const isActive =
                selectedSet.has(
                  node.id,
                );

              const requirements =
                requirementsOf(
                  node,
                );

              const cost =
                costOf(
                  node,
                );

              const title = [
                node.name,

                node.description,

                requirements.length >
                0
                  ? `Requires: ${requirements.join(
                      ", ",
                    )}`
                  : null,

                `Cost: ${cost} point${
                  cost === 1
                    ? ""
                    : "s"
                }`,
              ]
                .filter(
                  Boolean,
                )
                .join(
                  "\n",
                );

              return (
                <button
                  key={
                    node.id
                  }
                  type="button"
                  data-id={
                    node.id
                  }
                  onClick={() =>
                    toggleNode(
                      node,
                    )
                  }
                  disabled={
                    adminMode &&
                    !isEditing
                  }
                  className={`
                    relative
                    z-[2]
                    flex
                    h-[50px]
                    w-[50px]
                    items-center
                    justify-center
                    self-center
                    justify-self-center
                    overflow-hidden
                    border-2
                    bg-[#111]
                    p-0
                    transition-all
                    duration-200

                    ${nodeShapeClass(
                      node.shape,
                    )}

                    ${
                      isActive
                        ? "border-white shadow-[0_0_15px_5px_#FFD700]"
                        : "border-[#FFD700] hover:scale-105 hover:shadow-[0_0_15px_5px_#FFD700]"
                    }

                    ${
                      flashNodeId ===
                      node.id
                        ? "animate-pulse border-red-500"
                        : ""
                    }

                    ${
                      adminMode &&
                      !isEditing
                        ? "cursor-default"
                        : "cursor-pointer"
                    }
                  `}
                  style={nodeStyle(
                    node,
                  )}
                  title={
                    title
                  }
                  aria-pressed={
                    isActive
                  }
                  aria-label={
                    node.name
                  }
                >
                  <img
                    src={
                      node.icon ??
                      defaultIconPath(
                        node.name,
                      )
                    }
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    onError={(
                      event,
                    ) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        "/images/itemIcons/talents.jpg";
                    }}
                  />

                  <span className="sr-only">
                    {
                      node.name
                    }
                  </span>
                </button>
              );
            },
          )}
        </div>
      ) : (
        <p className="text-sm text-[#aaa]">
          Talent nodes will be loaded from the backend for this tree.
        </p>
      )}
    </section>
  );
}