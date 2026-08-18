
import { HtmlContent } from "@/components/migration/MigratedView";
export type SpellListEntry = { id?: string | number; name?: string; note?: string };
export type SpellListBlockProps = { id?: string; title?: string; spells?: SpellListEntry[] };
export default function SpellListBlock({ id, title, spells = [] }: SpellListBlockProps) { return <section id={id} className="spell-list">{title ? <h3>{title}</h3> : undefined}<ul>{spells.map((spell, index) => <li key={spell.id ?? `${spell.name}-${index}`}><span className="spell-name">{spell.name ?? spell.id ?? "-"}</span>{spell.note ? <><span> — </span><HtmlContent html={spell.note} /></> : undefined}</li>)}</ul></section>; }
