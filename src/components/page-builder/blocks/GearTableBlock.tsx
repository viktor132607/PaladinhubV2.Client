
import { HtmlContent } from "@/components/migration/MigratedView";
export type GearReference = { id?: string | number; name?: string } | string | number;
export type GearRow = { slot: string; item?: GearReference; source?: string };
export type GearTableBlockProps = { id?: string; title?: string; rows?: GearRow[] };
const label = (value?: GearReference) => typeof value === "object" ? value.name ?? value.id ?? "-" : value ?? "-";
export default function GearTableBlock({ id, title, rows = [] }: GearTableBlockProps) { return <section id={id} className="table-gear">{title ? <h3>{title}</h3> : undefined}<table><thead><tr><th>Slot</th><th>Item</th><th>Source</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.slot}-${index}`}><td>{row.slot}</td><td>{label(row.item)}</td><td><HtmlContent html={row.source ?? ""} /></td></tr>)}</tbody></table></section>; }
