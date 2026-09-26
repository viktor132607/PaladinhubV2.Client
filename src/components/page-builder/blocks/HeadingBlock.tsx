
import { HtmlContent } from "@/components/migration/MigratedView";
export type HeadingBlockProps = { id?: string; text?: string; level?: "h1" | "h2" | "h3"; align?: "left" | "center" | "right"; className?: string };
export default function HeadingBlock({ id, text = "Heading", level = "h2", align = "left", className = "" }: HeadingBlockProps) {
  const Tag = level;
  return <section id={id}><Tag className={className} style={{ textAlign: align }}><HtmlContent html={text} /></Tag></section>;
}
