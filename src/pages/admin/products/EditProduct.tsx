"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
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

type CsrfResponse = {
  token?: string;
};

type UpdateProductResponse = {
  ok?: boolean;
  id?: string;
  message?: string;
};

type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

const productsEndpoint = "/api/products";
const placeholder = "/images/placeholder.png";

const inputClass =
  "w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

const miniButton =
  "rounded border border-slate-600 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pick(
  source: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): unknown {
  return source[camelCaseName] ?? source[pascalCaseName];
}

function nullableInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeProduct(payload: unknown, fallbackId: string): ProductForm {
  const source = asRecord(payload);
  const rawImages = pick(source, "images", "Images");
  const rawCategories =
    pick(source, "categorySelectList", "CategorySelectList") ??
    pick(source, "categories", "Categories");

  const images = Array.isArray(rawImages)
    ? rawImages.map((entry) => {
        const image = asRecord(entry);

        return {
          id: nullableInteger(pick(image, "id", "Id")),
          url: String(pick(image, "url", "Url") ?? ""),
          altText: String(pick(image, "altText", "AltText") ?? ""),
        };
      })
    : [];

  const categories = Array.isArray(rawCategories)
    ? rawCategories
        .map((entry) => {
          if (typeof entry === "string") {
            return entry.trim();
          }

          const category = asRecord(entry);

          return String(
            pick(category, "value", "Value") ??
              pick(category, "text", "Text") ??
              "",
          ).trim();
        })
        .filter(Boolean)
    : [];

  const category = String(
    pick(source, "category", "Category") ?? "Other",
  ).trim();

  return {
    id: String(pick(source, "id", "Id") ?? fallbackId),
    name: String(pick(source, "name", "Name") ?? ""),
    price: String(pick(source, "price", "Price") ?? "0.00"),
    category: category || "Other",
    newCategory: String(
      pick(source, "newCategory", "NewCategory") ?? "",
    ),
    description: String(
      pick(source, "description", "Description") ?? "",
    ),
    images: images.length ? images : [{ id: null, url: "", altText: "" }],
    thumbnailImageId: nullableInteger(
      pick(source, "thumbnailImageId", "ThumbnailImageId"),
    ),
    thumbnailIndex: nullableInteger(
      pick(source, "thumbnailIndex", "ThumbnailIndex"),
    ),
    categories: Array.from(
      new Set(["Other", category, ...categories].filter(Boolean)),
    ),
  };
}

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  const payload = await readApiJson<CsrfResponse>(response);

  if (!payload?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return payload.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ErrorResponse
      | null;

    if (payload?.errors) {
      const validationErrors = Object.values(payload.errors).flat();

      if (validationErrors.length) {
        return validationErrors.join(" ");
      }
    }

    return (
      payload?.message ||
      payload?.title ||
      payload?.error ||
      `Request failed with status ${response.status}.`
    );
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
        const response = await fetchBackend(
          `${productsEndpoint}/${encodeURIComponent(productId)}/edit`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload = await readApiJson<unknown>(response);

        if (controller.signal.aborted) {
          return;
        }

        const loaded = normalizeProduct(payload, productId);

        setForm(loaded);
        setShowNewCategory(Boolean(loaded.newCategory.trim()));
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setForm(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "The product could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [id]);

  const mainImage = useMemo(() => {
    if (!form) {
      return placeholder;
    }

    if (form.thumbnailImageId !== null) {
      const selected = form.images.find(
        (image) => image.id === form.thumbnailImageId,
      );

      if (selected?.url.trim()) {
        return selected.url.trim();
      }
    }

    if (
      form.thumbnailIndex !== null &&
      form.images[form.thumbnailIndex]?.url.trim()
    ) {
      return form.images[form.thumbnailIndex].url.trim();
    }

    return (
      form.images.find((image) => image.url.trim())?.url.trim() || placeholder
    );
  }, [form]);

  function patch<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  const updateImage = (
    index: number,
    field: "url" | "altText",
    value: string,
  ) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        images: current.images.map((image, imageIndex) =>
          imageIndex === index ? { ...image, [field]: value } : image,
        ),
      };
    });
  };

  const setMainImage = (index: number) => {
    setForm((current) => {
      const image = current?.images[index];

      if (!current || !image?.url.trim()) {
        return current;
      }

      return {
        ...current,
        thumbnailImageId: image.id,
        thumbnailIndex: image.id === null ? index : null,
      };
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      const target = index + direction;

      if (target < 0 || target >= current.images.length) {
        return current;
      }

      const images = [...current.images];
      [images[index], images[target]] = [images[target], images[index]];

      let thumbnailIndex = current.thumbnailIndex;

      if (thumbnailIndex === index) {
        thumbnailIndex = target;
      } else if (thumbnailIndex === target) {
        thumbnailIndex = index;
      }

      return {
        ...current,
        images,
        thumbnailIndex,
      };
    });
  };

  const removeImage = (index: number) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      const removed = current.images[index];
      const remaining = current.images.filter(
        (_, imageIndex) => imageIndex !== index,
      );

      let thumbnailImageId = current.thumbnailImageId;
      let thumbnailIndex = current.thumbnailIndex;

      if (
        removed.id !== null &&
        removed.id === current.thumbnailImageId
      ) {
        thumbnailImageId = null;
      }

      if (thumbnailIndex === index) {
        thumbnailIndex = null;
      } else if (thumbnailIndex !== null && thumbnailIndex > index) {
        thumbnailIndex -= 1;
      }

      return {
        ...current,
        images: remaining.length
          ? remaining
          : [{ id: null, url: "", altText: "" }],
        thumbnailImageId,
        thumbnailIndex,
      };
    });
  };

  const toggleNewCategory = () => {
    setShowNewCategory((current) => {
      if (current) {
        patch("newCategory", "");
      }

      return !current;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form || submitting) {
      return;
    }

    setError("");

    const name = form.name.trim();
    const category = form.category.trim() || "Other";
    const newCategory = form.newCategory.trim();
    const description = form.description.trim();
    const numericPrice = Number(form.price);

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (name.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      numericPrice > 1_000_000
    ) {
      setError("Price must be between 0 and 1,000,000.");
      return;
    }

    if (category.length > 50) {
      setError("Category cannot exceed 50 characters.");
      return;
    }

    if (newCategory.length > 50) {
      setError("New category cannot exceed 50 characters.");
      return;
    }

    if (description.length > 1000) {
      setError("Description cannot exceed 1000 characters.");
      return;
    }

    const normalizedImages = form.images
      .map((image, originalIndex) => ({
        id: image.id,
        originalIndex,
        url: image.url.trim(),
        altText: image.altText.trim(),
      }))
      .filter((image) => image.url);

    for (const image of normalizedImages) {
      if (!isValidImageUrl(image.url)) {
        setError(`Invalid image URL: ${image.url}`);
        return;
      }

      if (image.url.length > 2048) {
        setError("An image URL cannot exceed 2048 characters.");
        return;
      }

      if (image.altText.length > 300) {
        setError("Image alternative text cannot exceed 300 characters.");
        return;
      }
    }

    let thumbnailImageId: number | null = null;
    let thumbnailIndex: number | null = null;

    if (form.thumbnailImageId !== null) {
      const selectedImage = normalizedImages.find(
        (image) => image.id === form.thumbnailImageId,
      );

      if (selectedImage) {
        thumbnailImageId = form.thumbnailImageId;
      }
    } else if (form.thumbnailIndex !== null) {
      const selectedIndex = normalizedImages.findIndex(
        (image) => image.originalIndex === form.thumbnailIndex,
      );

      if (selectedIndex >= 0) {
        thumbnailIndex = selectedIndex;
      }
    }

    setSubmitting(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(
        `${productsEndpoint}/${encodeURIComponent(form.id)}`,
        {
          method: "PUT",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify({
            id: form.id,
            name,
            price: numericPrice,
            category,
            newCategory:
              showNewCategory && newCategory ? newCategory : null,
            description: description || null,
            images: normalizedImages.map((image, index) => ({
              id: image.id,
              url: image.url,
              sortOrder: index,
              altText: image.altText || null,
            })),
            thumbnailImageId,
            thumbnailIndex,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      await readApiJson<UpdateProductResponse>(response);
      navigate("/products");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The product could not be updated.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-16 text-center text-slate-400">
        Loading product…
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-16 text-center text-red-300">
        <p>{error || "Product not found."}</p>

        <Link
          to="/products"
          className="mt-5 inline-block rounded border border-slate-600 px-5 py-2 text-slate-100 hover:bg-slate-800"
        >
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-5xl" noValidate>
        <h1 className="mb-6 text-center text-3xl font-bold">
          Edit Product
        </h1>

        {error ? (
          <div
            className="mb-5 rounded border border-red-500/40 bg-red-500/10 p-3 text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <Field label="Name" htmlFor="product-name" required>
              <input
                id="product-name"
                name="name"
                value={form.name}
                onChange={(event) => patch("name", event.target.value)}
                maxLength={100}
                disabled={submitting}
                className={inputClass}
                required
                autoFocus
              />
            </Field>

            <Field label="Price" htmlFor="product-price" required>
              <div className="flex">
                <input
                  id="product-price"
                  name="price"
                  value={form.price}
                  onChange={(event) => patch("price", event.target.value)}
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  disabled={submitting}
                  className={`${inputClass} rounded-r-none`}
                  required
                />

                <span className="rounded-r border border-l-0 border-slate-600 bg-slate-800 px-4 py-2">
                  $
                </span>
              </div>
            </Field>

            <Field label="Category" htmlFor="product-category">
              <select
                id="product-category"
                name="category"
                value={form.category}
                onChange={(event) => patch("category", event.target.value)}
                disabled={submitting}
                className={inputClass}
              >
                {form.categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="button"
              onClick={toggleNewCategory}
              disabled={submitting}
              className="mb-4 rounded border border-amber-400 px-3 py-2 text-sm text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showNewCategory ? "Cancel new category" : "+ Add category"}
            </button>

            {showNewCategory ? (
              <Field
                label="New category"
                htmlFor="product-new-category"
                help="If filled, it is used instead of the selected category."
              >
                <input
                  id="product-new-category"
                  name="newCategory"
                  value={form.newCategory}
                  onChange={(event) =>
                    patch("newCategory", event.target.value)
                  }
                  maxLength={50}
                  disabled={submitting}
                  className={inputClass}
                />
              </Field>
            ) : null}

            <Field label="Description" htmlFor="product-description">
              <textarea
                id="product-description"
                name="description"
                value={form.description}
                onChange={(event) =>
                  patch("description", event.target.value)
                }
                rows={6}
                maxLength={1000}
                disabled={submitting}
                className={`${inputClass} resize-y`}
              />

              <span className="mt-1 block text-right text-xs text-slate-400">
                {form.description.length}/1000
              </span>
            </Field>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded border border-slate-600 px-5 py-2 font-semibold"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-amber-400 px-5 py-2 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="mb-3 font-semibold">Main image preview</h2>

              <img
                src={mainImage}
                alt="Main product preview"
                className="aspect-square w-full rounded-lg bg-black/30 object-cover"
              />
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Gallery images</h2>

                <button
                  type="button"
                  onClick={() =>
                    patch("images", [
                      ...form.images,
                      { id: null, url: "", altText: "" },
                    ])
                  }
                  disabled={submitting}
                  className="rounded border border-amber-400 px-3 py-1 text-sm text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Add image
                </button>
              </div>

              <div className="space-y-3">
                {form.images.map((image, index) => {
                  const active =
                    form.thumbnailImageId !== null
                      ? image.id === form.thumbnailImageId
                      : form.thumbnailIndex === index;

                  return (
                    <div
                      key={`${image.id ?? "new"}-${index}`}
                      className={`rounded-lg border p-3 ${
                        active
                          ? "border-amber-400 bg-amber-400/5"
                          : "border-slate-700 bg-slate-950"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={image.url.trim() || placeholder}
                          alt=""
                          className="h-14 w-14 rounded object-cover"
                        />

                        <input
                          value={image.url}
                          onChange={(event) =>
                            updateImage(index, "url", event.target.value)
                          }
                          maxLength={2048}
                          disabled={submitting}
                          className={`${inputClass} flex-1`}
                          placeholder="https://..."
                          aria-label={`Image ${index + 1} URL`}
                        />
                      </div>

                      <input
                        value={image.altText}
                        onChange={(event) =>
                          updateImage(index, "altText", event.target.value)
                        }
                        maxLength={300}
                        disabled={submitting}
                        className={`${inputClass} mt-2`}
                        placeholder="Alternative text"
                        aria-label={`Image ${index + 1} alternative text`}
                      />

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={submitting || index === 0}
                          className={miniButton}
                          aria-label="Move image up"
                        >
                          ▲
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={
                            submitting || index === form.images.length - 1
                          }
                          className={miniButton}
                          aria-label="Move image down"
                        >
                          ▼
                        </button>

                        <button
                          type="button"
                          onClick={() => setMainImage(index)}
                          disabled={submitting || !image.url.trim()}
                          className={`${miniButton} text-amber-300`}
                        >
                          ⭐ Main
                        </button>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={submitting}
                          className={`${miniButton} text-red-300`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  help,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-4 block text-sm font-medium">
      <span className="mb-1 block">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </span>

      {children}

      {help ? (
        <span className="mt-1 block text-xs text-slate-400">{help}</span>
      ) : null}
    </label>
  );
}