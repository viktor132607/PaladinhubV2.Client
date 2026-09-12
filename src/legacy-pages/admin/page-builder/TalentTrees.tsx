"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import TreeEditor from "@/components/dynamic-talents/TreeEditor";
import HolyTalentTreeHerald from "@/components/talent-trees/HolyTalentTreeHerald";
import HolyTalentTreeLightsmith from "@/components/talent-trees/HolyTalentTreeLightsmith";
import ProtectionTreeLightsmith from "@/components/talent-trees/ProtectionTreeLightsmith";
import ProtectionTreeTemplar from "@/components/talent-trees/ProtectionTreeTemplar";
import RetributionTreeHerald from "@/components/talent-trees/RetributionTreeHerald";
import RetributionTreeTemplar from "@/components/talent-trees/RetributionTreeTemplar";
import RuntimeTalentTree, {
  type TalentEdge,
  type TalentNode,
} from "@/components/talent-trees/TalentTree";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import {
  createTree,
  validateTree,
  type Tree,
} from "@/features/dynamic-talents/model";

type Spec = "Holy" | "Protection" | "Retribution";

type PresetSummary = {
  id: number;
  name: string;
  entity: string;
  section?: string | null;
  updatedAt?: string;
};

type Preset = PresetSummary & {
  jsonQuery: string;
};

type StoredTalentLayout = {
  version: 1;
  spec: Spec;
  trees: Tree[];
};

type StaticColumn = {
  title: string;
  treeKey: string;
  nodes: TalentNode[];
  maxPoints: number;
  columns: number;
  edges: TalentEdge[];
};

type StaticLayoutDefinition = {
  key: string;
  name: string;
  spec: Spec;
  component: () => ReactNode;
};

type StaticLayout = StaticLayoutDefinition & {
  trees: Tree[];
};

type StaticTreeEntry = {
  key: string;
  spec: Spec;
  sourceLayout: string;
  tree: Tree;
};

const ENTITY = "talent-layout";
const SPECS: Spec[] = ["Holy", "Protection", "Retribution"];
const EMPTY_SELECTION: string[] = [];
const button =
  "rounded bg-amber-500 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButton =
  "rounded bg-slate-700 px-4 py-2 text-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
const input =
  "w-full rounded border border-slate-600 bg-[#1f2327] px-3 py-2 text-slate-100";

const STATIC_LAYOUT_DEFINITIONS: StaticLayoutDefinition[] = [
  {
    key: "holy-herald",
    name: "Holy + Herald of the Sun",
    spec: "Holy",
    component: HolyTalentTreeHerald,
  },
  {
    key: "holy-lightsmith",
    name: "Holy + Lightsmith",
    spec: "Holy",
    component: HolyTalentTreeLightsmith,
  },
  {
    key: "protection-lightsmith",
    name: "Protection + Lightsmith",
    spec: "Protection",
    component: ProtectionTreeLightsmith,
  },
  {
    key: "protection-templar",
    name: "Protection + Templar",
    spec: "Protection",
    component: ProtectionTreeTemplar,
  },
  {
    key: "retribution-herald",
    name: "Retribution + Herald of the Sun",
    spec: "Retribution",
    component: RetributionTreeHerald,
  },
  {
    key: "retribution-templar",
    name: "Retribution + Templar",
    spec: "Retribution",
    component: RetributionTreeTemplar,
  },
];

function isSpec(value: unknown): value is Spec {
  return SPECS.includes(value as Spec);
}

function makeDefaultTrees(spec: Spec): Tree[] {
  return [
    createTree({ title: "Paladin", rows: 10, columns: 7, points: 31 }),
    createTree({ title: "Hero Talent", rows: 5, columns: 3, points: 11 }),
    createTree({
      title: spec,
      rows: 10,
      columns: spec === "Holy" || spec === "Retribution" ? 9 : 7,
      points: 31,
    }),
  ];
}

