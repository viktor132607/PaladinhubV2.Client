"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminRequest, categoryPath, descendants, type Category } from "@/lib/admin-categories";

const endpoint = "/Admin/api/categories";
const empty = { name: "", description: "", parentId: "", sortOrder: "0", isArchived: false };
type Revision = { id: string; version: number; action: string; actor: string; snapshot: string; createdAtUtc: string };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [draft, setDraft] = useState(empty);
  const [history, setHistory] = useState<Revision[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    void adminRequest<Category[]>(endpoint, "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCategories(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    setHistory([]);
    if (!selected) { setHistoryLoading(false); return; }
    const controller = new AbortController(); setHistoryLoading(true);
    void adminRequest<Revision[]>(`${endpoint}/${selected.id}/history`, "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setHistory(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [selected]);

  const choose = (category: Category | null) => {
    setSelected(category); setError(""); setNotice("");
    setDraft(category ? { name: category.name, description: category.description, parentId: category.parentId?.toString() ?? "",
      sortOrder: String(category.sortOrder), isArchived: category.isArchived } : empty);
  };

  const mutate = async (path: string, method: string, body?: unknown) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await adminRequest<Category | null>(path, method, body);
      const updated = await adminRequest<Category[]>(endpoint);
      setCategories(updated);
      choose(result ? updated.find(category => category.id === result.id) ?? null : null);
      setNotice(method === "DELETE" ? "Category moved to Deleted. Its history is preserved." : "Category saved.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save category."); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const sortOrder = Number(draft.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) { setError("Order must be a whole number within the supported range."); return; }
    void mutate(selected ? `${endpoint}/${selected.id}` : endpoint, selected ? "PUT" : "POST", {
      ...draft, name: draft.name.trim(), parentId: draft.parentId ? Number(draft.parentId) : null, sortOrder, version: selected?.version ?? 0,
    });
  };
  const excluded = selected ? descendants(selected.id, categories) : new Set<number>();
  const visible = categories.filter(category => {
    const matchesStatus = status === "all" || (status === "deleted" ? category.isDeleted : !category.isDeleted && (status === "archived" ? category.isArchived : !category.isArchived));
    return matchesStatus && categoryPath(category.id, categories).toLowerCase().includes(search.trim().toLowerCase());
  });

  return <section>
    <h2>Categories &amp; subcategories</h2>
    {error ? <p role="alert" className="alert alert-danger">{error}</p> : null}
    {notice ? <p role="status" className="alert alert-success">{notice}</p> : null}
    <div className="d-flex flex-wrap gap-2 mb-3">
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => choose(null)}>New category</button>
      <button type="button" className="btn btn-secondary" disabled={busy || loading} onClick={() => { choose(null); setRefresh(value => value + 1); }}>Refresh</button>
    </div>
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <input type="search" className="form-control" style={{ flex: "1 1 180px", minWidth: 0 }} aria-label="Search categories" placeholder="Search categories…" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="form-select" style={{ flex: "1 1 140px", minWidth: 0 }} aria-label="Category status" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="active">Active</option><option value="archived">Archived</option><option value="deleted">Deleted</option><option value="all">All</option>
          </select>
        </div>
        {loading ? <p>Loading categories…</p> : <>
          <p>{visible.length} categories</p>
          <table className="table table-dark table-striped admin-record-table">
            <thead><tr><th>Category</th><th>Status</th><th>Records</th><th>Children</th><th>Actions</th></tr></thead>
            <tbody>{visible.map(category => <tr key={category.id}>
              <td data-label="Category" style={{ overflowWrap: "anywhere" }}>{categoryPath(category.id, categories)}</td>
              <td data-label="Status">{category.isDeleted ? "Deleted" : category.isArchived ? "Archived" : "Active"}</td>
              <td data-label="Records">{category.usageCount}</td><td data-label="Children">{category.childCount}</td>
              <td data-label="Actions"><button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => choose(category)}>{category.isDeleted ? "History / restore" : "Edit / history"}</button></td>
            </tr>)}</tbody>
          </table>
          {!visible.length ? <p>No categories match this filter.</p> : null}
        </>}
      </div>
      <div className="col-12 col-xl-5" style={{ minWidth: 0 }}>
        <h3>{selected ? `${selected.isDeleted ? "Deleted" : "Edit"} category #${selected.id}` : "New category"}</h3>
        <form onSubmit={submit}>
          <fieldset disabled={busy || selected?.isDeleted}>
            <label className="form-label" htmlFor="category-name">Name</label>
            <input id="category-name" className="form-control mb-3" required maxLength={100} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
            <label className="form-label" htmlFor="category-parent">Parent category</label>
            <select id="category-parent" className="form-select mb-3" value={draft.parentId} onChange={event => setDraft({ ...draft, parentId: event.target.value })}>
              <option value="">None — top-level category</option>
              {categories.filter(category => !category.isDeleted && !excluded.has(category.id) && (!category.isArchived || draft.isArchived)).map(category =>
                <option key={category.id} value={category.id}>{categoryPath(category.id, categories)}</option>)}
            </select>
            <label className="form-label" htmlFor="category-description">Description</label>
            <textarea id="category-description" className="form-control mb-3" rows={3} maxLength={2000} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
            <label className="form-label" htmlFor="category-order">Order</label>
            <input id="category-order" className="form-control mb-3" type="number" step={1} min={-2147483648} max={2147483647} required value={draft.sortOrder} onChange={event => setDraft({ ...draft, sortOrder: event.target.value })} />
            <label className="d-flex gap-2 align-items-center mb-3"><input type="checkbox" checked={draft.isArchived} onChange={event => setDraft({ ...draft, isArchived: event.target.checked })} />Archived</label>
            <div className="d-flex flex-wrap gap-2">
              <button type="submit" className="btn btn-success">{busy ? "Saving…" : selected ? "Save category" : "Create category"}</button>
              {selected ? <button type="button" className="btn btn-danger" disabled={selected.usageCount > 0 || selected.childCount > 0} onClick={() => {
                if (window.confirm(`Delete “${selected.name}”? You can restore it from history.`)) void mutate(`${endpoint}/${selected.id}?version=${selected.version}`, "DELETE");
              }}>Delete category</button> : null}
            </div>
          </fieldset>
        </form>
        {selected && !selected.isDeleted && (selected.usageCount > 0 || selected.childCount > 0) ? <p className="mt-2">Move assigned records and subcategories before deleting, or archive the category.</p> : null}
        {selected ? <section className="mt-4">
          <h3>Change history</h3>
          {historyLoading ? <p>Loading history…</p> : null}
          {history.map(revision => {
            const snapshot = JSON.parse(revision.snapshot) as { Name: string; Description: string; ParentId: number | null; SortOrder: number; IsArchived: boolean; IsDeleted: boolean };
            return <details className="border rounded p-2 mb-2" key={revision.id}>
              <summary>v{revision.version} · {revision.action} · {new Date(revision.createdAtUtc).toLocaleString()}</summary>
              <p className="mt-2" style={{ overflowWrap: "anywhere" }}>By: {revision.actor}</p>
              <p>{snapshot.Name} · {snapshot.ParentId ? categoryPath(snapshot.ParentId, categories) : "Top level"} · Order: {snapshot.SortOrder} · {snapshot.IsArchived ? "Archived" : "Active"}</p>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{snapshot.Description}</p>
              {!snapshot.IsDeleted ? <button type="button" className="btn btn-outline-primary" disabled={busy || revision.version === selected.version} onClick={() => {
                if (window.confirm(`Restore category to revision ${revision.version}?`)) void mutate(`${endpoint}/${selected.id}/restore`, "POST", { revisionId: revision.id, version: selected.version });
              }}>Restore this revision</button> : null}
            </details>;
          })}
          {!historyLoading && !history.length ? <p>No changes recorded.</p> : null}
        </section> : null}
      </div>
    </div>
  </section>;
}
