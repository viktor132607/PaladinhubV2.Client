"use client";
import { useEffect, useId, useState } from "react";
import { adminRequest, type Category } from "@/lib/admin-categories";

export default function TagPicker({ value, onChange, disabled = false }: {
  value: number[]; onChange: (ids: number[]) => void; disabled?: boolean;
}) {
  const id = useId();
  const [tags, setTags] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    void adminRequest<Category[]>("/Admin/api/tags", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setTags(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const available = tags.filter(tag => !tag.isDeleted && (!tag.isArchived || value.includes(tag.id)) && tag.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <fieldset className="mb-3" disabled={disabled || loading} style={{ minWidth: 0 }}>
    <legend className="form-label">Tags ({value.length}/100)</legend>
    <div className="d-flex flex-wrap gap-2 mb-2">
      {value.map(tagId => <button type="button" className="btn btn-sm btn-secondary" key={tagId} onClick={() => onChange(value.filter(current => current !== tagId))} aria-label={`Remove tag ${tags.find(tag => tag.id === tagId)?.name ?? tagId}`}>
        {tags.find(tag => tag.id === tagId)?.name ?? `Tag #${tagId}`} ×
      </button>)}
    </div>
    <label htmlFor={id} className="form-label">Search available tags</label>
    <input id={id} className="form-control mb-2" type="search" value={search} onChange={event => setSearch(event.target.value)} />
    <div className="border rounded p-2" style={{ maxHeight: 240, overflowY: "auto" }}>
      {loading ? <p>Loading tags…</p> : available.length ? available.map(tag => <label key={tag.id} className="d-flex align-items-center gap-2 py-2" style={{ overflowWrap: "anywhere" }}>
        <input type="checkbox" checked={value.includes(tag.id)} disabled={!value.includes(tag.id) && value.length >= 100} onChange={event => onChange(event.target.checked ? [...value, tag.id] : value.filter(current => current !== tag.id))} />
        {tag.name}{tag.isArchived ? " (archived)" : ""}
      </label>) : <p>No matching tags.</p>}
    </div>
    <div className="d-flex flex-wrap gap-2 mt-2">
      <a className="btn btn-outline-secondary" href="/Admin/Tags" target="_blank" rel="noopener noreferrer">Manage tags</a>
      <button type="button" className="btn btn-outline-secondary" onClick={() => setRefresh(n => n + 1)}>Refresh tags</button>
    </div>
    {error ? <p role="alert" className="text-danger">{error}</p> : null}
  </fieldset>;
}

export function TagLabel({ value }: { value?: number[] }) {
  const [tags, setTags] = useState<Category[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void adminRequest<Category[]>("/Admin/api/tags", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setTags(result); }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <span>{value?.length ? value.map(id => tags.find(tag => tag.id === id)?.name ?? `Tag #${id}`).join(", ") : "No tags"}</span>;
}
