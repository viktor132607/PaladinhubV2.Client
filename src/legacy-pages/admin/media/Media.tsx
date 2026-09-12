"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminRequest } from "@/lib/admin-categories";
import { fetchBackend, readApiJson } from "@/config/api";
import { spellIconSource } from "@/lib/spell-icons";

type MediaEntry = { id: string; name: string; altText: string; description: string; icon: string; size: number; contentType: string; isArchived: boolean; isDeleted: boolean; version: number; usageCount: number };
type Catalog = { media: MediaEntry[]; page: number; pages: number; total: number };
type Snapshot = { Name: string; AltText: string; Description: string; IsArchived: boolean; IsDeleted: boolean };
type Revision = { id: string; version: number; action: string; actor: string; createdAtUtc: string; snapshot: string };
const empty = { name: "", altText: "", description: "", isArchived: false };

export default function Media() {
  const [catalog, setCatalog] = useState<Catalog>({ media: [], page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("active"); const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MediaEntry | null>(null); const [draft, setDraft] = useState(empty);
  const [history, setHistory] = useState<Revision[]>([]); const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false); const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const choose = (item: MediaEntry | null) => { setSelected(item); setDraft(item ? { name: item.name, altText: item.altText, description: item.description, isArchived: item.isArchived } : empty); setError(""); setNotice(""); };
  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    const timer = setTimeout(() => {
      void adminRequest<Catalog>(`/Admin/api/media?${new URLSearchParams({ search, status, page: String(page) })}`, "GET", undefined, controller.signal)
        .then(data => { if (!controller.signal.aborted) { setCatalog(data); setError(""); } })
        .catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, status, page, refresh]);
  useEffect(() => {
    setHistory([]); if (!selected) return;
    const controller = new AbortController();
    void adminRequest<Revision[]>(`/Admin/api/media/${selected.id}/history`, "GET", undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setHistory(data); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [selected, refresh]);
  async function mutate(path: string, method: string, body?: unknown) {
    if (busyRef.current) return; busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try { await adminRequest(path, method, body); choose(null); setRefresh(n => n + 1); setNotice("Image saved. History is preserved."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save image."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function upload(file: File) {
    if (busyRef.current) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) { setError("Choose PNG, JPEG, GIF or WebP up to 5 MB."); return; }
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const csrf = await adminRequest<{ token: string }>("/api/auth/csrf");
      if (!csrf.token) throw new Error("The server did not return a CSRF token.");
      const form = new FormData(); form.append("file", file);
      await readApiJson(await fetchBackend("/Admin/api/spells/icons", { method: "POST", headers: { "X-CSRF-TOKEN": csrf.token }, body: form }));
      choose(null); setPage(1); setSearch(""); setStatus("active"); setRefresh(n => n + 1); setNotice("Image uploaded. Select it to edit its details.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not upload image."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (selected) void mutate(`/Admin/api/media/${selected.id}`, "PUT", { ...draft, version: selected.version }); }
  return <section onPaste={event => { const file = Array.from(event.clipboardData.items).find(item => item.type.startsWith("image/"))?.getAsFile(); if (file) { event.preventDefault(); void upload(file); } }}>
    <h2>Media library</h2>
    {error ? <p className="alert alert-danger" role="alert">{error}</p> : null}
    {notice ? <p className="alert alert-success" role="status">{notice}</p> : null}
    <div className="border rounded p-3 mb-3" tabIndex={0} aria-label="Paste an image here">
      <label className="form-label" htmlFor="media-upload">Upload image</label>
      <input id="media-upload" type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="form-control" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
      <p className="mt-2 mb-0">PNG, JPEG, GIF or WebP, up to 5 MB. You can also paste a copied image here.</p>
    </div>
    <div className="d-flex flex-wrap gap-2 mb-3">
      <input type="search" className="form-control" style={{ flex: "1 1 180px", minWidth: 0 }} aria-label="Search media" placeholder="Search name, alt text or description" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      <select className="form-select" style={{ flex: "1 1 140px", minWidth: 0 }} aria-label="Media status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="active">Active</option><option value="archived">Archived</option><option value="deleted">Deleted</option><option value="all">All</option></select>
      <button className="btn btn-secondary" disabled={busy || loading} onClick={() => { choose(null); setRefresh(n => n + 1); }}>Refresh</button>
    </div>
    {busy ? <p role="status">Saving image…</p> : null}
    <div className="row g-3">
      <div className="col-12 col-xl-7" style={{ minWidth: 0 }}>
        {loading ? <p>Loading media…</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {catalog.media.map(item => <button key={item.id} type="button" className="btn btn-dark border text-start p-3" disabled={busy} aria-pressed={selected?.id === item.id} onClick={() => choose(item)} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <img src={spellIconSource(item.icon)} alt={item.altText} loading="lazy" style={{ width: "100%", height: 100, objectFit: "contain" }} />
            <strong className="d-block mt-2">{item.name}</strong><span className="d-block">{Math.ceil(item.size / 1024)} KB · {item.usageCount} uses</span><span>{item.isDeleted ? "Deleted" : item.isArchived ? "Archived" : "Active"}</span>
          </button>)}
          {!catalog.media.length ? <p>No matching images.</p> : null}
        </div>}
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3"><button className="btn btn-secondary" disabled={loading || catalog.page <= 1} onClick={() => setPage(catalog.page - 1)}>Previous</button><span>{catalog.page} / {catalog.pages} · {catalog.total} images</span><button className="btn btn-secondary" disabled={loading || catalog.page >= catalog.pages} onClick={() => setPage(catalog.page + 1)}>Next</button></div>
      </div>
      <div className="col-12 col-xl-5" style={{ minWidth: 0 }}>
        {selected ? <>
          <h3>{selected.isDeleted ? "Deleted image" : "Edit image"}</h3>
          <label htmlFor="media-url" className="form-label">Image URL</label>
          <input id="media-url" className="form-control mb-2" value={spellIconSource(selected.icon)} readOnly onFocus={event => event.target.select()} />
          <button className="btn btn-secondary mb-3" onClick={() => { void navigator.clipboard?.writeText(spellIconSource(selected.icon)).then(() => setNotice("Image URL copied.")).catch(() => setError("Select the Image URL field and copy it.")); }}>Copy URL</button>
          <form onSubmit={submit}><fieldset disabled={busy || selected.isDeleted}>
            <label htmlFor="media-name" className="form-label">Name</label><input id="media-name" className="form-control mb-3" required maxLength={255} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            <label htmlFor="media-alt" className="form-label">Alt text</label><input id="media-alt" className="form-control mb-3" maxLength={500} value={draft.altText} onChange={e => setDraft({ ...draft, altText: e.target.value })} />
            <label htmlFor="media-description" className="form-label">Description</label><textarea id="media-description" className="form-control mb-3" rows={3} maxLength={2000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            <label className="d-flex align-items-center gap-2 mb-3"><input type="checkbox" checked={draft.isArchived} onChange={e => setDraft({ ...draft, isArchived: e.target.checked })} />Archived</label>
            <div className="d-flex flex-wrap gap-2"><button type="submit" className="btn btn-success">Save image</button><button type="button" className="btn btn-danger" disabled={selected.usageCount > 0} onClick={() => { if (window.confirm("Move this image to Deleted? You can restore it from history.")) void mutate(`/Admin/api/media/${selected.id}?version=${selected.version}`, "DELETE"); }}>Delete image</button></div>
          </fieldset></form>
          {selected.usageCount > 0 ? <p className="mt-2">This image is used by {selected.usageCount} records. Remove its references before deleting it, or archive it.</p> : null}
          <h3 className="mt-4">Change history</h3>
          {history.map(revision => { const snapshot = JSON.parse(revision.snapshot) as Snapshot; return <details className="border rounded p-2 mb-2" key={revision.id}>
            <summary>v{revision.version} · {revision.action} · {new Date(revision.createdAtUtc).toLocaleString()}</summary>
            <p className="mt-2" style={{ overflowWrap: "anywhere" }}>{snapshot.Name} · {revision.actor}</p><p>{snapshot.AltText}</p><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{snapshot.Description}</p>
            {!snapshot.IsDeleted ? <button className="btn btn-outline-primary" disabled={busy || revision.version === selected.version} onClick={() => { if (window.confirm(`Restore revision ${revision.version}?`)) void mutate(`/Admin/api/media/${selected.id}/restore`, "POST", { revisionId: revision.id, version: selected.version }); }}>Restore this revision</button> : null}
          </details>; })}
        </> : <p>Select an image to edit its details or view history.</p>}
      </div>
    </div>
  </section>;
}
