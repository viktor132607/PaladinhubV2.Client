"use client";

import { useEffect, useState } from "react";
import { copyTemplate } from "@/lib/template-copy";
import { adminRequest } from "@/lib/admin-categories";

type Template = { id: string; name: string; description: string; jsonLayout: string; version: number; isArchived: boolean; isDeleted: boolean };
type Revision = { id: string; version: number; action: string; actor: string; createdAtUtc: string; snapshot: string };
const endpoint = "/Admin/api/content-templates";
const field = "min-w-0 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-base";
const button = "min-h-11 rounded border border-slate-600 bg-slate-800 px-3 py-2 disabled:opacity-40";

export default function TemplateLibrary({ content, onInsert, kind = "block" }: {
  content: string; onInsert: (json: string) => void; kind?: string;
}) {
  const [rows, setRows] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [history, setHistory] = useState<Revision[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState("all");
  const blocks: { type?: string }[] = (() => { try { const parsed: unknown = JSON.parse(content); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();
  const currentContent = source === "all" ? content : JSON.stringify(blocks.slice(Number(source), Number(source) + 1));
  const reload = () => adminRequest<Template[]>(`${endpoint}?kind=${kind}`).then(setRows);
  useEffect(() => {
    const controller = new AbortController();
    adminRequest<Template[]>(`${endpoint}?kind=${kind}`, "GET", undefined, controller.signal).then(setRows)
      .catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Operation failed."); }
    finally { setBusy(false); }
  }
  async function select(row: Template) {
    setSelected(row); setName(row.name); setDescription(row.description); setHistory([]);
    await run(async () => { setHistory(await adminRequest<Revision[]>(`${endpoint}/${row.id}/history`)); });
  }
  async function save(mode: "create" | "metadata" | "content") {
    await run(async () => {
      const update = mode !== "create" && selected;
      const saved = await adminRequest<Template>(`${endpoint}${update ? `/${selected!.id}` : ""}?kind=${kind}`, update ? "PUT" : "POST", {
        name, description, jsonLayout: mode === "metadata" ? selected!.jsonLayout : currentContent, version: update ? selected!.version : 0,
      });
      await reload(); setSelected(saved); setName(saved.name); setDescription(saved.description);
      setHistory(await adminRequest<Revision[]>(`${endpoint}/${saved.id}/history`)); setNotice("Template saved.");
    });
  }
  async function change(action: string, revisionId?: string) {
    if (!selected || !window.confirm(`${action === "delete" ? "Delete this template? Inserted copies remain unchanged." : `${action} this template?`}`)) return;
    await run(async () => {
      const saved = await adminRequest<Template>(`${endpoint}/${selected.id}/actions`, "POST", { action, revisionId, version: selected.version });
      await reload(); setSelected(saved); setName(saved.name); setDescription(saved.description);
      setHistory(await adminRequest<Revision[]>(`${endpoint}/${saved.id}/history`)); setNotice("Template updated.");
    });
  }
  const active = selected && !selected.isArchived && !selected.isDeleted;
  return <details className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:p-6">
    <summary className="min-h-11 cursor-pointer text-xl font-semibold">{kind === "block" ? "Reusable blocks" : "Talent tree templates"}</summary>
    <p className="my-3 text-sm text-slate-400">Insert an independent copy, edit it in the builder and save the page. Template changes do not change existing pages.</p>
    {error && <p role="alert" className="break-words text-red-300">{error}</p>}
    {notice && <p role="status" className="text-green-300">{notice}</p>}
    <fieldset disabled={busy || loading} className="min-w-0 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Search templates<input className={field} value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label>Template status<select className={field} value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="deleted">Deleted</option><option value="all">All</option></select></label>
      </div>
      <button type="button" className={button} onClick={() => void run(async () => { await reload(); setSelected(null); setHistory([]); })}>Reload library</button>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {loading ? <p>Loading templates…</p> : rows.filter(t => (status === "all" || (status === "deleted" ? t.isDeleted : status === "archived" ? t.isArchived && !t.isDeleted : !t.isDeleted && !t.isArchived)) && `${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase())).map(t =>
          <button type="button" key={t.id} aria-pressed={selected?.id === t.id} className={`${button} block w-full break-words text-left ${selected?.id === t.id ? "border-amber-400" : ""}`} onClick={() => void select(t)}>{t.name} <span className="text-sm text-slate-400">v{t.version}{t.isDeleted ? " · Deleted" : t.isArchived ? " · Archived" : ""}</span></button>)}
        {!loading && !rows.length && <p className="text-slate-400">No templates yet. Save content from the builder below.</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Template name<input className={field} maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Template description<input className={field} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} /></label>
      </div>
      <label className="block">Content to save<select className={field} value={source} onChange={e => setSource(e.target.value)}><option value="all">All current blocks ({blocks.length})</option>{kind === "block" && blocks.map((block, index) => <option key={index} value={index}>Block {index + 1}: {block.type}</option>)}</select></label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={!name.trim() || !blocks.length} onClick={() => void save("create")}>Save as new template</button>
        {selected && <>
          <button type="button" className={button} disabled={!active} onClick={() => { onInsert(copyTemplate(selected.jsonLayout)); setNotice("Copy loaded in the builder. Save the page to publish your changes."); }}>Insert copy</button>
          <button type="button" className={button} disabled={!active || !name.trim()} onClick={() => void save("metadata")}>Save name & description</button>
          <button type="button" className={button} disabled={!active || !name.trim() || !blocks.length} onClick={() => { if (window.confirm("Replace template content with the selected builder content?")) void save("content"); }}>Replace template content</button>
          {!selected.isDeleted && <><button type="button" className={button} onClick={() => void change(selected.isArchived ? "unarchive" : "archive")}>{selected.isArchived ? "Unarchive" : "Archive"}</button><button type="button" className={button} onClick={() => void change("delete")}>Delete template</button></>}
        </>}
      </div>
      {selected && <div className="space-y-2"><h3 className="text-lg">Template history</h3>{history.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700 p-3"><span className="min-w-0 break-words">v{r.version} · {r.action} · {r.actor} · {new Date(r.createdAtUtc).toLocaleString()}</span><button type="button" className={button} disabled={JSON.parse(r.snapshot).IsDeleted} onClick={() => void change("restore", r.id)}>Restore v{r.version}</button></div>)}</div>}
    </fieldset>
  </details>;
}
