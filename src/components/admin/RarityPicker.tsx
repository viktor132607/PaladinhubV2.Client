"use client";

import { useEffect, useId, useState } from "react";
import { adminRequest, type Category as BaseCategory } from "@/lib/admin-categories";

type Category = BaseCategory & { color: string };

export default function RarityPicker({ value, onChange, disabled = false }: {
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
    void adminRequest<Category[]>("/Admin/api/rarities", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCategories(result); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  return <div className="mb-3">
    <label htmlFor={id} className="form-label">Item rarity</label>
    <select id={id} className="form-select" value={value ?? ""} disabled={disabled || loading || !!error}
      onChange={event => onChange(event.target.value ? Number(event.target.value) : null)}>
      <option value="">{loading ? "Loading rarities…" : "No rarity"}</option>
      {value !== null && !categories.some(category => category.id === value && !category.isDeleted) ? <option value={value}>Rarity #{value} — unavailable</option> : null}
      {categories.filter(category => !category.isDeleted && (!category.isArchived || category.id === value)).map(category =>
        <option style={{ color: category.color }} key={category.id} value={category.id}>{category.name}{category.isArchived ? " (archived)" : ""}</option>)}
    </select>
    <div className="d-flex flex-wrap gap-2 mt-2">
      <a className="btn btn-outline-secondary" href="/Admin/Rarities" target="_blank" rel="noopener noreferrer">Manage rarities</a>
      <button type="button" className="btn btn-outline-secondary" disabled={disabled || loading} onClick={() => setRefresh(current => current + 1)}>Refresh rarities</button>
    </div>
    {error ? <p role="alert" className="text-danger">{error}</p> : null}
  </div>;
}

export function RarityLabel({ value }: { value?: number | null }) {
  const [color, setColor] = useState<string>();
  const [label, setLabel] = useState(value ? `Rarity #${value}` : "No rarity");
  useEffect(() => {
    setColor(undefined);
    setLabel(value ? `Rarity #${value}` : "No rarity");
    if (!value) return;
    const controller = new AbortController();
    void adminRequest<Category[]>("/Admin/api/rarities", "GET", undefined, controller.signal)
      .then(categories => { if (!controller.signal.aborted) { setLabel(categories.find(entry => entry.id === value)?.name ?? `Rarity #${value}`); setColor(categories.find(entry => entry.id === value)?.color); } })
      .catch(() => { /* Keep the stable category ID visible when the catalog is unavailable. */ });
    return () => controller.abort();
  }, [value]);
  return <span style={{ color }}>{label}</span>;
}
