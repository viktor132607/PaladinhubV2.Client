"use client";
import { spellIconSource } from "@/lib/spell-icons";
import { useState } from "react";
import {
  changeRank,
  validateTree,
  type Tree,
  type Ranks,
} from "@/features/dynamic-talents/model";
export function TreeGrid({
  tree,
  selected,
  ranks = {},
  onNode,
  onCell,
}: {
  tree: Tree;
  selected?: string;
  ranks?: Ranks;
  onNode: (id: string) => void;
  onCell?: (row: number, column: number) => void;
}) {
  const width = tree.columns * 88,
    height = tree.rows * 88;
  return (
    <div className="max-w-full overflow-auto rounded border border-slate-700 bg-[#1f2327]">
      <div className="relative" style={{ width, height }}>
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height={height}
          aria-hidden="true"
        >
          {tree.nodes.flatMap((n) =>
            n.requires.map((id) => {
              const p = tree.nodes.find((t) => t.id === id);
              return p ? (
                <line
                  key={`${id}:${n.id}`}
                  x1={(p.column - 0.5) * 88}
                  y1={(p.row - 0.5) * 88}
                  x2={(n.column - 0.5) * 88}
                  y2={(n.row - 0.5) * 88}
                  stroke={
                    (ranks[id] || 0) === p.maxRank ? "#fbbf24" : "#64748b"
                  }
                  strokeWidth={3}
                />
              ) : null;
            }),
          )}
        </svg>
        {onCell &&
          Array.from({ length: tree.rows * tree.columns }, (_, i) => {
            const row = Math.floor(i / tree.columns) + 1,
              column = (i % tree.columns) + 1;
            return tree.nodes.some(
              (n) => n.row === row && n.column === column,
            ) ? null : (
              <button
                type="button"
                key={i}
                aria-label={`Add talent at row ${row}, column ${column}`}
                className="absolute rounded border border-dashed border-slate-600 text-slate-400"
                style={{
                  left: (column - 1) * 88 + 16,
                  top: (row - 1) * 88 + 16,
                  width: 56,
                  height: 56,
                }}
                onClick={() => onCell(row, column)}
              >
                +
              </button>
            );
          })}
        {tree.nodes.map((n) => (
          <button
            type="button"
            key={n.id}
            onClick={() => onNode(n.id)}
            aria-label={`${n.name}, ${ranks[n.id] || 0} of ${n.maxRank} ranks`}
            aria-pressed={selected === n.id}
            title={n.description}
            className={`absolute flex flex-col items-center justify-center rounded border-2 bg-slate-900 text-xs ${selected === n.id ? "border-amber-400" : "border-slate-500"}`}
            style={{
              left: (n.column - 1) * 88 + 10,
              top: (n.row - 1) * 88 + 10,
              width: 68,
              height: 68,
            }}
          >
            {n.icon && <img src={spellIconSource(n.icon)} alt="" className="h-7 w-7" />}
            <span className="w-full truncate px-1">{n.name}</span>
            <span>
              {ranks[n.id] || 0}/{n.maxRank}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
export default function TreeView({ tree }: { tree: Tree }) {
  const [ranks, setRanks] = useState<Ranks>({}),
    [selected, setSelected] = useState("");
  const errors = validateTree(tree);
  if (errors.length)
    return <p role="alert">Invalid talent tree: {errors.join(" ")}</p>;
  const node = tree.nodes.find((n) => n.id === selected);
  return (
    <section className="space-y-3">
      <h3 className="text-xl">{tree.title}</h3>
      <p>
        Points: {Object.values(ranks).reduce((a, b) => a + b, 0)} /{" "}
        {tree.points}
      </p>
      <TreeGrid
        tree={tree}
        ranks={ranks}
        selected={selected}
        onNode={setSelected}
      />
      {node && (
        <div className="space-y-2 rounded border border-slate-600 p-3">
          <strong>{node.name}</strong>
          <p className="whitespace-pre-wrap">{node.description}</p>
          <p>
            Requires all at maximum rank:{" "}
            {node.requires
              .map((id) => tree.nodes.find((n) => n.id === id)?.name)
              .join(", ") || "None"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-amber-500 px-3 py-2 text-slate-950 disabled:opacity-40"
              disabled={changeRank(tree, ranks, node.id, 1) === ranks}
              onClick={() => setRanks(changeRank(tree, ranks, node.id, 1))}
            >
              Add rank
            </button>
            <button
              type="button"
              className="rounded bg-slate-700 px-3 py-2 disabled:opacity-40"
              disabled={!ranks[node.id]}
              onClick={() => setRanks(changeRank(tree, ranks, node.id, -1))}
            >
              Refund rank
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="rounded bg-slate-700 px-3 py-2"
        onClick={() => setRanks({})}
      >
        Reset points
      </button>
    </section>
  );
}
