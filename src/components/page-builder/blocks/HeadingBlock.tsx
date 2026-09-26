
import { HtmlContent } from "@/components/migration/MigratedView";
import { getAlignmentClass, type BlockAlignment } from "./alignment";
export type HeadingBlockProps = { id?: string; text?: string; level?: "h1" | "h2" | "h3"; align?: BlockAlignment; className?: string };
export default function HeadingBlock({ id, text = "Heading", level = "h2", align = "left", className = "" }: HeadingBlockProps) {
  const Tag = level;
  return <section id={id}><Tag className={`${className} ${getAlignmentClass(align)}`.trim()}><HtmlContent html={text} /></Tag></section>;
}
