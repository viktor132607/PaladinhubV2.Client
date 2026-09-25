export type TalentGate = { row: number; points: number };
export type RankedNode = { row?: number; maxRank?: number; rank?: number; cost?: number };
export type GateStatus = TalentGate & { spent: number; missing: number };

export function defaultTalentGates(title: string, rows: number): TalentGate[] {
  const lower = title.trim().toLowerCase();
  const first = lower === "paladin" ? 6 :
    ["holy", "protection", "retribution"].includes(lower) ? 7 : null;
  if (first === null) return [];
  return [{ row: 5, points: first }, { row: 8, points: first * 2 }]
    .filter((gate) => gate.row <= rows);
}

export function evaluateTalentGates<T extends RankedNode>(
  nodes: T[], gates: TalentGate[], rankOf: (node: T) => number,
  costOf: (node: T) => number = (node) => node.cost ?? 1,
): GateStatus[] {
  const statuses: GateStatus[] = [];
  for (const gate of [...gates].sort((a, b) => a.row - b.row)) {
    const spent = nodes.reduce((sum, node) => {
      const row = node.row ?? 1;
      if (row >= gate.row || statuses.some((previous) => previous.missing > 0 && row >= previous.row)) return sum;
      return sum + rankOf(node) * costOf(node);
    }, 0);
    statuses.push({ ...gate, spent, missing: Math.max(0, gate.points - spent) });
  }
  return statuses;
}

export function lockedGateForRow(gates: GateStatus[], row: number): GateStatus | undefined {
  return gates.find((gate) => row >= gate.row && gate.missing > 0);
}
