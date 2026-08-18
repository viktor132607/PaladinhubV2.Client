
export type SpellTooltipProps = { name?: string; description?: string; icon?: string };
export default function SpellTooltip({ name = "Spell", description = "", icon }: SpellTooltipProps) { return <div className="max-w-xs rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 shadow-xl">{icon ? <img src={icon} alt="" className="mb-2 h-10 w-10 rounded" /> : undefined}<strong className="block">{name}</strong>{description ? <p className="mt-1 text-slate-300">{description}</p> : undefined}</div>; }
