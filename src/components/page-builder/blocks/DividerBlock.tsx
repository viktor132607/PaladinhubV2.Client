
export type DividerBlockProps = { id?: string; className?: string };
export default function DividerBlock({ id, className = "my-4" }: DividerBlockProps) { return <section id={id} className={className}><hr /></section>; }
