
export type ConsumableReference = { id?: string | number; name?: string } | string | number;
export type ConsumableRow = { type: string; best?: ConsumableReference; alt?: ConsumableReference };
export type ConsumablesTableBlockProps = { id?: string; title?: string; rows?: ConsumableRow[] };
const label = (value?: ConsumableReference) => typeof value === "object" ? value.name ?? value.id ?? "--" : value ?? "--";
export default function ConsumablesTableBlock({ id, title = "Best Consumables", rows = [] }: ConsumablesTableBlockProps) { return <section id={id} className="consumables-table"><h3 className="text-left">{title}</h3><table><thead><tr><th>Type</th><th>Best</th><th>Alternative</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.type}-${index}`}><td>{row.type}</td><td>{label(row.best)}</td><td>{label(row.alt)}</td></tr>)}</tbody></table></section>; }
