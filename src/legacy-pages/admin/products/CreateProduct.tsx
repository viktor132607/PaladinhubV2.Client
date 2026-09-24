"use client";

import { useEffect, useState, type FormEvent } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useLocation, useNavigate } from "@/router/nextCompat";
import ProductGalleryEditor, { productImageUrl } from "@/components/admin/ProductGalleryEditor";

type GalleryImage = {
  url: string;
  altText: string;
};

type CsrfResponse = { token?: string };
type CreateProductResponse = { ok?: boolean };
type ValidationResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

const productsEndpoint = "/api/products";
const categoriesEndpoint = "/api/products/categories";
const placeholder = "/images/placeholder.png";

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const data = await readApiJson<CsrfResponse>(response);
  if (!data?.token) throw new Error("The server did not return a CSRF token.");
  return data.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as ValidationResponse | null;
    if (payload?.errors) {
      const errors = Object.values(payload.errors).flat();
      if (errors.length) return errors.join(" ");
    }
    return payload?.message || payload?.title || payload?.error || `Request failed with status ${response.status}.`;
  }
  const text = await response.text().catch(() => "");
  return text || `Request failed with status ${response.status}.`;
}

function isValidAbsoluteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreateProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = new URLSearchParams(location.search).get("returnTo") === "admin" ? "/Admin/Products" : "/Merchandise/Merchandise";
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0.00");
  const [category, setCategory] = useState("Other");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>(["Other"]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([{ url: "", altText: "" }]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number | null>(null);
  const [mainPreview, setMainPreview] = useState(placeholder);
  const [submitting, setSubmitting] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadCategories = async () => {
      try {
        const response = await fetchBackend(categoriesEndpoint, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const loaded = await readApiJson<string[]>(response);
        if (controller.signal.aborted) return;
        const unique = Array.from(new Set(["Other", ...(loaded ?? [])].map((value) => value.trim()).filter(Boolean)));
        setCategories(unique);
        setCategory((current) => unique.includes(current) ? current : unique[0] ?? "Other");
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Product categories could not be loaded.");
        }
      }
    };
    void loadCategories();
    return () => controller.abort();
  }, []);

  const firstNonEmptyUrl = (source: GalleryImage[]) => source.find((image) => image.url.trim())?.url.trim() || "";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || imageBusy) return;
    setError("");

    const normalizedName = name.trim();
    const normalizedCategory = category.trim();
    const normalizedNewCategory = newCategory.trim();
    const normalizedDescription = description.trim();
    const numericPrice = Number(price);

    if (!normalizedName) return setError("Name is required.");
    if (normalizedName.length > 100) return setError("Name cannot exceed 100 characters.");
    if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 1_000_000) return setError("Price must be between 0 and 1,000,000.");
    if (normalizedCategory.length > 50) return setError("Category cannot exceed 50 characters.");
    if (normalizedNewCategory.length > 50) return setError("New category cannot exceed 50 characters.");
    if (normalizedDescription.length > 1000) return setError("Description cannot exceed 1000 characters.");

    const normalizedImages = images
      .map((image, originalIndex) => ({ originalIndex, url: image.url.trim(), altText: image.altText.trim() }))
      .filter((image) => image.url);

    for (const image of normalizedImages) {
      if (image.url.length > 2048) return setError("An image URL cannot exceed 2048 characters.");
      if (!isValidAbsoluteUrl(image.url)) return setError(`Invalid image URL: ${image.url}`);
      if (image.altText.length > 300) return setError("Image alternative text cannot exceed 300 characters.");
    }

    const normalizedThumbnailIndex = thumbnailIndex === null ? null : normalizedImages.findIndex((image) => image.originalIndex === thumbnailIndex);
    setSubmitting(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(productsEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
        body: JSON.stringify({
          name: normalizedName,
          price: numericPrice,
          category: normalizedCategory || "Other",
          newCategory: normalizedNewCategory || null,
          description: normalizedDescription || null,
          images: normalizedImages.map((image, index) => ({ url: image.url, altText: image.altText || null, sortOrder: index })),
          thumbnailIndex: normalizedThumbnailIndex !== null && normalizedThumbnailIndex >= 0 ? normalizedThumbnailIndex : null,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      await readApiJson<CreateProductResponse>(response);
      navigate(returnPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-record-editor">
      <h1 className="text-center mb-4">Create Product</h1>

      <form onSubmit={submit} className="mx-auto" style={{ maxWidth: 960 }}>
        {error ? <div className="alert alert-danger py-2" id="val-summary" role="alert">{error}</div> : null}

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="mb-3">
              <label htmlFor="product-name" className="form-label">Name</label>
              <input id="product-name" name="name" className="form-control" placeholder="Name..." value={name} onChange={(event) => setName(event.target.value)} disabled={submitting} />
            </div>

            <div className="mb-3">
              <label htmlFor="product-price" className="form-label">Price</label>
              <div className="input-group">
                <input id="product-price" name="price" className="form-control" type="number" step="0.01" min="0" value={price} onChange={(event) => setPrice(event.target.value)} disabled={submitting} />
                  <span className="input-group-text">€</span>
              </div>
            </div>

            <div className="mb-2">
              <label htmlFor="product-category" className="form-label">Category</label>
              <select id="product-category" name="category" className="form-select" value={category} onChange={(event) => setCategory(event.target.value)} disabled={submitting}>
                <option value="">-- choose --</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <button type="button" id="btn-add-cat" className="btn btn-sm btn-outline-warning" onClick={() => setShowNewCategory((current) => !current)} disabled={submitting}>+ Add category</button>
            </div>

            <div id="new-cat-wrap" className={`mb-3${showNewCategory ? "" : " d-none"}`}>
              <label htmlFor="product-new-category" className="form-label">New category</label>
              <input id="product-new-category" name="newCategory" className="form-control" placeholder="e.g. Shirts" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} disabled={submitting} />
              <div className="form-text">If filled, it will be used instead of the selected one.</div>
            </div>

            <div className="mb-3">
              <label htmlFor="product-description" className="form-label">Description</label>
              <textarea id="product-description" name="description" rows={4} className="form-control" placeholder="Optional…" value={description} onChange={(event) => setDescription(event.target.value)} disabled={submitting} />
            </div>

            <div className="d-grid gap-2 d-md-flex">
              <Link to={returnPath} className="btn btn-outline-light">Cancel</Link>
              <button type="submit" className="btn btn-warning fw-bold px-4" disabled={submitting || imageBusy}>{submitting ? "Creating…" : "Create"}</button>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card bg-dark border border-secondary mb-3">
              <div className="card-header border-secondary">Main image preview</div>
              <div className="card-body">
                <div className="ratio ratio-1x1 mb-2">
                  <img id="main-preview" src={productImageUrl(mainPreview)} alt="preview" className="w-100 h-100 rounded" style={{ objectFit: "cover" }} />
                </div>
                <div className="small text-muted">Click the ⭐ on a row to set it as main (thumbnail).</div>
              </div>
            </div>

            <ProductGalleryEditor images={images} mainIndex={thumbnailIndex} disabled={submitting || imageBusy} onBusyChange={setImageBusy}
                onChange={(next) => { setImages(next); setMainPreview(next[thumbnailIndex ?? 0]?.url || next.find((image) => image.url.trim())?.url || placeholder); }}
                onMainChange={(index, next) => { const source = next ?? images; setThumbnailIndex(index); setMainPreview(source[index ?? 0]?.url || firstNonEmptyUrl(source) || placeholder); }} />
          </div>
        </div>
      </form>
    </div>
  );
}
