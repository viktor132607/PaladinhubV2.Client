export type TalentShape = "circle" | "square" | "hexagon";

export type Talent = {
  id: string;
  name: string;
  description: string;
  icon: string;
  row: number;
  column: number;
  maxRank: number;
  requires: string[];
  shape?: TalentShape;
};

export type Tree = {
  type: "talenttree.dynamic";
  id: string;
  title: string;
  rows: number;
  columns: number;
  points: number;
  nodes: Talent[];
};

export type Ranks = Record<string, number>;
export type Block = Record<string, unknown> & { type: string };

export function createTree(
  options: Partial<Pick<Tree, "title" | "rows" | "columns" | "points">> = {},
): Tree {
  return {
    type: "talenttree.dynamic",
    id: crypto.randomUUID(),
    title: options.title ?? "New talent tree",
    rows: options.rows ?? 8,
    columns: options.columns ?? 6,
    points: options.points ?? 30,
    nodes: [],
  };
}

export function validateTree(tree: Tree): string[] {
  const errors: string[] = [];
  if (
    !tree ||
    typeof tree.id !== "string" ||
    !tree.id ||
    typeof tree.title !== "string"
  ) {
    return ["Invalid tree identity or title."];
  }

  if (
    ![tree.rows, tree.columns, tree.points].every(Number.isInteger) ||
    tree.rows < 1 ||
    tree.rows > 20 ||
    tree.columns < 1 ||
    tree.columns > 12 ||
    tree.points < 1 ||
    tree.points > 100
  ) {
    errors.push("Use 1–20 rows, 1–12 columns and 1–100 points.");
  }

  if (!Array.isArray(tree.nodes)) return [...errors, "Nodes must be an array."];

  const ids = new Set<string>();
  const cells = new Set<string>();

  for (const node of tree.nodes) {
    if (
      !node ||
      typeof node.id !== "string" ||
      !Array.isArray(node.requires) ||
      node.requires.some((id) => typeof id !== "string")
    ) {
      errors.push("Invalid talent.");
      continue;
    }

    if (!node.id || ids.has(node.id)) {
      errors.push("Every talent needs a unique ID.");
    }
    ids.add(node.id);

    const cell = `${node.row}:${node.column}`;
    if (cells.has(cell)) errors.push("Two talents cannot occupy the same cell.");
    cells.add(cell);

    if (
      !Number.isInteger(node.row) ||
      !Number.isInteger(node.column) ||
      node.row < 1 ||
      node.row > tree.rows ||
      node.column < 1 ||
      node.column > tree.columns
    ) {
      errors.push("A talent is outside the grid. Move it before shrinking the grid.");
    }

    if (
      !Number.isInteger(node.maxRank) ||
      node.maxRank < 1 ||
      node.maxRank > 10
    ) {
      errors.push("Talent ranks must be between 1 and 10.");
    }

    if (
      typeof node.name !== "string" ||
      !node.name.trim() ||
      typeof node.description !== "string" ||
      typeof node.icon !== "string"
    ) {
      errors.push("Every talent needs a name and text fields.");
    }

    if (
      node.shape !== undefined &&
      node.shape !== "circle" &&
      node.shape !== "square" &&
      node.shape !== "hexagon"
    ) {
      errors.push("Talent shape must be circle, square or hexagon.");
    }
  }

  if (errors.length) return [...new Set(errors)];

  const done = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) return false;
    if (done.has(id)) return true;

    const node = tree.nodes.find((n) => n.id === id);
    if (!node) return false;

    visiting.add(id);
    for (const parent of node.requires) {
      if (!visit(parent)) return false;
    }
    visiting.delete(id);
    done.add(id);
    return true;
  }

  if (tree.nodes.some((n) => !visit(n.id))) {
    errors.push("Connections must reference existing talents and cannot form a cycle.");
  }

  return errors;
}

export function removeTalent(tree: Tree, id: string): Tree {
  return {
    ...tree,
    nodes: tree.nodes
      .filter((n) => n.id !== id)
      .map((n) => ({ ...n, requires: n.requires.filter((p) => p !== id) })),
  };
}

export function changeRank(
  tree: Tree,
  ranks: Ranks,
  id: string,
  delta: 1 | -1,
): Ranks {
  const node = tree.nodes.find((n) => n.id === id);
  if (!node || validateTree(tree).length) return ranks;

  const current = ranks[id] || 0;
  const unmet = (n: Talent, values: Ranks) =>
    n.requires.some(
      (parent) =>
        (values[parent] || 0) !==
        tree.nodes.find((p) => p.id === parent)?.maxRank,
    );

  if (
    delta === 1 &&
    (current >= node.maxRank ||
      Object.values(ranks).reduce((a, b) => a + b, 0) >= tree.points ||
      unmet(node, ranks))
  ) {
    return ranks;
  }

  if (delta === -1 && current === 0) return ranks;

  const next = { ...ranks, [id]: current + delta };
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of tree.nodes) {
      if (next[n.id] && unmet(n, next)) {
        next[n.id] = 0;
        changed = true;
      }
    }
  }

  return next;
}

export function parseLayout(json: string): Block[] {
  const value: unknown = JSON.parse(json || "[]");
  if (
    !Array.isArray(value) ||
    value.some(
      (b) =>
        !b ||
        typeof b !== "object" ||
        !("type" in b) ||
        typeof (b as { type?: unknown }).type !== "string",
    )
  ) {
    throw new Error("Invalid page layout.");
  }
  return value as Block[];
}

export function treeBlocks(json: string): Tree[] {
  return parseLayout(json).filter((b) => b.type === "talenttree.dynamic") as Tree[];
}

export function replaceTree(json: string, tree: Tree): string {
  const errors = validateTree(tree);
  if (errors.length) throw new Error(errors.join(" "));

  const blocks = parseLayout(json);
  const index = blocks.findIndex((b) => b.type === tree.type && b.id === tree.id);
  if (index < 0) blocks.push(tree);
  else blocks[index] = tree;
  return JSON.stringify(blocks);
}
