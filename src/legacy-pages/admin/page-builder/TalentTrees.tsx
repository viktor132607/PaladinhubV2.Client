"use client";

import { useEffect, useMemo, useState } from "react";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import TreeEditor from "@/components/dynamic-talents/TreeEditor";
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

const ENTITY = "talent-layout";
const SPECS: Spec[] = ["Holy", "Protection", "Retribution"];
const EMPTY_SELECTION: string[] = [];
const button =
  "rounded bg-amber-500 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButton =
  "rounded bg-slate-700 px-4 py-2 text-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
const input =
  "w-full rounded border border-slate-600 bg-[#1f2327] px-3 py-2 text-slate-100";

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
      columns: spec === "Holy" ? 9 : 7,
      points: 31,
    }),
  ];
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
        ? [
            [
              parent.column,
              parent.row,
              node.column,
              node.row,
            ] as const,
          ]
        : [];
    }),
  );
}

function RuntimePreview({ tree }: { tree: Tree }) {
  return (
    <div className="min-w-0 rounded bg-[#171717] p-4">
      <h3 className="mb-4 text-center text-xl font-semibold">{tree.title}</h3>
      <div className="max-w-full overflow-auto">
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
            cause instanceof Error ? cause.message : "Could not load talent layouts.",
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

  function newLayout() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    const initialSpec: Spec = "Holy";
    const nextTrees = makeDefaultTrees(initialSpec);
    setPresetId(null);
    setName("");
    setSpec(initialSpec);
    setTrees(nextTrees);
    setActiveTreeId(nextTrees[0].id);
    setDirty(true);
    setShowLayoutPreview(false);
    setError("");
    setMessage("");
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
              columns: nextSpec === "Holy" ? 9 : 7,
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
      if (preset.entity !== ENTITY) throw new Error("This preset is not a talent layout.");
      const stored = parseStoredLayout(preset);
      setPresetId(preset.id);
      setName(preset.name);
      setSpec(stored.spec);
      setTrees(stored.trees);
      setActiveTreeId(stored.trees[0]?.id ?? "");
      setDirty(false);
      setShowLayoutPreview(false);
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
        await fetchBackend(presetId ? `/api/presets/${presetId}` : "/api/presets", {
          method: presetId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": token,
          },
          body: JSON.stringify(body),
        }),
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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-[1600px]">
        <BuilderNavigation />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl">Talent Tree Builder</h1>
            <p className="mt-2 text-sm text-slate-400">
              Admin-only draft layouts. Saving here does not change the live hardcoded
              Holy, Protection or Retribution talent pages.
            </p>
          </div>
          <button type="button" className={button} onClick={newLayout} disabled={busy}>
            New layout
          </button>
        </div>

        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <div className="grid gap-3 rounded border border-slate-700 bg-slate-900/60 p-4 md:grid-cols-[2fr_1fr_auto]">
            <label>
              Saved layouts
              <select
                aria-label="Saved talent layout"
                className={input}
                value={presetId ?? ""}
                onChange={(event) => {
                  if (event.target.value) void loadLayout(Number(event.target.value));
                }}
              >
                <option value="">Select layout</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.section || "No spec"} / {preset.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => void refreshList().catch((cause) =>
                  setError(cause instanceof Error ? cause.message : "Refresh failed."),
                )}
              >
                Refresh
              </button>
              {presetId && (
                <button type="button" className={secondaryButton} onClick={duplicateLayout}>
                  Duplicate
                </button>
              )}
            </div>

            {presetId && (
              <div className="flex items-end">
                <button
                  type="button"
                  className="rounded bg-red-900 px-4 py-2 text-white"
                  onClick={() => void deleteLayout()}
                >
                  Delete layout
                </button>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded border border-emerald-800 bg-emerald-950/40 p-3 text-emerald-200">
              {message}
            </p>
          )}

          {trees.length > 0 && (
            <>
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
                    onChange={(event) => changeSpec(event.target.value as Spec)}
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
                    const next = createTree({ title: `Tree ${trees.length + 1}` });
                    markChanged([...trees, next]);
                    setActiveTreeId(next.id);
                  }}
                >
                  Add tree
                </button>

                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setShowLayoutPreview((value) => !value)}
                >
                  {showLayoutPreview ? "Hide layout preview" : "Preview full layout"}
                </button>
              </div>

              {showLayoutPreview && (
                <section className="space-y-4 rounded border border-slate-700 bg-[#101010] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl">{name.trim() || "Unsaved layout"}</h2>
                      <p className="text-sm text-slate-400">Spec: {spec}</p>
                    </div>
                  </div>
                  <div className="grid items-start gap-4 xl:grid-cols-3">
                    {trees.map((tree) => (
                      <RuntimePreview key={tree.id} tree={tree} />
                    ))}
                  </div>
                </section>
              )}

              {activeTree && (
                <section className="space-y-4 rounded border border-slate-700 bg-slate-900/60 p-4">
                  <TreeEditor
                    key={activeTree.id}
                    tree={activeTree}
                    onChange={(next) =>
                      markChanged(
                        trees.map((tree) =>
                          tree.id === activeTree.id ? next : tree,
                        ),
                      )
                    }
                  />

                  <button
                    type="button"
                    className="rounded bg-red-900 px-3 py-2"
                    onClick={() => {
                      if (!window.confirm(`Delete tree "${activeTree.title}"?`)) return;
                      const next = trees.filter((tree) => tree.id !== activeTree.id);
                      markChanged(next);
                      setActiveTreeId(next[0]?.id ?? "");
                    }}
                  >
                    Delete tree
                  </button>
                </section>
              )}

              <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
                <button
                  type="button"
                  className={button}
                  disabled={busy || !dirty || validationErrors.length > 0}
                  onClick={() => void saveLayout()}
                >
                  {busy ? "Saving…" : presetId ? "Save layout" : "Create layout"}
                </button>
                <span className="text-sm text-slate-400">
                  {dirty ? "Unsaved changes" : "All changes saved"}
                </span>
              </div>
            </>
          )}
        </fieldset>
      </div>
    </main>
  );
}
