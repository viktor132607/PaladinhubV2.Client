
import { HtmlContent } from "@/components/migration/MigratedView";
export type ColumnsTextBlockProps = { id?: string; columns?: number; markdownPerColumn?: string[] };
export default function ColumnsTextBlock({ id, columns = 2, markdownPerColumn = [] }: ColumnsTextBlockProps) {
  const safeColumns = Math.min(4, Math.max(2, columns));
  const gridColumns = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[safeColumns];
  return <section id={id} className={`columns-text columns-${safeColumns}`}><div className={`grid gap-4 ${gridColumns}`}>{markdownPerColumn.map((html, index) => <HtmlContent key={index} html={html} className="col" />)}</div></section>;
}
