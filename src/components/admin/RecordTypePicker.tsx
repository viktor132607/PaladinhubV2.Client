"use client";

import { useEffect, useId, useRef, useState } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";

type RecordType = { name: string; usageCount: number };
type Change = { previous: string; next: string };
const endpoint = "/Admin/api/record-types";

export default function RecordTypePicker({ value, onChange, disabled = false, onBusyChange, onCatalogChange, onValidityChange }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onCatalogChange?: (change: Change) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const id = useId();
  const [types, setTypes] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manage, setManage] = useState(false);
  const [target, setTarget] = useState("");
  const [name, setName] = useState("");
  const [replacement, setReplacement] = useState("");
  const [newName, setNewName] = useState("");
  const selected = types.find(type => type.name === target);
  const locked = disabled || busy || loading;
  useEffect(() => { onValidityChange?.(!loading && types.some(type => type.name === value)); }, [loading, types, value, onValidityChange]);

  const refresh = async (signal?: AbortSignal) => {
    const response = await fetchBackend(endpoint, { cache: "no-store", signal });
    const result = await readApiJson<RecordType[]>(response);
    if (!signal?.aborted) setTypes(result);
  };
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load types.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const mutate = async (method: "POST" | "PUT" | "DELETE") => {
    if (locked || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); onBusyChange?.(true); setError(""); setNotice("");
    try {
      const csrf = await readApiJson<{ token?: string }>(await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" }));
      if (!csrf.token) throw new Error("The server did not return a CSRF token.");
      const query = new URLSearchParams({ name: target });
      if (method === "DELETE" && replacement) query.set("replacement", replacement);
      const response = await fetchBackend(`${endpoint}${method === "POST" ? "" : `?${query}`}`, {
        method, headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf.token },
        ...(method !== "DELETE" ? { body: JSON.stringify({ name: method === "POST" ? newName : name }) } : {}),
      });
      const result = await readApiJson<{ name?: string } | null>(response);
      const next = method === "DELETE" ? replacement : result?.name ?? "";
      if (method === "POST") { onChange(next); setNewName(""); }
      else {
        if (value === target) onChange(next);
        onCatalogChange?.({ previous: target, next });
      }
      setTarget(method === "DELETE" ? "" : next); setName(next); setReplacement("");
      setNotice(method === "DELETE" ? "Type deleted. Records were kept." : "Type saved.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save types.");
    } finally { busyRef.current = false; setBusy(false); onBusyChange?.(false); }
  };

  return <div className="record-type-picker">
    <label htmlFor={`${id}-type`} className="form-label">Type</label>
    <div className="d-flex flex-wrap gap-2">
      <select id={`${id}-type`} name="type" className="form-select" style={{ flex: "1 1 160px", minWidth: 0 }} value={value} onChange={event => onChange(event.target.value)} disabled={locked} required>
        <option value="">{loading ? "Loading types…" : "Choose type"}</option>
        {value && !types.some(type => type.name === value) ? <option value={value} disabled>{value} — refresh types</option> : null}
        {types.map(type => <option key={type.name} value={type.name}>{type.name}</option>)}
      </select>
      <button type="button" className="btn btn-outline-secondary" disabled={disabled || busy} aria-expanded={manage} aria-controls={`${id}-manager`} onClick={() => { setManage(!manage); setTarget(value); setName(value); setReplacement(""); }}>Manage types</button>
      <button type="button" className="btn btn-outline-secondary" disabled={locked} onClick={() => { setLoading(true); setError(""); void refresh().catch(error => setError(error.message)).finally(() => setLoading(false)); }}>Refresh types</button>
    </div>
    {error ? <p role="alert" className="text-danger mt-2">{error}</p> : null}
    {notice ? <p role="status" className="text-success mt-2">{notice}</p> : null}
    {manage ? <fieldset id={`${id}-manager`} disabled={locked} className="border rounded p-3 mt-3" style={{ minWidth: 0 }} onKeyDown={event => {
      if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
        event.preventDefault();
        if (event.target.id === `${id}-new` && newName.trim()) void mutate("POST");
        if (event.target.id === `${id}-rename` && name.trim()) void mutate("PUT");
      }
    }}>
      <legend className="fs-6">Manage types</legend>
      <label className="form-label" htmlFor={`${id}-new`}>New type</label>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input id={`${id}-new`} className="form-control" style={{ flex: "1 1 160px", minWidth: 0 }} maxLength={50} value={newName} onChange={event => setNewName(event.target.value)} />
        <button type="button" className="btn btn-primary" disabled={!newName.trim()} onClick={() => void mutate("POST")}>Add type</button>
      </div>
      <label className="form-label" htmlFor={`${id}-existing`}>Existing type</label>
      <select id={`${id}-existing`} className="form-select mb-3" value={selected ? target : ""} onChange={event => { setTarget(event.target.value); setName(event.target.value); setReplacement(""); }}>
        <option value="">Choose a type to manage</option>
        {types.map(type => <option key={type.name} value={type.name}>{type.name} ({type.usageCount} records)</option>)}
      </select>
      {selected ? <>
        <label className="form-label" htmlFor={`${id}-rename`}>Type name</label>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <input id={`${id}-rename`} className="form-control" style={{ flex: "1 1 160px", minWidth: 0 }} maxLength={50} value={name} onChange={event => setName(event.target.value)} />
          <button type="button" className="btn btn-primary" disabled={!name.trim() || name.trim().toLowerCase() === target} onClick={() => void mutate("PUT")}>Rename type</button>
        </div>
        <p>Renaming updates all records using this type.</p>
        <label className="form-label" htmlFor={`${id}-replacement`}>Replace with before deleting</label>
        <select id={`${id}-replacement`} className="form-select mb-2" value={replacement} onChange={event => setReplacement(event.target.value)}>
          <option value="">{selected.usageCount ? "Choose a replacement type" : "No replacement needed"}</option>
          {types.filter(type => type.name !== target).map(type => <option key={type.name} value={type.name}>{type.name}</option>)}
        </select>
        <button type="button" className="btn btn-danger" disabled={selected.usageCount > 0 && !replacement} onClick={() => void mutate("DELETE")}>Delete type</button>
      </> : null}
    </fieldset> : null}
  </div>;
}
