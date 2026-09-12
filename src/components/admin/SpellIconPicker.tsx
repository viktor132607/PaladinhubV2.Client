"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { spellIconSource, itemIconSource } from "@/lib/spell-icons";

type IconEntry = { name: string; icon: string; kind: string };
type Catalog = { icons: IconEntry[]; page: number; pages: number; total: number };
const acceptedTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export default function SpellIconPicker({ value, onChange, disabled = false, onBusyChange, label = "Icon", kind = "spell" }: {
  label?: string;
  kind?: "spell" | "item";
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const alive = useRef(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<Catalog>({ icons: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [failedSource, setFailedSource] = useState("");
  const source = kind === "item" ? itemIconSource(value) : spellIconSource(value);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ search, page: String(page), pageSize: "64" });
        const response = await fetchBackend(`/Admin/api/spells/icons?${query}`, { signal: controller.signal, cache: "no-store" });
        const result = await readApiJson<Catalog>(response);
        if (!controller.signal.aborted) { setCatalog(result); setError(""); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load icons.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, search, page, revision]);

  async function upload(file: File) {
    if (disabled || busyRef.current) return;
    if (!acceptedTypes.has(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      setError("Choose a PNG, JPEG, GIF or WebP image up to 5 MB.");
      return;
    }
    busyRef.current = true;
    setUploading(true);
    onBusyChange?.(true);
    setError("");
    try {
      const csrfResponse = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
      const csrf = await readApiJson<{ token?: string }>(csrfResponse);
      if (!csrf.token) throw new Error("The server did not return a CSRF token.");
      const form = new FormData();
      form.append("file", file);
      const response = await fetchBackend("/Admin/api/spells/icons", { method: "POST", headers: { "X-CSRF-TOKEN": csrf.token }, body: form });
      const result = await readApiJson<{ icon: string }>(response);
      if (alive.current) { onChange(result.icon); setFailedSource(""); setRevision((current) => current + 1); }
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : "Could not upload the image.");
    } finally {
      busyRef.current = false;
      if (alive.current) { setUploading(false); onBusyChange?.(false); }
    }
  }

  function paste(event: ClipboardEvent<HTMLDivElement>) {
    if (disabled || uploading) return;
    const file = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"))?.getAsFile();
    if (file) { event.preventDefault(); void upload(file); }
  }

  async function pasteClipboard() {
    if (disabled || busyRef.current) return;
    try {
      if (!navigator.clipboard?.read) throw new Error("Click the icon field and paste with Ctrl+V, Cmd+V or the device Paste menu.");
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((type) => acceptedTypes.has(type));
        if (type) {
          const blob = await item.getType(type);
          await upload(new File([blob], `pasted-icon.${type.split("/")[1]}`, { type }));
          return;
        }
      }
      const textItem = items.find((item) => item.types.includes("text/plain"));
      const text = textItem ? (await (await textItem.getType("text/plain")).text()).trim() : "";
      if (!text) throw new Error("Copy an image or image URL first.");
      if (!/^https?:\/\//i.test(text) && !text.startsWith("/")) throw new Error("Paste an image or an image URL.");
      onChange(text);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Paste into the icon field using Ctrl+V, Cmd+V or the device Paste menu.");
    }
  }

  return (
    <div className="spell-icon-picker min-w-0 space-y-2" onPaste={paste}>
      <label htmlFor={`${id}-value`} className="block">{label}</label>
      <input id={`${id}-value`} className="form-control w-full min-w-0 rounded border border-slate-600 px-3 py-2" value={value} maxLength={2048} placeholder="Image URL or existing filename" onChange={(event) => onChange(event.target.value)} disabled={disabled || uploading} aria-describedby={`${id}-help`} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" aria-expanded={open} aria-controls={`${id}-browser`} disabled={disabled || uploading} onClick={() => setOpen((current) => !current)}>{open ? "Close database" : "Browse database"}</button>
        <button type="button" className="btn btn-secondary" disabled={disabled || uploading} onClick={() => void pasteClipboard()}>Paste image / URL</button>
        <button type="button" className="btn btn-secondary" disabled={disabled || uploading} onClick={() => fileInput.current?.click()}>Upload image</button>
        <a className="btn btn-outline-secondary" href="/Admin/Media" target="_blank" rel="noopener noreferrer">Manage media</a>
        {value ? <button type="button" className="btn btn-outline-warning" disabled={disabled || uploading} onClick={() => onChange("")}>Clear icon</button> : null}
      </div>
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" aria-label={`Upload ${label.toLowerCase()}`} disabled={disabled || uploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
      <p id={`${id}-help`} className="text-sm text-slate-400">Choose from the database, paste an image or URL, or upload a file (up to 5 MB). Save the record to apply it.</p>
      {uploading ? <p role="status">Uploading image…</p> : null}
      {error ? <p role="alert" className="text-danger">{error}</p> : null}
      {source && source !== failedSource ? <img src={source} alt={`Selected ${label.toLowerCase()}`} className="h-16 w-16 rounded border border-slate-600 object-contain" onError={() => setFailedSource(source)} /> : source ? <p className="text-sm text-slate-400">Image unavailable. Choose another icon or upload the file.</p> : null}
      {open ? (
        <section id={`${id}-browser`} aria-label="Spell icon database" className="rounded border border-slate-600 p-3">
          <label htmlFor={`${id}-search`} className="block mb-2">Search spell, talent or filename</label>
          <input id={`${id}-search`} className="form-control mb-3 w-full" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} disabled={disabled || uploading} />
          {loading ? <p role="status">Loading icons…</p> : (
            <div className="max-h-[45dvh] overflow-y-auto">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                {catalog.icons.map((entry) => <button type="button" key={entry.icon} title={entry.name} aria-label={`Select icon: ${entry.name}`} aria-pressed={value === entry.icon} disabled={disabled || uploading} className={`flex min-w-0 flex-col items-center gap-2 rounded border p-2 text-center ${value === entry.icon ? "border-amber-400 bg-amber-400/10" : "border-slate-600 bg-slate-900"}`} onClick={() => { onChange(entry.icon); setOpen(false); setFailedSource(""); }}>
                  <img src={spellIconSource(entry.icon)} alt="" loading="lazy" className="h-12 w-12 object-contain" />
                  <span className="w-full break-words text-xs">{entry.name}</span>
                </button>)}
              </div>
              {!catalog.icons.length ? <p>No matching icons.</p> : null}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-secondary" disabled={disabled || uploading || loading || catalog.page <= 1} onClick={() => setPage(catalog.page - 1)}>Previous</button>
            <span>{catalog.page} / {catalog.pages} · {catalog.total} icons</span>
            <button type="button" className="btn btn-secondary" disabled={disabled || uploading || loading || catalog.page >= catalog.pages} onClick={() => setPage(catalog.page + 1)}>Next</button>
            <button type="button" className="btn btn-secondary" disabled={loading || uploading || disabled} onClick={() => setRevision((current) => current + 1)}>Refresh</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
