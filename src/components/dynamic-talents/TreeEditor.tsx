"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import TreeView, { TreeGrid } from "./TreeView";
import {
  removeTalent,
  validateTree,
  type TalentShape,
  type Tree,
} from "@/features/dynamic-talents/model";

const field = "w-full rounded border border-slate-600 bg-[#1f2327] px-3 py-2";

type LibraryKind = "all" | "spell" | "talent";

type SpellLibraryItem = {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality?: string | null;
};

type SpellDatabasePage = {
  page?: number;
  pages?: number;
  total?: number;
  spells?: SpellLibraryItem[] | null;
};

function normalizeLibraryKind(item: SpellLibraryItem): "spell" | "talent" {
  const value = item.quality?.trim().toLowerCase() ?? "";
  return value.includes("talent") ? "talent" : "spell";
}

function spellIconPath(icon?: string | null): string {
  const value = icon?.trim();
  if (!value) return "";
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("/")) return value;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  return `/images/SpellIcons/${encodeURIComponent(decoded)}`;
}

export default function TreeEditor({
  tree,
  onChange,
}: {
  tree: Tree;
  onChange: (tree: Tree) => void;
}) {
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(false);
  const [library, setLibrary] = useState<SpellLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryKind, setLibraryKind] = useState<LibraryKind>("all");
  const [armedSourceId, setArmedSourceId] = useState<number | null>(null);

  const errors = validateTree(tree);
  const node = tree.nodes.find((n) => n.id === selected);
  const armedSource = library.find((item) => item.id === armedSourceId) ?? null;

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setLibraryLoading(true);
      setLibraryError("");

      try {
        const records: SpellLibraryItem[] = [];
        let page = 1;
        let pages = 1;

        do {
          const response = await fetchBackend(
            `/Admin/api/database?entity=Spells&page=${page}&pageSize=100`,
            {
              cache: "no-store",
              signal: controller.signal,
              headers: { Accept: "application/json" },
            },
          );
          const result = await readApiJson<SpellDatabasePage>(response);
          if (controller.signal.aborted) return;

          records.push(...(result.spells ?? []));
          pages = Math.max(1, Number(result.pages) || 1);
          page += 1;
        } while (page <= pages);

        setLibrary(records);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLibraryError(
            cause instanceof Error
              ? cause.message
              : "Could not load spells and talents from the database.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLibraryLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const filteredLibrary = useMemo(() => {
    const search = librarySearch.trim().toLowerCase();

    return library.filter((item) => {
      const kind = normalizeLibraryKind(item);
      if (libraryKind !== "all" && kind !== libraryKind) return false;
      if (!search) return true;

      return (
        item.name.toLowerCase().includes(search) ||
        (item.description ?? "").toLowerCase().includes(search)
      );
    });
  }, [library, libraryKind, librarySearch]);

  const libraryCounts = useMemo(
    () => ({
      all: library.length,
      spell: library.filter((item) => normalizeLibraryKind(item) === "spell").length,
      talent: library.filter((item) => normalizeLibraryKind(item) === "talent").length,
    }),
    [library],
  );

  const updateNode = (patch: Partial<Tree["nodes"][number]>) =>
    onChange({
      ...tree,
      nodes: tree.nodes.map((n) =>
        n.id === selected ? { ...n, ...patch } : n,
      ),
    });

  const addNodeAt = (row: number, column: number) => {
    const id = armedSource
      ? `db-spell-${armedSource.id}-${crypto.randomUUID()}`
      : crypto.randomUUID();

    onChange({
      ...tree,
      nodes: [
        ...tree.nodes,
        {
          id,
          name: armedSource?.name ?? "New talent",
          description: armedSource?.description ?? "",
          icon: spellIconPath(armedSource?.icon),
          row,
          column,
          maxRank: 1,
          requires: [],
          shape: "circle",
        },
      ],
    });

    setSelected(id);
    setArmedSourceId(null);
  };

  return (
    <div className="min-w-0 space-y-4">
      <label className="block">
        Tree title
        <input
          className={field}
          value={tree.title}
          onChange={(e) => onChange({ ...tree, title: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {(
          [
            ["rows", 20],
            ["columns", 12],
            ["points", 100],
          ] as const
        ).map(([name, max]) => (
          <label key={name}>
            {name}
            <input
              className={field}
              type="number"
              min={1}
              max={max}
              value={tree[name]}
              onChange={(e) =>
                onChange({ ...tree, [name]: Number(e.target.value) })
              }
            />
          </label>
        ))}
      </div>

      {errors.length > 0 && (
        <p role="alert" className="text-red-300">
          {errors.join(" ")}
        </p>
      )}

      <button
        type="button"
        className="rounded bg-amber-500 px-4 py-2 text-slate-950"
        onClick={() => setPreview(!preview)}
      >
        {preview ? "Edit structure" : "Test build"}
      </button>

      {preview ? (
        <TreeView key={JSON.stringify(tree)} tree={tree} />
      ) : (
        <>
          <section className="space-y-3 rounded border border-slate-700 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl">Spell / Talent pieces</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Select a database piece, then click an empty + slot in the tree.
                </p>
              </div>

              {armedSource ? (
                <div className="flex items-center gap-2 rounded border border-amber-400 bg-amber-400/10 px-3 py-2">
                  {spellIconPath(armedSource.icon) ? (
                    <img
                      src={spellIconPath(armedSource.icon)}
                      alt=""
                      className="h-8 w-8 object-cover"
                    />
                  ) : null}
                  <span className="text-sm">
                    Ready: <strong>{armedSource.name}</strong>
                  </span>
                  <button
                    type="button"
                    className="rounded bg-slate-700 px-2 py-1 text-xs"
                    onClick={() => setArmedSourceId(null)}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Manual + mode</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                className={`${field} min-w-[220px] flex-1`}
                type="search"
                value={librarySearch}
                placeholder="Search spells or talents..."
                onChange={(event) => setLibrarySearch(event.target.value)}
              />

              {(["all", "spell", "talent"] as const).map((kind) => (
                <button
                  type="button"
                  key={kind}
                  aria-pressed={libraryKind === kind}
                  className={`rounded px-3 py-2 text-sm ${
                    libraryKind === kind
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-700 text-slate-100"
                  }`}
                  onClick={() => setLibraryKind(kind)}
                >
                  {kind === "all" ? "All" : kind === "spell" ? "Spells" : "Talents"} ({libraryCounts[kind]})
                </button>
              ))}
            </div>

            {libraryError ? (
              <p role="alert" className="text-red-300">{libraryError}</p>
            ) : null}

            {libraryLoading ? (
              <p className="text-slate-400">Loading database pieces...</p>
            ) : (
              <div className="max-h-[300px] overflow-auto pr-1">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2">
                  {filteredLibrary.map((item) => {
                    const icon = spellIconPath(item.icon);
                    const kind = normalizeLibraryKind(item);
                    const active = armedSourceId === item.id;

                    return (
                      <button
                        type="button"
                        key={item.id}
                        aria-pressed={active}
                        title={item.description || item.name}
                        className={`flex min-h-[68px] items-center gap-3 rounded border p-2 text-left transition ${
                          active
                            ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400"
                            : "border-slate-700 bg-[#151a20] hover:border-slate-500 hover:bg-slate-800"
                        }`}
                        onClick={() => setArmedSourceId(active ? null : item.id)}
                      >
                        {icon ? (
                          <img
                            src={icon}
                            alt=""
                            className="h-11 w-11 shrink-0 object-cover"
                          />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center bg-slate-800 text-xs text-slate-500">
                            no icon
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{item.name}</span>
                          <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            kind === "talent"
                              ? "bg-violet-900/70 text-violet-200"
                              : "bg-blue-900/70 text-blue-200"
                          }`}>
                            {kind}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!filteredLibrary.length && !libraryLoading ? (
                  <p className="py-4 text-center text-sm text-slate-500">
                    No database pieces match this filter.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <p>
            {armedSource
              ? `Click + to place ${armedSource.name}.`
              : "Click + to add a blank talent, or select a database piece above first."}{" "}
            Select a talent to edit or move it. Connections require all parents at maximum rank.
          </p>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[max-content_minmax(420px,1fr)] xl:items-start">
            <div className="min-w-0">
              {!errors.length && (
                <TreeGrid
                  tree={tree}
                  selected={selected}
                  onNode={setSelected}
                  onCell={addNodeAt}
                />
              )}
            </div>

            <div className="min-w-0 xl:sticky xl:top-4">
              {node ? (
                <div className="space-y-3 rounded border border-slate-600 p-4">
                  <h3 className="text-xl">Edit talent</h3>

                  {(["name", "description", "icon"] as const).map((name) => (
                    <label className="block" key={name}>
                      {name}
                      <textarea
                        className={field}
                        rows={name === "description" ? 3 : 1}
                        value={node[name]}
                        onChange={(e) => updateNode({ [name]: e.target.value })}
                      />
                    </label>
                  ))}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    {(["row", "column", "maxRank"] as const).map((name) => (
                      <label key={name}>
                        {name}
                        <input
                          className={field}
                          type="number"
                          min={1}
                          max={
                            name === "row"
                              ? tree.rows
                              : name === "column"
                                ? tree.columns
                                : 10
                          }
                          value={node[name]}
                          onChange={(e) =>
                            updateNode({ [name]: Number(e.target.value) })
                          }
                        />
                      </label>
                    ))}

                    <label>
                      shape
                      <select
                        className={field}
                        value={node.shape ?? "circle"}
                        onChange={(e) =>
                          updateNode({ shape: e.target.value as TalentShape })
                        }
                      >
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                        <option value="hexagon">Hexagon</option>
                      </select>
                    </label>
                  </div>

                  <fieldset className="max-h-[48vh] space-y-2 overflow-auto pr-2">
                    <legend>Prerequisites / connections</legend>
                    {tree.nodes
                      .filter((n) => n.id !== selected)
                      .map((n) => (
                        <label className="flex items-center gap-2" key={n.id}>
                          <input
                            type="checkbox"
                            checked={node.requires.includes(n.id)}
                            onChange={(e) =>
                              updateNode({
                                requires: e.target.checked
                                  ? [...node.requires, n.id]
                                  : node.requires.filter((id) => id !== n.id),
                              })
                            }
                          />
                          {n.icon ? (
                            <img
                              src={n.icon}
                              alt=""
                              aria-hidden="true"
                              className="h-7 w-7 shrink-0 object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="h-7 w-7 shrink-0 bg-slate-800"
                            />
                          )}
                          <span>{n.name}</span>
                        </label>
                      ))}
                  </fieldset>

                  <button
                    type="button"
                    className="rounded bg-red-900 px-3 py-2"
                    onClick={() => {
                      onChange(removeTalent(tree, selected));
                      setSelected("");
                    }}
                  >
                    Delete talent and connections
                  </button>
                </div>
              ) : (
                <div className="rounded border border-dashed border-slate-600 p-6 text-slate-400">
                  Select a talent in the tree to edit it here.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
