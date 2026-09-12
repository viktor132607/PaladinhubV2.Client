"use client";

import { useEffect, useId, useState } from "react";
import { adminRequest, categoryPath, type Category } from "@/lib/admin-categories";

export default function CategoryPicker({ value, onChange, disabled = false }: {
  value: number | null; onChange: (id: number | null) => void; disabled?: boolean;
}) {
  const id = useId();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void adminRequest<Category[]>("/Admin/api/categories", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCategories(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  return <div className="mb-3">
    <label htmlFor={id} className="form-label">Category</label>
    <select id={id} className="form-select" value={value ?? ""} disabled={disabled || loading || !!error}
      onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}>
      <option value="">{loading ? "Loading categories…" : "Uncategorized"}</option>
      {value !== null && !categories.some(category => category.id === value && !category.isDeleted) ? <option value={value}>Category #{value} — unavailable</option> : null}
      {categories.filter(category => !category.isDeleted && (!category.isArchived || category.id === value)).map(category =>
        <option key={category.id} value={category.id}>{categoryPath(category.id, categories)}{category.isArchived ? " (archived)" : ""}</option>)}
    </select>
    <div className="d-flex flex-wrap gap-2 mt-2">
      <a className="btn btn-outline-secondary" href="/Admin/Categories" target="_blank" rel="noopener noreferrer">Manage categories</a>
      <button type="button" className="btn btn-outline-secondary" disabled={disabled || loading} onClick={() => setRefresh(current => current + 1)}>Refresh categories</button>
    </div>
    {error ? <p role="alert" className="text-danger">{error}</p> : null}
  </div>;
}

export function CategoryLabel({ value }: { value?: number | null }) {
  const [label, setLabel] = useState(value ? `Category #${value}` : "Uncategorized");
  useEffect(() => {
    setLabel(value ? `Category #${value}` : "Uncategorized");
    if (!value) return;
    const controller = new AbortController();
    void adminRequest<Category[]>("/Admin/api/categories", "GET", undefined, controller.signal)
      .then(categories => { if (!controller.signal.aborted) setLabel(categoryPath(value, categories)); })
      .catch(() => { /* Keep the stable category ID visible when the catalog is unavailable. */ });
    return () => controller.abort();
  }, [value]);
  return <span>{label}</span>;
}
