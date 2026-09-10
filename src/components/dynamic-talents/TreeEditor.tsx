"use client";

import { useState } from "react";
import TreeView, { TreeGrid } from "./TreeView";
import {
  removeTalent,
  validateTree,
  type TalentShape,
  type Tree,
} from "@/features/dynamic-talents/model";

const field = "w-full rounded border border-slate-600 bg-[#1f2327] px-3 py-2";

export default function TreeEditor({
  tree,
  onChange,
}: {
  tree: Tree;
  onChange: (tree: Tree) => void;
}) {
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState(false);
  const errors = validateTree(tree);
  const node = tree.nodes.find((n) => n.id === selected);

  const updateNode = (patch: Partial<Tree["nodes"][number]>) =>
    onChange({
      ...tree,
      nodes: tree.nodes.map((n) =>
        n.id === selected ? { ...n, ...patch } : n,
      ),
    });

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
          <p>
            Click + to add a talent. Select a talent to edit or move it.
            Connections require all parents at maximum rank.
          </p>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[max-content_minmax(420px,1fr)] xl:items-start">
            <div className="min-w-0">
              {!errors.length && (
                <TreeGrid
                  tree={tree}
                  selected={selected}
                  onNode={setSelected}
                  onCell={(row, column) => {
                    const id = crypto.randomUUID();
                    onChange({
                      ...tree,
                      nodes: [
                        ...tree.nodes,
                        {
                          id,
                          name: "New talent",
                          description: "",
                          icon: "",
                          row,
                          column,
                          maxRank: 1,
                          requires: [],
                          shape: "circle",
                        },
                      ],
                    });
                    setSelected(id);
                  }}
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
                        <label className="flex gap-2" key={n.id}>
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
                          {n.name}
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