function defaultIconPath(name: string): string {
  return `/images/SpellIcons/${encodeURIComponent(`${name.replace(/['’]/g, "")}.jpg`)}`;
}

function collectStaticColumns(node: ReactNode, output: StaticColumn[] = []): StaticColumn[] {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;

    const props = child.props as {
      title?: unknown;
      treeKey?: unknown;
      nodes?: unknown;
      maxPoints?: unknown;
      columns?: unknown;
      edges?: unknown;
      children?: ReactNode;
    };

    if (
      typeof props.title === "string" &&
      typeof props.treeKey === "string" &&
      Array.isArray(props.nodes) &&
      typeof props.maxPoints === "number" &&
      typeof props.columns === "number" &&
      Array.isArray(props.edges)
    ) {
      output.push({
        title: props.title,
        treeKey: props.treeKey,
        nodes: props.nodes as TalentNode[],
        maxPoints: props.maxPoints,
        columns: props.columns,
        edges: props.edges as TalentEdge[],
      });
    }

    if (props.children) collectStaticColumns(props.children, output);
  });

  return output;
}

function staticColumnToTree(layoutKey: string, column: StaticColumn, index: number): Tree {
  const nodeByPosition = new Map<string, TalentNode>();
  column.nodes.forEach((node) => {
    if (node.column != null && node.row != null) {
      nodeByPosition.set(`${node.column}:${node.row}`, node);
    }
  });

  const rows = Math.max(1, ...column.nodes.map((node) => node.row ?? 1));

  return {
    type: "talenttree.dynamic",
    id: `seed-${layoutKey}-${index + 1}`,
    title: column.title,
    rows,
    columns: column.columns,
    points: column.maxPoints,
    nodes: column.nodes.map((node) => {
      const columnNumber = node.column ?? 1;
      const rowNumber = node.row ?? 1;
      const requires = column.edges
        .filter((edge) => edge[2] === columnNumber && edge[3] === rowNumber)
        .map((edge) => nodeByPosition.get(`${edge[0]}:${edge[1]}`)?.id)
        .filter((id): id is string => Boolean(id));

      return {
        id: node.id,
        name: node.name,
        description: node.description ?? "",
        icon: node.icon ?? defaultIconPath(node.name),
        row: rowNumber,
        column: columnNumber,
        maxRank: node.maxRank ?? 1,
        requires: [...new Set(requires)],
        shape: node.shape ?? "circle",
      };
    }),
  };
}

function createStaticLayout(definition: StaticLayoutDefinition): StaticLayout {
  const columns = collectStaticColumns(definition.component());
  return {
    ...definition,
    trees: columns.map((column, index) =>
      staticColumnToTree(definition.key, column, index),
    ),
  };
}

function cloneTrees(trees: Tree[]): Tree[] {
  return JSON.parse(JSON.stringify(trees)) as Tree[];
}

function parseStoredLayout(preset: Preset): StoredTalentLayout {
  const value: unknown = JSON.parse(preset.jsonQuery || "{}");
  if (!value || typeof value !== "object") {
    throw new Error("Invalid saved talent layout.");
  }

  const candidate = value as Partial<StoredTalentLayout>;
  const spec = isSpec(preset.section)
    ? preset.section
    : isSpec(candidate.spec)
      ? candidate.spec
      : null;

  if (!spec || !Array.isArray(candidate.trees)) {
    throw new Error("Saved layout is missing its spec or trees.");
  }

  const trees = candidate.trees as Tree[];
  const errors = trees.flatMap(validateTree);
  if (errors.length) throw new Error(errors.join(" "));

  return { version: 1, spec, trees };
}

function runtimeNodes(tree: Tree): TalentNode[] {
  const nameById = new Map(tree.nodes.map((node) => [node.id, node.name]));
  return tree.nodes.map((node) => ({
    id: node.id,
    name: node.name,
    description: node.description,
    icon: node.icon || undefined,
    row: node.row,
    column: node.column,
    maxRank: node.maxRank,
    requires: node.requires
      .map((id) => nameById.get(id))
      .filter((name): name is string => Boolean(name)),
    shape: node.shape ?? "circle",
  }));
}

function runtimeEdges(tree: Tree): TalentEdge[] {
  const byId = new Map(tree.nodes.map((node) => [node.id, node]));
  return tree.nodes.flatMap((node) =>
    node.requires.flatMap((parentId) => {
      const parent = byId.get(parentId);
      return parent
        ? [[parent.column, parent.row, node.column, node.row] as const]
        : [];
    }),
  );
}

function RuntimePreview({ tree }: { tree: Tree }) {
  const minimumWidth = Math.max(
    260,
    tree.columns * 50 + (tree.columns - 1) * 20 + 48,
  );

  return (
    <div
      className="min-w-0 flex-1 rounded bg-[#171717] p-4"
      style={{ minWidth: `${minimumWidth}px` }}
    >
      <h3 className="mb-4 text-center text-xl font-semibold">{tree.title}</h3>
      <div className="w-full overflow-auto">
        <RuntimeTalentTree
          treeKey={`builder-preview-${tree.id}`}
          build={`builder-preview-${tree.id}`}
          nodes={runtimeNodes(tree)}
          selectedNodeIds={EMPTY_SELECTION}
          maxPoints={tree.points}
          columns={tree.columns}
          edges={runtimeEdges(tree)}
          autoSave={false}
        />
      </div>
    </div>
  );
}

export default function TalentTrees() {
  const hardcodedLayouts = useMemo(
    () => STATIC_LAYOUT_DEFINITIONS.map(createStaticLayout),
    [],
  );

  const hardcodedTrees = useMemo<StaticTreeEntry[]>(() => {
    return SPECS.flatMap((section) => {
      const entries = hardcodedLayouts
        .filter((layout) => layout.spec === section)
        .flatMap((layout) =>
          layout.trees.map((tree) => ({
            key: `${layout.key}:${tree.title}`,
            spec: section,
            sourceLayout: layout.name,
            tree,
          })),
        );

      const unique = new Map<string, StaticTreeEntry>();
      entries.forEach((entry) => {
        if (!unique.has(entry.tree.title)) unique.set(entry.tree.title, entry);
      });
      return [...unique.values()];
    });
  }, [hardcodedLayouts]);

  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [presetId, setPresetId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [spec, setSpec] = useState<Spec>("Holy");
  const [trees, setTrees] = useState<Tree[]>([]);
  const [activeTreeId, setActiveTreeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLayoutPreview, setShowLayoutPreview] = useState(false);

  const activeTree =
    trees.find((tree) => tree.id === activeTreeId) ?? trees[0] ?? null;

  const validationErrors = useMemo(
    () => trees.flatMap(validateTree),
    [trees],
  );

  async function refreshList() {
    const rows = await readApiJson<PresetSummary[]>(
      await fetchBackend(`/api/presets?entity=${encodeURIComponent(ENTITY)}`, {
        cache: "no-store",
      }),
    );
    setPresets(rows);
  }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const rows = await readApiJson<PresetSummary[]>(
          await fetchBackend(`/api/presets?entity=${encodeURIComponent(ENTITY)}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        );
        if (!controller.signal.aborted) setPresets(rows);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load talent layouts.",
          );
        }
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function markChanged(nextTrees: Tree[]) {
    setTrees(nextTrees);
    setDirty(true);
    setMessage("");
  }

  function resetWorkspace(
    nextSpec: Spec,
    nextName: string,
    nextTrees: Tree[],
    nextDirty: boolean,
  ) {
    setPresetId(null);
    setName(nextName);
    setSpec(nextSpec);
    setTrees(nextTrees);
    setActiveTreeId(nextTrees[0]?.id ?? "");
    setDirty(nextDirty);
    setShowLayoutPreview(nextTrees.length > 0);
    setError("");
    setMessage("");
  }

  function newLayout(initialSpec: Spec = "Holy") {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    resetWorkspace(initialSpec, "", makeDefaultTrees(initialSpec), true);
  }

  function loadHardcodedLayout(layout: StaticLayout) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    resetWorkspace(layout.spec, layout.name, cloneTrees(layout.trees), true);
    setMessage(
      "Hardcoded layout loaded as an editable seed. The live page is unchanged.",
    );
  }

  function loadHardcodedTree(entry: StaticTreeEntry) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    const [tree] = cloneTrees([entry.tree]);
    resetWorkspace(
      entry.spec,
      `${entry.spec} - ${entry.tree.title}`,
      [tree],
      true,
    );
    setMessage(
      `${entry.tree.title} loaded from ${entry.sourceLayout} as an editable seed. The live page is unchanged.`,
    );
  }

  function duplicateLayout() {
    if (!trees.length) return;
    setPresetId(null);
    setName(name.trim() ? `${name.trim()} Copy` : "Copied talent layout");
    setDirty(true);
    setMessage("Copy created locally. Save it to create a new layout.");
  }

  function changeSpec(nextSpec: Spec) {
    if (nextSpec === spec) return;
    setTrees((current) =>
      current.map((tree, index) =>
        index === 2 && tree.title === spec && tree.nodes.length === 0
          ? {
              ...tree,
              title: nextSpec,
              columns:
                nextSpec === "Holy" || nextSpec === "Retribution" ? 9 : 7,
            }
          : tree,
      ),
    );
    setSpec(nextSpec);
    setDirty(true);
    setMessage("");
  }

  async function loadLayout(id: number) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const preset = await readApiJson<Preset>(
        await fetchBackend(`/api/presets/${id}`, { cache: "no-store" }),
      );
      if (preset.entity !== ENTITY) {
        throw new Error("This preset is not a talent layout.");
      }
      const stored = parseStoredLayout(preset);
      setPresetId(preset.id);
      setName(preset.name);
      setSpec(stored.spec);
      setTrees(stored.trees);
      setActiveTreeId(stored.trees[0]?.id ?? "");
      setDirty(false);
      setShowLayoutPreview(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load layout.");
    } finally {
      setBusy(false);
    }
  }

  async function getCsrfToken() {
    const csrf = await readApiJson<{ token: string }>(
      await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" }),
    );
    if (!csrf.token) throw new Error("Could not verify the request.");
    return csrf.token;
  }

  async function saveLayout() {
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Layout name is required.");
      return;
    }
    if (!trees.length) {
      setError("Add at least one talent tree.");
      return;
    }
    if (validationErrors.length) {
      setError(validationErrors.join(" "));
      return;
    }

    setBusy(true);
    try {
      const token = await getCsrfToken();
      const stored: StoredTalentLayout = { version: 1, spec, trees };
      const body = presetId
        ? {
            name: name.trim(),
            section: spec,
            jsonQuery: JSON.stringify(stored),
          }
        : {
            name: name.trim(),
            entity: ENTITY,
            section: spec,
            jsonQuery: JSON.stringify(stored),
          };

      const saved = await readApiJson<Preset>(
        await fetchBackend(
          presetId ? `/api/presets/${presetId}` : "/api/presets",
          {
            method: presetId ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": token,
            },
            body: JSON.stringify(body),
          },
        ),
      );

      setPresetId(saved.id);
      setName(saved.name || name.trim());
      setDirty(false);
      setMessage("Talent layout saved.");
      await refreshList();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save layout.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteLayout() {
    if (!presetId) return;
    if (!window.confirm(`Delete layout "${name}"?`)) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await getCsrfToken();
      const response = await fetchBackend(`/api/presets/${presetId}`, {
        method: "DELETE",
        headers: { "X-CSRF-TOKEN": token },
      });
      if (!response.ok) throw new Error("Could not delete layout.");

      setPresetId(null);
      setName("");
      setTrees([]);
      setActiveTreeId("");
      setDirty(false);
      setShowLayoutPreview(false);
      setMessage("Talent layout deleted.");
      await refreshList();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete layout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-talent-workspace min-h-[calc(100vh-45px)] w-full max-w-none bg-slate-950 text-slate-100">
      <div className="flex min-h-[calc(100vh-45px)] w-full max-w-none items-stretch">
        <aside className="admin-talent-sources sticky top-0 h-screen w-[320px] shrink-0 overflow-y-auto border-r border-slate-700 bg-[#0b1020] p-4">
          <BuilderNavigation />

          <div className="mb-5 mt-4 flex gap-2">
            <button
              type="button"
              className={`${button} flex-1`}
              onClick={() => newLayout()}
              disabled={busy}
            >
              New layout
            </button>
            <button
              type="button"
              className={secondaryButton}
              onClick={() =>
                void refreshList().catch((cause) =>
                  setError(
                    cause instanceof Error ? cause.message : "Refresh failed.",
                  ),
                )
              }
            >
              ↻
            </button>
          </div>

          <nav aria-label="Talent layout workspace" className="space-y-6">
            {SPECS.map((section) => {
              const staticRows = hardcodedLayouts.filter(
                (layout) => layout.spec === section,
              );
              const staticTreeRows = hardcodedTrees.filter(
                (entry) => entry.spec === section,
              );
              const savedRows = presets.filter(
                (preset) =>
                  preset.section?.toLowerCase() === section.toLowerCase(),
              );

              return (
                <section key={section}>
                  <h2 className="mb-2 border-b border-slate-700 pb-2 text-sm font-bold uppercase tracking-wide text-amber-400">
                    {section}
                  </h2>

                  <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                    Hardcoded layouts
                  </p>
                  <div className="space-y-1">
                    {staticRows.map((layout) => (
                      <button
                        key={layout.key}
                        type="button"
                        onClick={() => loadHardcodedLayout(layout)}
                        className="block w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                      >
                        <span className="block font-medium">{layout.name}</span>
                        <span className="text-xs text-slate-500">
                          Full layout · {layout.trees.length} trees
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="mb-1 mt-3 text-[11px] uppercase tracking-wide text-slate-500">
                    Hardcoded trees
                  </p>
                  <div className="space-y-1">
                    {staticTreeRows.map((entry) => (
                      <button
                        key={entry.key}
                        type="button"
                        onClick={() => loadHardcodedTree(entry)}
                        className="block w-full rounded border-l-2 border-slate-700 px-3 py-2 text-left text-sm text-slate-300 hover:border-amber-400 hover:bg-slate-800"
                      >
                        <span className="block font-medium">{entry.tree.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {entry.tree.nodes.length} talents · {entry.sourceLayout}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="mb-1 mt-3 text-[11px] uppercase tracking-wide text-slate-500">
                    Saved layouts
                  </p>
                  <div className="space-y-1">
                    {savedRows.length ? (
                      savedRows.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => void loadLayout(preset.id)}
                          className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                            presetId === preset.id
                              ? "bg-slate-800 text-amber-300"
                              : "text-slate-200"
                          }`}
                        >
                          <span className="block font-medium">{preset.name}</span>
                          <span className="text-xs text-slate-500">
                            Saved layout
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-1 text-xs text-slate-600">
                        No saved layouts
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-5 xl:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl">Talent Tree Builder</h1>
              <p className="mt-2 text-sm text-slate-400">
                Hardcoded layouts and trees are read-only sources. Loading one creates
                an editable seed here and does not change the live Holy, Protection or
                Retribution pages.
              </p>
            </div>

            {trees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setShowLayoutPreview((value) => !value)}
                >
                  {showLayoutPreview ? "Hide full preview" : "Full preview"}
                </button>
                {presetId ? (
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={duplicateLayout}
                  >
                    Duplicate
                  </button>
                ) : null}
                {presetId ? (
                  <button
                    type="button"
                    className="rounded bg-red-900 px-4 py-2 text-white"
                    onClick={() => void deleteLayout()}
                  >
                    Delete layout
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="mb-5 rounded border border-red-800 bg-red-950/50 p-3 text-red-200"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p
              role="status"
              className="mb-5 rounded border border-emerald-800 bg-emerald-950/40 p-3 text-emerald-200"
            >
              {message}
            </p>
          ) : null}

          {!trees.length ? (
            <div className="grid min-h-[60vh] place-items-center rounded border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
              <div>
                <h2 className="text-2xl font-semibold">
                  Choose a layout or tree from the left
                </h2>
                <p className="mt-2 max-w-xl text-slate-400">
                  Open a full hardcoded layout, one individual hardcoded tree, a saved
                  layout, or create a blank layout.
                </p>
              </div>
            </div>
          ) : (
            <fieldset disabled={busy} className="min-w-0 space-y-5">
              <div className="grid gap-4 rounded border border-slate-700 bg-slate-900/60 p-4 md:grid-cols-2">
                <label>
                  Layout name
                  <input
                    className={input}
                    value={name}
                    maxLength={150}
                    placeholder="e.g. Holy + Herald of the Sun"
                    onChange={(event) => {
                      setName(event.target.value);
                      setDirty(true);
                      setMessage("");
                    }}
                  />
                </label>

                <label>
                  Spec
                  <select
                    className={input}
                    value={spec}
                    onChange={(event) =>
                      changeSpec(event.target.value as Spec)
                    }
                  >
                    {SPECS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {trees.map((tree, index) => (
                  <button
                    type="button"
                    key={tree.id}
                    aria-pressed={activeTree === tree}
                    className={`${secondaryButton} ${
                      activeTree === tree ? "ring-2 ring-amber-400" : ""
                    }`}
                    onClick={() => setActiveTreeId(tree.id)}
                  >
                    {tree.title || `Tree ${index + 1}`}
                  </button>
                ))}

                <button
                  type="button"
                  className={button}
                  onClick={() => {
                    const next = createTree({
                      title: `Tree ${trees.length + 1}`,
                    });
                    markChanged([...trees, next]);
                    setActiveTreeId(next.id);
                  }}
                >
                  Add tree
                </button>
              </div>

              {showLayoutPreview ? (
                <section className="w-full max-w-none space-y-4 rounded border border-slate-700 bg-[#101010] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl">
                        {name.trim() || "Unsaved layout"}
                      </h2>
                      <p className="text-sm text-slate-400">Spec: {spec}</p>
                    </div>
                  </div>
                  <div className="w-full overflow-x-auto pb-2">
                    <div className="flex min-w-max items-start gap-4">
                      {trees.map((tree) => (
                        <RuntimePreview key={tree.id} tree={tree} />
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              {activeTree ? (
                <section className="space-y-4 rounded border border-slate-700 bg-slate-900/60 p-4">
                  <TreeEditor
                    key={activeTree.id}
                    tree={activeTree}
                    onChange={(next) => {
                      markChanged(trees.map((tree) => tree.id === activeTree.id ? next : tree));
                      setActiveTreeId(next.id);
                    }}
                  />

                  <button
                    type="button"
                    className="rounded bg-red-900 px-3 py-2"
                    onClick={() => {
                      if (
                        !window.confirm(`Delete tree "${activeTree.title}"?`)
                      )
                        return;
                      const next = trees.filter(
                        (tree) => tree.id !== activeTree.id,
                      );
                      markChanged(next);
                      setActiveTreeId(next[0]?.id ?? "");
                    }}
                  >
                    Delete tree
                  </button>
                </section>
              ) : null}

              <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
                <button
                  type="button"
                  className={button}
                  disabled={busy || !dirty || validationErrors.length > 0}
                  onClick={() => void saveLayout()}
                >
                  {busy
                    ? "Saving…"
                    : presetId
                      ? "Save layout"
                      : "Create layout"}
                </button>
                <span className="text-sm text-slate-400">
                  {dirty ? "Unsaved changes" : "All changes saved"}
                </span>
              </div>
            </fieldset>
          )}
        </section>
      </div>
    </main>
  );
}
