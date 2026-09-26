export type ParagraphBlockProps = {
  id?: string;
  text?: string;
  align?: "left" | "center" | "right";
  className?: string;
};

export default function ParagraphBlock({
  id,
  text = "Paragraph text",
  align = "left",
  className = "",
}: ParagraphBlockProps) {
  return (
    <section id={id}>
      <p
        className={`whitespace-pre-wrap ${className}`.trim()}
        style={{ textAlign: align }}
      >
        {text}
      </p>
    </section>
  );
}
