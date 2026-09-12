// Copies must not share talent IDs or rank storage keys with their source.
export function copyTemplate(json: string): string {
  function visit(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;
    const object = value as Record<string, unknown>;
    if (object.type === "talenttree.dynamic" && Array.isArray(object.nodes)) {
      const nodes = object.nodes as { id: string; requires: string[] }[];
      const ids = new Map(nodes.map(node => [node.id, crypto.randomUUID()]));
      return { ...object, id: crypto.randomUUID(), nodes: nodes.map(node => ({ ...node, id: ids.get(node.id), requires: node.requires.map(id => ids.get(id) ?? id) })) };
    }
    return Object.fromEntries(Object.entries(object).map(([key, child]) => [key, visit(child)]));
  }
  return JSON.stringify(visit(JSON.parse(json)));
}
