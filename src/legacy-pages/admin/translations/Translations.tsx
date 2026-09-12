"use client";
import { useEffect, useState } from "react";
import { adminRequest } from "@/lib/admin-categories";
import { sourceKeys } from "@/localization/content";

type Language = { id: string; code: string; name: string; resourcesJson: string; isArchived: boolean; isDeleted: boolean; version: number };
type Revision = { id: string; version: number; action: string; actor: string; createdAtUtc: string; snapshot: string };
const endpoint = "/Admin/api/languages";
const field = "min-w-0 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-base text-slate-100";
const button = "min-h-11 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 disabled:opacity-40";
export default function Translations() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selected, setSelected] = useState<Language | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [resources, setResources] = useState<Record<string,string>>({});
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("active");
  const [history, setHistory] = useState<Revision[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [navigationKeys, setNavigationKeys] = useState<string[]>([]);
  const dirty = selected ? selected.name !== name || selected.resourcesJson !== JSON.stringify(resources) : !!code || !!name || !!Object.keys(resources).length;
  const editable = !selected || (!selected.isArchived && !selected.isDeleted);
  const reload = () => adminRequest<Language[]>(endpoint).then(setLanguages);
  useEffect(() => {
    const controller = new AbortController();
    adminRequest<Language[]>(endpoint, "GET", undefined, controller.signal).then(setLanguages).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    adminRequest<{id:number;name:string}[]>("/api/navigation", "GET", undefined, controller.signal).then(rows => { if (Array.isArray(rows)) setNavigationKeys(rows.flatMap(r => [`navigation.${r.id}`,r.name])); }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function discard() { return !dirty || window.confirm("Discard unsaved translation changes?"); }
  function load(language: Language | null) {
    // Canonical JSON avoids treating seeded formatting as unsaved changes.
    const entries = JSON.parse(language?.resourcesJson ?? "{}");
    setSelected(language ? { ...language, resourcesJson: JSON.stringify(entries) } : null);
    setCode(language?.code ?? ""); setName(language?.name ?? ""); setResources(entries); setKey(""); setValue(""); setPage(0); setHistory([]); setNotice("");
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Operation failed."); } finally { setBusy(false); }
  }
  async function select(language: Language) {
    if (!discard()) return;
    load(language); await run(async () => setHistory(await adminRequest<Revision[]>(`${endpoint}/${language.id}/history`)));
  }
  async function saved(language: Language) {
    await reload(); load(language); setHistory(await adminRequest<Revision[]>(`${endpoint}/${language.id}/history`));
    window.dispatchEvent(new Event("localization-updated")); setNotice("Language and translations saved.");
  }
  async function save() {
    await run(async () => saved(await adminRequest<Language>(`${endpoint}${selected ? `/${selected.id}` : ""}`, selected ? "PUT" : "POST", { code, name, translations: resources, version: selected?.version ?? 0 })));
  }
  async function change(action: string, revisionId?: string) {
    if (!selected || !discard() || !window.confirm(`${action} this language? Missing translations use English.`)) return;
    await run(async () => saved(await adminRequest<Language>(`${endpoint}/${selected.id}/actions`, "POST", { action, revisionId, version: selected.version })));
  }
  const entries = Object.entries(resources).filter(([key,value]) => `${key} ${value}`.toLowerCase().includes(query.toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(entries.length / 50) - 1));
  return <main className="min-w-0 space-y-5 p-3 text-slate-100 sm:p-6">
    <h1 className="text-2xl text-amber-400">Languages & translations</h1>
    <p className="text-sm text-slate-400">Manage language names and text keys. English is the fallback. Use an existing English label as the key, or navigation.ID for a specific menu link. Page Builder titles, paragraphs, captions and other text fields use their original text as keys.</p>
    {error && <p role="alert" className="break-words text-red-300">{error}</p>}
    {notice && <p role="status" className="text-green-300">{notice}</p>}
    <fieldset disabled={busy} className="min-w-0 space-y-5">
      <div className="flex flex-wrap gap-3">
        <button className={button} type="button" onClick={() => { if (discard()) load(null); }}>New language</button>
        <button className={button} type="button" onClick={() => { if (discard()) void run(async () => { await reload(); load(null); }); }}>Reload languages</button>
        <label>Language status<select className={field} value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="deleted">Deleted</option><option value="all">All</option></select></label>
      </div>
      <div className="flex flex-wrap gap-2">{languages.filter(l => status === "all" || (status === "deleted" ? l.isDeleted : status === "archived" ? !l.isDeleted && l.isArchived : !l.isDeleted && !l.isArchived)).map(l => <button type="button" className={`${button} max-w-full break-words ${selected?.id === l.id ? "border-amber-400" : ""}`} aria-pressed={selected?.id === l.id} key={l.id} onClick={() => void select(l)}>{l.name} ({l.code}) · v{l.version}{l.isDeleted ? " · Deleted" : l.isArchived ? " · Archived" : ""}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Language code<input className={field} value={code} maxLength={35} placeholder="bg, en, de, pt-BR" disabled={!!selected} onChange={e => setCode(e.target.value)} /></label>
        <label>Language name<input className={field} value={name} maxLength={100} disabled={!editable} onChange={e => setName(e.target.value)} /></label>
      </div>
      <label className="block">Search translations<input className={field} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label>
      <p className="text-sm text-slate-400">{Object.keys(resources).length} translations · {entries.length} shown{dirty ? " · Unsaved changes" : ""}. Removing a key restores the English fallback after saving.</p>
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">{entries.slice(currentPage * 50, (currentPage + 1) * 50).map(([entryKey,entryValue]) => <div key={entryKey} className="min-w-0 rounded border border-slate-700 p-3">
        <label className="block"><span className="block break-words font-medium">{entryKey}</span><textarea aria-label={`Translation: ${entryKey}`} className={field} rows={2} maxLength={20000} value={entryValue} disabled={!editable} onChange={e => setResources(current => ({ ...current, [entryKey]: e.target.value }))} /></label>
        <button type="button" className={`${button} mt-2`} aria-label={`Remove key: ${entryKey}`} disabled={!editable} onClick={() => setResources(current => Object.fromEntries(Object.entries(current).filter(([k]) => k !== entryKey)))}>Remove key</button>
      </div>)}</div>
      {entries.length > 50 && <div className="flex flex-wrap items-center gap-2"><button type="button" className={button} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous keys</button><span>Page {currentPage + 1} of {Math.ceil(entries.length / 50)}</span><button type="button" className={button} disabled={(currentPage + 1) * 50 >= entries.length} onClick={() => setPage(currentPage + 1)}>Next keys</button></div>}
      {editable && <div className="space-y-3 rounded border border-slate-700 p-3">
        <label className="block">New translation key<input className={field} list="translation-keys" value={key} maxLength={500} onChange={e => setKey(e.target.value)} /><datalist id="translation-keys">{[...new Set([...sourceKeys,...navigationKeys])].map(k => <option key={k} value={k} />)}</datalist></label>
        <label className="block">New translation value<textarea className={field} value={value} maxLength={20000} onChange={e => setValue(e.target.value)} /></label>
        <button type="button" className={button} disabled={!key.trim() || Object.prototype.hasOwnProperty.call(resources,key)} onClick={() => { setResources(current => ({ ...current,[key]:value })); setKey(""); setValue(""); }}>Add translation</button>
      </div>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={!editable || !code.trim() || !name.trim()} onClick={() => void save()}>Save language & translations</button>
        {selected && !selected.isDeleted && <><button type="button" className={button} disabled={selected.code === "en"} onClick={() => void change(selected.isArchived ? "unarchive" : "archive")}>{selected.isArchived ? "Unarchive" : "Archive"}</button><button type="button" className={button} disabled={selected.code === "en"} onClick={() => void change("delete")}>Delete language</button></>}
      </div>
      {selected && <section className="space-y-2"><h2 className="text-xl">Translation history</h2>{history.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700 p-3"><span className="min-w-0 break-words">v{r.version} · {r.action} · {r.actor} · {new Date(r.createdAtUtc).toLocaleString()}</span><button type="button" className={button} disabled={JSON.parse(r.snapshot).IsDeleted} onClick={() => void change("restore",r.id)}>Restore v{r.version}</button></div>)}</section>}
    </fieldset>
  </main>;
}
