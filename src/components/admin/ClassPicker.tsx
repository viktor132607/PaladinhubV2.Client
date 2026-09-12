"use client";
import { useEffect, useId, useState } from "react";
import { adminRequest, categoryPath, type Category } from "@/lib/admin-categories";

export default function ClassPicker({ value, onChange, disabled = false }: {
  value: number | null; onChange: (id: number | null) => void; disabled?: boolean;
}) {
  const id = useId();
  const [entries, setEntries] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    void adminRequest<Category[]>("/Admin/api/classes", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setEntries(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const selected = entries.find(entry => entry.id === value);
  const classId = selected?.parentId ?? selected?.id ?? null;
  const available = entries.filter(entry => !entry.isDeleted && (!entry.isArchived || entry.id === value || entry.id === classId));
  const locked = disabled || loading || !!error;
  return <div className="mb-3">
    <label htmlFor={`${id}-class`} className="form-label">Class</label>
    <select id={`${id}-class`} className="form-select mb-2" disabled={locked} value={classId ?? ""} onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}>
      <option value="">{loading ? "Loading classes…" : "All classes"}</option>
      {value !== null && !selected ? <option value="" disabled>Unavailable class / specialization #{value}</option> : null}
      {available.filter(entry => entry.parentId === null).map(entry => <option key={entry.id} value={entry.id}>{entry.name}{entry.isArchived ? " (archived)" : ""}</option>)}
    </select>
    <label htmlFor={`${id}-spec`} className="form-label">Specialization</label>
    <select id={`${id}-spec`} className="form-select" disabled={locked || classId === null} value={selected?.parentId ? selected.id : ""} onChange={event => onChange(event.target.value ? Number(event.target.value) : classId)}>
      <option value="">All specializations</option>
      {available.filter(entry => entry.parentId === classId && classId !== null).map(entry => <option key={entry.id} value={entry.id}>{entry.name}{entry.isArchived ? " (archived)" : ""}</option>)}
    </select>
    <div className="d-flex flex-wrap gap-2 mt-2">
      <a className="btn btn-outline-secondary" href="/Admin/Classes" target="_blank" rel="noopener noreferrer">Manage classes</a>
      <button type="button" className="btn btn-outline-secondary" disabled={disabled || loading} onClick={() => setRefresh(n => n + 1)}>Refresh classes</button>
    </div>
    {error ? <p role="alert" className="text-danger">{error}</p> : null}
  </div>;
}

export function ClassLabel({ value }: { value?: number | null }) {
  const [text, setText] = useState(value ? `Class / specialization #${value}` : "All classes");
  useEffect(() => {
    setText(value ? `Class / specialization #${value}` : "All classes");
    if (!value) return;
    const controller = new AbortController();
    void adminRequest<Category[]>("/Admin/api/classes", "GET", undefined, controller.signal)
      .then(entries => { if (!controller.signal.aborted) setText(categoryPath(value, entries)); })
      .catch(() => { /* Preserve the saved ID if the catalog is unavailable. */ });
    return () => controller.abort();
  }, [value]);
  return <span>{text}</span>;
}
