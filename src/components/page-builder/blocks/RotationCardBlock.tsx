
export type RotationEntry = { id?: string | number; name?: string; icon?: string };
export type RotationCardBlockProps = { id?: string; title?: string; sequence?: RotationEntry[] };
export default function RotationCardBlock({ id, title = "Rotation", sequence = [] }: RotationCardBlockProps) {
  return <section id={id} className="rotation-card"><h3>{title}</h3><div className="rotation-seq flex flex-wrap gap-2">{sequence.map((entry, index) => <span key={entry.id ?? `${entry.name}-${index}`} className="spell-chip rounded-full border border-slate-700 px-3 py-1">{entry.icon ? <img src={entry.icon} alt="" className="mr-2 inline h-6 w-6 rounded" /> : undefined}{entry.name ?? entry.id ?? "Spell"}</span>)}</div></section>;
}
