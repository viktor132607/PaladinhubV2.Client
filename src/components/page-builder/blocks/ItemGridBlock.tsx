
export type ItemGridEntry = { id?: string | number; name?: string; icon?: string };
export type ItemGridBlockProps = { id?: string; title?: string; items?: ItemGridEntry[]; columns?: number };
export default function ItemGridBlock({ id, title, items = [], columns = 4 }: ItemGridBlockProps) {
  return <section id={id} className={`item-grid cols-${columns}`}>{title ? <h3>{title}</h3> : undefined}<div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))` }}>{items.map((item, index) => <div key={item.id ?? `${item.name}-${index}`} className="cell rounded border border-slate-700 p-3">{item.icon ? <img src={item.icon} alt="" className="mb-2 h-10 w-10" /> : undefined}<span>{item.name ?? item.id ?? "Item"}</span></div>)}</div></section>;
}
