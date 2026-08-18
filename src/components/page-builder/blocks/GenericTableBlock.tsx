
import { HtmlContent } from "@/components/migration/MigratedView";
export type GenericColumn = { key: string; title?: string; kind?: "text" | "html" | "item" | "spell" };
export type GenericRow = Record<string, unknown>;
export type GenericTableBlockProps = { id?: string; title?: string; columns?: GenericColumn[]; rows?: GenericRow[] };
export default function GenericTableBlock({ id, title, columns = [], rows = [] }: GenericTableBlockProps) { return <section id={id} className="table-generic">{title ? <h3>{title}</h3> : undefined}<table><thead><tr>{columns.map((column) => <th key={column.key}>{column.title ?? column.key}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{columns.map((column) => { const value = row[column.key]; const text = value == null ? "" : String(value); return <td key={column.key}>{column.kind === "html" ? <HtmlContent html={text} /> : text}</td>; })}</tr>)}</tbody></table></section>; }
