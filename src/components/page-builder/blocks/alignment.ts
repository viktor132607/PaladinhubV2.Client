export type BlockAlignment = "left" | "center" | "right";

export const alignmentClass: Record<BlockAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function getAlignmentClass(value?: string | null): string {
  return alignmentClass[value?.toLowerCase() as BlockAlignment] ?? alignmentClass.left;
}
