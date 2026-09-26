import { getAlignmentClass, type BlockAlignment } from "./alignment";

export type ParagraphBlockProps = {
  id?: string;
  text?: string;
  align?: BlockAlignment;
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
        className={`whitespace-pre-wrap ${className} ${getAlignmentClass(align)}`.trim()}
      >
        {text}
      </p>
    </section>
  );
}
