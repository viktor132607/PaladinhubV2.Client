
import { HtmlContent } from "@/components/migration/MigratedView";

export type CalloutBlockProps = { id?: string; variant?: "info" | "tip" | "warn" | "success"; text?: string };
export default function CalloutBlock({ id, variant = "info", text = "" }: CalloutBlockProps) {
  return <section id={id} className={`callout callout-${variant}`}><HtmlContent html={text} /></section>;
}
