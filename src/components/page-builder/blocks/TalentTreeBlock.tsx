import TalentTree, {
  type TalentNode,
} from "@/components/talent-trees/TalentTree";

export type TalentTreeBlockProps = {
  id?: string;
  treeKey?: string;
  build?: string;
  nodes?: TalentNode[];
  selectedNodeIds?: string[];
  adminMode?: boolean;
};

export default function TalentTreeBlock({
  id,
  treeKey = "paladin",
  build = "",
  nodes = [],
  selectedNodeIds,
  adminMode = false,
}: TalentTreeBlockProps) {
  return (
    <section
      id={id}
      className="talent-tree-block"
      data-tree-key={treeKey}
      data-build={build}
    >
      <TalentTree
        treeKey={treeKey}
        build={build}
        nodes={nodes}
        selectedNodeIds={selectedNodeIds}
        adminMode={adminMode}
      />
    </section>
  );
}
