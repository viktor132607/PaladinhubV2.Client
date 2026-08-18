
"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@/router/nextCompat";

export type FieldOption = { value: string; label: string };
export type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "tel";
  placeholder?: string;
  options?: FieldOption[];
  defaultValue?: string | number | boolean;
  help?: string;
};

export type FormScaffoldProps = {
  title: string;
  description?: string;
  fields: FieldSpec[];
  submitLabel?: string;
  children?: ReactNode;
  backHref?: string;
};

export function FormScaffold({ title, description, fields, submitLabel = "Save", children, backHref }: FormScaffoldProps) {
  const initialValues = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? (field.type === "checkbox" ? false : "")])), [fields]);
  const [values, setValues] = useState<Record<string, string | number | boolean>>(initialValues);
  const [saved, setSaved] = useState(false);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        {backHref ? <Link to={backHref} className="mb-4 inline-block text-sm text-primary-400">← Back</Link> : undefined}
        <h1 className="text-3xl font-bold">{title}</h1>
        {description ? <p className="mt-2 text-slate-400">{description}</p> : undefined}
        <form className="mt-8 space-y-5" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
          {fields.map((field) => {
            const value = values[field.name];
            if (field.type === "checkbox") {
              return <label key={field.name} className="flex items-start gap-3 rounded-lg border border-slate-700 p-4"><input type="checkbox" checked={Boolean(value)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))} className="mt-1 h-4 w-4" /><span><span className="block font-medium">{field.label}</span>{field.help ? <span className="mt-1 block text-sm text-slate-400">{field.help}</span> : undefined}</span></label>;
            }
            return <label key={field.name} className="block"><span className="mb-2 block text-sm font-medium">{field.label}</span>{field.type === "textarea" ? <textarea value={String(value)} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} rows={5} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" /> : field.type === "select" ? <select value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type ?? "text"} value={String(value)} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.name]: field.type === "number" ? Number(event.target.value) : event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />}{field.help ? <span className="mt-1 block text-sm text-slate-400">{field.help}</span> : undefined}</label>;
          })}
          {children}
          <div className="flex flex-wrap items-center gap-3"><button type="submit" className="rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-500">{submitLabel}</button>{saved ? <span className="text-sm text-emerald-400">Saved locally. API submission will be connected in the endpoint step.</span> : undefined}</div>
        </form>
      </section>
    </main>
  );
}

export type TableColumn = { key: string; label: string };
export type TableScaffoldProps = { title: string; description?: string; columns: TableColumn[]; rows?: Record<string, ReactNode>[]; actionHref?: string; actionLabel?: string };
export function TableScaffold({ title, description, columns, rows = [], actionHref, actionLabel = "Create" }: TableScaffoldProps) {
  return <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100"><section className="mx-auto max-w-7xl"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">{title}</h1>{description ? <p className="mt-2 text-slate-400">{description}</p> : undefined}</div>{actionHref ? <Link to={actionHref} className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white">{actionLabel}</Link> : undefined}</div><div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900"><table className="min-w-full"><thead className="bg-slate-800"><tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 text-left text-sm">{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index} className="border-t border-slate-800">{columns.map((column) => <td key={column.key} className="px-4 py-3 text-sm text-slate-300">{row[column.key] ?? "—"}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">No records loaded. Data will appear after the API endpoints are connected.</td></tr>}</tbody></table></div></section></main>;
}

export type StatusScaffoldProps = { title: string; message: string; tone?: "success" | "error" | "info"; primaryHref?: string; primaryLabel?: string };
export function StatusScaffold({ title, message, tone = "info", primaryHref = "/", primaryLabel = "Continue" }: StatusScaffoldProps) {
  const toneClass = tone === "success" ? "border-emerald-500/40 bg-emerald-500/10" : tone === "error" ? "border-red-500/40 bg-red-500/10" : "border-blue-500/40 bg-blue-500/10";
  return <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-10 text-slate-100"><section className={`w-full max-w-xl rounded-2xl border p-8 text-center ${toneClass}`}><h1 className="text-3xl font-bold">{title}</h1><p className="mt-4 text-slate-300">{message}</p><Link to={primaryHref} className="mt-6 inline-flex rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white">{primaryLabel}</Link></section></main>;
}

export type CardAction = { title: string; description: string; href: string };
export function ActionCardsScaffold({ title, description, actions }: { title: string; description?: string; actions: CardAction[] }) {
  return <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100"><section className="mx-auto max-w-5xl"><h1 className="text-3xl font-bold">{title}</h1>{description ? <p className="mt-2 text-slate-400">{description}</p> : undefined}<div className="mt-8 grid gap-4 md:grid-cols-2">{actions.map((action) => <Link key={action.href} to={action.href} className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-primary-500"><h2 className="font-semibold">{action.title}</h2><p className="mt-2 text-sm text-slate-400">{action.description}</p></Link>)}</div></section></main>;
}
