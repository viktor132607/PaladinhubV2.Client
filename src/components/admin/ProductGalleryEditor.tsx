"use client";

import { useState } from "react";
import { backendEndpoints, backendUrl, fetchBackend, readApiJson } from "@/config/api";
import SpellIconPicker from "./SpellIconPicker";

export type GalleryEntry = { id?: number | null; url: string; altText: string };

export function productImageUrl(value: string): string {
  if (!value) return "/images/placeholder.png";
  return value.startsWith("/") ? backendUrl(value) : value;
}

export default function ProductGalleryEditor<T extends GalleryEntry>({ images, mainIndex, disabled, onChange, onMainChange, onBusyChange }: {
  images: T[];
  mainIndex: number | null;
  disabled: boolean;
  onChange: (images: T[]) => void;
  onMainChange: (index: number | null, nextImages?: T[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [dragged, setDragged] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const uploadMany = async (files: FileList | null) => {
    if (!files?.length || disabled || uploading) return;
    const selected = Array.from(files);
    if (selected.some((file) => !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024)) {
      setError("Choose PNG, JPEG, GIF or WebP photos up to 5 MB each.");
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    setError("");
    try {
      const csrfResponse = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
      const { token } = await readApiJson<{ token: string }>(csrfResponse);
      if (!token) throw new Error("The server did not return a CSRF token.");
      const next = [...images];
      for (const file of selected) {
        const body = new FormData(); body.append("file", file);
        const response = await fetchBackend("/Admin/api/spells/icons", { method: "POST", headers: { "X-CSRF-TOKEN": token }, body });
        const { icon } = await readApiJson<{ icon: string }>(response);
        next.push({ id: null, url: backendUrl(icon), altText: file.name.replace(/\.[^.]+$/, "").slice(0, 300) } as T);
        onChange([...next]);
      }
      if (mainIndex === null && images.every((image) => !image.url.trim())) onMainChange(images.length, next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Photos could not be uploaded.");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  };
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    next.splice(to, 0, ...next.splice(from, 1));
    onChange(next);
    if (mainIndex === from) onMainChange(to, next);
    else if (mainIndex !== null && from < mainIndex && to >= mainIndex) onMainChange(mainIndex - 1, next);
    else if (mainIndex !== null && from > mainIndex && to <= mainIndex) onMainChange(mainIndex + 1, next);
  };

  return <div className="admin-product-gallery">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <h3 className="h5 mb-0">Product photos</h3>
      <div className="d-flex flex-wrap gap-2">
        <label className={`btn btn-primary mb-0${disabled || uploading ? " disabled" : ""}`}>Choose photos<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden disabled={disabled || uploading} onChange={(event) => { void uploadMany(event.target.files); event.target.value = ""; }} /></label>
        <button type="button" className="btn btn-outline-secondary" disabled={disabled || uploading} onClick={() => onChange([...images, { id: null, url: "", altText: "" } as T])}>Add from database / URL</button>
      </div>
    </div>
    {uploading && <p role="status">Uploading photos…</p>}
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    <p className="text-muted small">Choose a photo from your phone, upload from your computer, browse the database or paste an image. Drag to reorder on desktop.</p>
    <div className="d-grid gap-2">
      {images.map((image, index) => <div key={`${image.id ?? "new"}-${index}`} className={`admin-product-photo${mainIndex === index ? " is-main" : ""}`} draggable={!disabled} onDragStart={() => setDragged(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragged !== null) move(dragged, index); setDragged(null); }} onDragEnd={() => setDragged(null)}>
        <div className="admin-product-photo-preview"><img src={productImageUrl(image.url.trim())} alt={image.altText || `Product photo ${index + 1}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/placeholder.png"; }} />{mainIndex === index && <span className="badge bg-warning text-dark">Main</span>}</div>
        <div className="admin-product-photo-content">
          <SpellIconPicker compact label={`Photo ${index + 1}`} value={image.url} disabled={disabled} onBusyChange={onBusyChange} onChange={(value) => onChange(images.map((entry, at) => at === index ? { ...entry, url: value.startsWith("/api/spell-icons/") ? backendUrl(value) : value } : entry))} />
          <input className="form-control form-control-sm" aria-label={`Alternative text for photo ${index + 1}`} placeholder="Description for accessibility (optional)" maxLength={300} value={image.altText} disabled={disabled} onChange={(event) => onChange(images.map((entry, at) => at === index ? { ...entry, altText: event.target.value } : entry))} />
          <div className="d-flex flex-wrap gap-2 mt-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label={`Move photo ${index + 1} up`}>↑</button>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={disabled || index === images.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move photo ${index + 1} down`}>↓</button>
            <button type="button" className="btn btn-sm btn-outline-primary" disabled={disabled || !image.url.trim()} onClick={() => onMainChange(index)}>Set as main</button>
            <button type="button" className="btn btn-sm btn-outline-danger" disabled={disabled} onClick={() => { const next = images.filter((_, at) => at !== index); onChange(next); if (mainIndex === index) onMainChange(null, next); else if (mainIndex !== null && mainIndex > index) onMainChange(mainIndex - 1, next); }}>Remove</button>
          </div>
        </div>
      </div>)}
    </div>
  </div>;
}
