"use client";

import TalentTree, { type TalentEdge, type TalentNode } from "./TalentTree";
import { validateTree, type Tree } from "@/features/dynamic-talents/model";
import { seedTalentRanks } from "./seedTalentRanks";
import { withTalentChoice } from "./talentChoices";

export function validPublishedTrees(value: unknown): value is Tree[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 3 &&
    value.every((tree) => tree && typeof tree === "object" && validateTree(tree as Tree).length === 0);
}

function toNodes(tree: Tree): TalentNode[] {
  const names = new Map(tree.nodes.map((node) => [node.id, node.name]));
  const nodes = tree.nodes.map((node) => ({
    id: node.id,
    name: node.name,
    description: node.description,
    icon: node.icon,
    url: node.url,
    row: node.row,
    column: node.column,
    maxRank: node.maxRank,
    rank: node.rank,
    selectedChoice: node.selectedChoice,
    alternative: node.alternative,
    shape: node.shape,
    requires: node.requires.map((id) => names.get(id)).filter((name): name is string => Boolean(name)),
  }));
  return tree.nodes.every((node) => node.rank === undefined)
    ? seedTalentRanks(nodes) : nodes.map(withTalentChoice);
}

function toEdges(tree: Tree): TalentEdge[] {
  const nodes = new Map(tree.nodes.map((node) => [node.id, node]));
  return tree.nodes.flatMap((node) => node.requires.flatMap((id) => {
    const parent = nodes.get(id);
    return parent ? [[parent.column, parent.row, node.column, node.row] as const] : [];
  }));
}

export default function PublishedTalentTrees({ layoutKey, trees }: { layoutKey: string; trees: Tree[] }) {
  return (
    <section className="w-full bg-[#151515] text-white" data-build={layoutKey}>
      <div className="w-full overflow-x-auto">
        <div className="mx-auto flex w-max items-stretch justify-center gap-[15px] py-[15px]">
          {trees.map((tree) => (
            <section key={tree.id} className="box-border flex shrink-0 flex-col items-center rounded-lg border border-white/20 bg-[#1a1a1a] p-[15px]"
              style={{ width: `${Math.max(250, tree.columns * 70 + 65)}px` }}>
              <h2 className="mb-[15px] mt-5 text-center text-2xl font-bold text-white">{tree.title}</h2>
              <TalentTree treeKey={`${layoutKey}-${tree.id}`} build={layoutKey} nodes={toNodes(tree)}
                maxPoints={tree.points} columns={tree.columns} edges={toEdges(tree)} readOnly />
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
