
import { HtmlContent } from "@/components/migration/MigratedView";
export type SectionBlockProps = { id?: string; className?: string; html?: string };
export default function SectionBlock({ id, className = "", html = "" }: SectionBlockProps) { return <section id={id} className={className}><HtmlContent html={html} /></section>; }
