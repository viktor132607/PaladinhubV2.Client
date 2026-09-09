"use client";

import { useEffect, useState, type FormEvent } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type GalleryImage = {
  id: number | null;
  url: string;
  altText: string;
};

type ProductForm = {
  id: string;
  name: string;
  price: string;
  category: string;
  newCategory: string;
  description: string;
  images: GalleryImage[];
  thumbnailImageId: number | null;
  thumbnailIndex: number | null;
  categories: string[];
};

type CsrfResponse = { token?: string };
type UpdateProductResponse = { ok?: boolean; id?: string; message?: string };
type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

const productsEndpoint = "/api/products";
const placeholder = "/images/placeholder.png";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pick(source: Record<string, unknown>, camelCaseName: string, pascalCaseName: string): unknown {
  return source[camelCaseName] ?? source[pascalCaseName];
}

function nullableInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeProduct(payload: unknown, fallbackId: string): ProductForm {
  const source = asRecord(payload);
  const rawImages = pick(source, "images", "Images");
  const rawCategories = pick(source, "categorySelectList", "CategorySelectList") ?? pick(source, "categories", "Categories");

  const images = Array.isArray(rawImages)
    ? rawImages.map((entry) => {
        const image = asRecord(entry);
        return {
          id: nullableInteger(pick(image, "id", "Id")),
          url: String(pick(image, "url", "Url") ?? ""),
          altText: String(pick(image, "altText", "AltText") ?? ""),
          sortOrder: nullableInteger(pick(image, "sortOrder", "SortOrder")) ?? 0,
        };
      }).sort((a, b) => a.sortOrder - b.sortOrder).map(({ id, url, altText }) => ({ id, url, altText }))
    : [];

  const categories = Array.isArray(rawCategories)
    ? rawCategories.map((entry) => {
        if (typeof entry === "string") return entry.trim();
        const category = asRecord(entry);
        return String(pick(category, "value", "Value") ?? pick(category, "text", "Text") ?? "").trim();
      }).filter(Boolean)
    : [];

  const category = String(pick(source, "category", "Category") ?? "Other").trim();

  return {
    id: String(pick(source, "id", "Id") ?? fallbackId),
    name: String(pick(source, "name", "Name") ?? ""),
    price: String(pick(source, "price", "Price") ?? "0.00"),
    category: category || "Other",
    newCategory: String(pick(source, "newCategory", "NewCategory") ?? ""),
    description: String(pick(source, "description", "Description") ?? ""),
    images,
    thumbnailImageId: nullableInteger(pick(source, "thumbnailImageId", "ThumbnailImageId")),
    thumbnailIndex: nullableInteger(pick(source, "thumbnailIndex", "ThumbnailIndex")),
    categories: Array.from(new Set(["Other", category, ...categories].filter(Boolean))),
  };
}

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
    if (payload?.errors) {
      const validationErrors = Object.values(payload.errors).flat();
      if (validationErrors.length) return validationErrors.join(" ");
    }
    return payload?.message || payload?.title || payload?.error || `Request failed with status ${response.status}.`;
  }
  const text = await response.text().catch(() => "");
  return text || `Request failed with status ${response.status}.`;
}

function isValidImageUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EditProduct() {
  const { id = "" } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductForm | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [mainPreview, setMainPreview] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const productId = id.trim();
    if (!productId) {
      setForm(null);
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchBackend(`${productsEndpoint}/${encodeURIComponent(productId)}/edit`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readApiJson<unknown>(response);
        if (controller.signal.aborted) return;
        const loaded = normalizeProduct(payload, productId);
        setForm(loaded);
        setShowNewCategory(Boolean(loaded.newCategory.trim()));
        const selected = loaded.thumbnailImageId !== null
          ? loaded.images.find((image) => image.id === loaded.thumbnailImageId)?.url.trim()
          : loaded.images[loaded.thumbnailIndex ?? 0]?.url.trim();
        setMainPreview(selected || loaded.images.find((image) => image.url.trim())?.url.trim() || placeholder);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setForm(null);
        setError(caught instanceof Error ? caught.message : "The product could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [id]);

  function patch<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  const firstNonEmptyUrl = (source: GalleryImage[]) => source.find((image) => image.url.trim())?.url.trim() || "";

  const updateImageUrl = (index: number, value: string) => {
    setForm((current) => {
      if (!current) return current;
      const images = current.images.map((image, imageIndex) => imageIndex === index ? { ...image, url: value } : image);
      if (current.thumbnailImageId === null && current.thumbnailIndex === index) setMainPreview(value.trim() || placeholder);
      if (current.thumbnailImageId === null && current.thumbnailIndex === null) setMainPreview(firstNonEmptyUrl(images) || placeholder);
      return { ...current, images };
    });
  };

  const setMainImage = (index: number) => {
    setForm((current) => {
      const image = current?.images[index];
      if (!current || !image?.url.trim()) return current;
      setMainPreview(image.url.trim());
      return {
        ...current,
        thumbnailImageId: image.id,
        thumbnailIndex: image.id === null ? index : null,
      };
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.images.length) return current;
      const images = [...current.images];
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });
  };

  const removeImage = (index: number) => {
    setForm((current) => {
      if (!current) return current;
      const removed = current.images[index];
      const wasMain = (current.thumbnailImageId !== null && removed.id === current.thumbnailImageId) || (current.thumbnailImageId === null && current.thumbnailIndex === index);
      const images = current.images.filter((_, imageIndex) => imageIndex !== index);
      const next = {
        ...current,
        images,
        thumbnailImageId: wasMain ? null : current.thumbnailImageId,
        thumbnailIndex: wasMain ? null : current.thumbnailIndex,
      };
      if (wasMain) setMainPreview(firstNonEmptyUrl(images) || placeholder);
      return next;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || submitting) return;
    setError("");

    const name = form.name.trim();
    const category = form.category.trim() || "Other";
    const newCategory = form.newCategory.trim();
    const description = form.description.trim();
    const numericPrice = Number(form.price);

    if (!name) return setError("Name is required.");
    if (name.length > 100) return setError("Name cannot exceed 100 characters.");
    if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 1_000_000) return setError("Price must be between 0 and 1,000,000.");
    if (category.length > 50) return setError("Category cannot exceed 50 characters.");
    if (newCategory.length > 50) return setError("New category cannot exceed 50 characters.");
    if (description.length > 1000) return setError("Description cannot exceed 1000 characters.");

    const normalizedImages = form.images
      .map((image, originalIndex) => ({ id: image.id, originalIndex, url: image.url.trim(), altText: image.altText.trim() }))
      .filter((image) => image.url);

    for (const image of normalizedImages) {
      if (!isValidImageUrl(image.url)) return setError(`Invalid image URL: ${image.url}`);
      if (image.url.length > 2048) return setError("An image URL cannot exceed 2048 characters.");
      if (image.altText.length > 300) return setError("Image alternative text cannot exceed 300 characters.");
    }

    let thumbnailImageId: number | null = null;
    let thumbnailIndex: number | null = null;
    if (form.thumbnailImageId !== null) {
      const selectedImage = normalizedImages.find((image) => image.id === form.thumbnailImageId);
      if (selectedImage) thumbnailImageId = form.thumbnailImageId;
    } else if (form.thumbnailIndex !== null) {
      const selectedIndex = normalizedImages.findIndex((image) => image.originalIndex === form.thumbnailIndex);
      if (selectedIndex >= 0) thumbnailIndex = selectedIndex;
    }

    setSubmitting(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(`${productsEndpoint}/${encodeURIComponent(form.id)}`, {
        method: "PUT",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
        body: JSON.stringify({
          id: form.id,
          name,
          price: numericPrice,
          category,
          newCategory: showNewCategory && newCategory ? newCategory : null,
          description: description || null,
          images: normalizedImages.map((image, index) => ({ id: image.id, url: image.url, sortOrder: index, altText: image.altText || null })),
          thumbnailImageId,
          thumbnailIndex,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      await readApiJson<UpdateProductResponse>(response);
      navigate("/Merchandise/Merchandise");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be updated.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading product…</p>;
  if (!form) return <><p className="text-danger">{error || "Product not found."}</p><Link to="/Merchandise/Merchandise" className="btn btn-secondary">Back</Link></>;

  return (
    <>
      <div className="container py-4">
        <h2 className="mb-3">Edit Product</h2>

        <form onSubmit={submit} className="bg-dark border border-secondary rounded p-3">
          {error ? <div className="alert alert-danger py-2" id="val-summary" role="alert">{error}</div> : null}

          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <div className="mb-3">
                <label htmlFor="product-name" className="form-label">Name</label>
                <input id="product-name" name="name" className="form-control" placeholder="Name..." value={form.name} onChange={(event) => patch("name", event.target.value)} disabled={submitting} />
              </div>

              <div className="mb-3">
                <label htmlFor="product-price" className="form-label">Price</label>
                <div className="input-group">
                  <input id="product-price" name="price" className="form-control" type="number" step="0.01" min="0" value={form.price} onChange={(event) => patch("price", event.target.value)} disabled={submitting} />
                  <span className="input-group-text">$</span>
                </div>
              </div>

              <div className="mb-2">
                <label htmlFor="product-category" className="form-label">Category</label>
                <select id="product-category" name="category" className="form-select" value={form.category} onChange={(event) => patch("category", event.target.value)} disabled={submitting}>
                  <option value="">-- choose --</option>
                  {form.categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <button type="button" id="btn-add-cat" className="btn btn-sm btn-outline-warning" onClick={() => setShowNewCategory((current) => !current)} disabled={submitting}>+ Add category</button>
              </div>

              <div id="new-cat-wrap" className={`mb-3${showNewCategory ? "" : " d-none"}`}>
                <label htmlFor="product-new-category" className="form-label">New category</label>
                <input id="product-new-category" name="newCategory" className="form-control" placeholder="e.g. Shirts" value={form.newCategory} onChange={(event) => patch("newCategory", event.target.value)} disabled={submitting} />
                <div className="form-text">If filled, it will be used instead of the selected one.</div>
              </div>

              <div className="mb-3">
                <label htmlFor="product-description" className="form-label">Description</label>
                <textarea id="product-description" name="description" rows={4} className="form-control" placeholder="Optional…" value={form.description} onChange={(event) => patch("description", event.target.value)} disabled={submitting} />
              </div>

              <div className="d-grid gap-2 d-md-flex">
                <Link to="/Merchandise/Merchandise" className="btn btn-outline-light">Cancel</Link>
                <button type="submit" className="btn btn-warning fw-bold px-4" disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="card bg-black border border-secondary mb-3">
                <div className="card-header border-secondary">Main image preview</div>
                <div className="card-body">
                  <div className="ratio ratio-1x1 mb-2">
                    <img id="main-preview" src={mainPreview} alt="preview" className="w-100 h-100 rounded" style={{ objectFit: "cover" }} />
                  </div>
                  <div className="small text-muted">Click the ⭐ on a row to set it as main (thumbnail).</div>
                </div>
              </div>

              <div className="mb-2 d-flex align-items-center justify-content-between">
                <label className="form-label m-0">Gallery images</label>
                <button type="button" id="btn-add-img" className="btn btn-sm btn-outline-warning" onClick={() => patch("images", [...form.images, { id: null, url: "", altText: "" }])} disabled={submitting}>+ Add image</button>
              </div>

              <div id="img-list" className="d-flex flex-column gap-2">
                {form.images.map((image, index) => {
                  const active = form.thumbnailImageId !== null ? image.id === form.thumbnailImageId : form.thumbnailIndex === index;
                  return (
                    <div key={`${image.id ?? "new"}-${index}`} className={`img-row${active ? " active-main" : ""}`} data-id={image.id ?? ""}>
                      <div className="d-flex align-items-center gap-2">
                        <img className="thumb rounded" src={image.url.trim() || placeholder} alt="" />
                        <span className={`badge bg-warning text-dark badge-main${active ? "" : " d-none"}`}>Main</span>
                        <input className="form-control form-control-sm flex-grow-1 img-url" value={image.url} placeholder="https://..." onChange={(event) => updateImageUrl(index, event.target.value)} disabled={submitting} />
                        <div className="btn-group btn-group-sm">
                          <button type="button" className="btn btn-outline-secondary btn-up" title="Up" onClick={() => moveImage(index, -1)} disabled={submitting}>▲</button>
                          <button type="button" className="btn btn-outline-secondary btn-down" title="Down" onClick={() => moveImage(index, 1)} disabled={submitting}>▼</button>
                        </div>
                        <button type="button" className="btn btn-outline-warning btn-sm btn-main" title="Set as main" onClick={() => setMainImage(index)} disabled={submitting}>⭐</button>
                        <button type="button" className="btn btn-outline-danger btn-sm btn-remove" title="Remove" onClick={() => removeImage(index)} disabled={submitting}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <small className="text-muted">Order is top → bottom. If no main is picked, the first non-empty is used.</small>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .img-row {
          border: 1px solid var(--bs-secondary);
          border-radius: .5rem;
          padding: .5rem;
          background: #111;
        }
        .img-row .thumb {
          width: 56px;
          height: 56px;
          object-fit: cover;
        }
        .img-row.active-main {
          border-color: #f59f00;
          box-shadow: 0 0 0 2px rgba(245,159,0,.15) inset;
        }
        .img-row .badge-main {
          font-size: .65rem;
        }
      `}</style>
    </>
  );
}
