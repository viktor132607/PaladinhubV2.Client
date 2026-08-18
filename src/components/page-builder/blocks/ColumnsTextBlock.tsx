
import { HtmlContent } from "@/components/migration/MigratedView";
export type ColumnsTextBlockProps = { id?: string; columns?: number; markdownPerColumn?: string[] };
export default function ColumnsTextBlock({ id, columns = 2, markdownPerColumn = [] }: ColumnsTextBlockProps) {
  const safeColumns = Math.min(4, Math.max(2, columns));
  return <section id={id} className={`columns-text columns-${safeColumns}`}><div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}>{markdownPerColumn.map((html, index) => <HtmlContent key={index} html={html} className="col" />)}</div></section>;
}
