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
import { Link, useNavigate } from "@/router/nextCompat";

type GalleryImage = {
  url: string;
  altText: string;
};

type CsrfResponse = {
  token?: string;
};

type CreateProductResponse = {
  ok?: boolean;
};

type ValidationResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

const productsEndpoint = "/api/products";
const categoriesEndpoint = "/api/products/categories";
const placeholder = "/images/placeholder.png";

const inputClass =
  "w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

const miniButton =
  "rounded border border-slate-600 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40";

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  const data = await readApiJson<CsrfResponse>(response);

  if (!data?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return data.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ValidationResponse
      | null;

    if (payload?.errors) {
      const errors = Object.values(payload.errors).flat();

      if (errors.length) {
        return errors.join(" ");
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

  const [name, setName] = useState("");
  const [price, setPrice] = useState("0.00");
  const [category, setCategory] = useState("Other");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>(["Other"]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([
    { url: "", altText: "" },
  ]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        const response = await fetchBackend(categoriesEndpoint, {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const loaded = await readApiJson<string[]>(response);

        if (controller.signal.aborted) {
          return;
        }

        const unique = Array.from(
          new Set(
            ["Other", ...(loaded ?? [])]
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        );

        setCategories(unique);
        setCategory((current) =>
          unique.includes(current)
            ? current
            : unique[0] ?? "Other",
        );
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Product categories could not be loaded.",
          );
        }
      }
    };

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, []);

  const mainImage = useMemo(() => {
    if (
      thumbnailIndex !== null &&
      images[thumbnailIndex]?.url.trim()
    ) {
      return images[thumbnailIndex].url.trim();
    }

    return (
      images.find((image) => image.url.trim())?.url.trim() ||
      placeholder
    );
  }, [images, thumbnailIndex]);

  const updateImage = (
    index: number,
    field: keyof GalleryImage,
    value: string,
  ) => {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              [field]: value,
            }
          : image,
      ),
    );
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;

    if (target < 0 || target >= images.length) {
      return;
    }

    setImages((current) => {
      const next = [...current];

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });

    setThumbnailIndex((current) => {
      if (current === index) {
        return target;
      }

      if (current === target) {
        return index;
      }

      return current;
    });
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const next = current.filter(
        (_, imageIndex) => imageIndex !== index,
      );

      return next.length
        ? next
        : [{ url: "", altText: "" }];
    });

    setThumbnailIndex((current) => {
      if (current === null || current === index) {
        return null;
      }

      return current > index ? current - 1 : current;
    });
  };

  const toggleNewCategory = () => {
    setShowNewCategory((current) => {
      if (current) {
        setNewCategory("");
      }

      return !current;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const normalizedName = name.trim();
    const normalizedCategory = category.trim();
    const normalizedNewCategory = newCategory.trim();
    const normalizedDescription = description.trim();
    const numericPrice = Number(price);

    if (!normalizedName) {
      setError("Name is required.");
      return;
    }

    if (normalizedName.length > 100) {
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

    if (normalizedCategory.length > 50) {
      setError("Category cannot exceed 50 characters.");
      return;
    }

    if (normalizedNewCategory.length > 50) {
      setError("New category cannot exceed 50 characters.");
      return;
    }

    if (normalizedDescription.length > 1000) {
      setError("Description cannot exceed 1000 characters.");
      return;
    }

    const normalizedImages = images
      .map((image, originalIndex) => ({
        originalIndex,
        url: image.url.trim(),
        altText: image.altText.trim(),
      }))
      .filter((image) => image.url);

    for (const image of normalizedImages) {
      if (image.url.length > 2048) {
        setError("An image URL cannot exceed 2048 characters.");
        return;
      }

      if (!isValidAbsoluteUrl(image.url)) {
        setError(`Invalid image URL: ${image.url}`);
        return;
      }

      if (image.altText.length > 300) {
        setError(
          "Image alternative text cannot exceed 300 characters.",
        );
        return;
      }
    }

    const normalizedThumbnailIndex =
      thumbnailIndex === null
        ? null
        : normalizedImages.findIndex(
            (image) => image.originalIndex === thumbnailIndex,
          );

    setSubmitting(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(productsEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          name: normalizedName,
          price: numericPrice,
          category: normalizedCategory || "Other",
          newCategory: normalizedNewCategory || null,
          description: normalizedDescription || null,
          images: normalizedImages.map((image, index) => ({
            url: image.url,
            altText: image.altText || null,
            sortOrder: index,
          })),
          thumbnailIndex:
            normalizedThumbnailIndex !== null &&
            normalizedThumbnailIndex >= 0
              ? normalizedThumbnailIndex
              : null,
        }),
      });

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      await readApiJson<CreateProductResponse>(response);

      navigate("/products");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The product could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 text-slate-100">
      <form
        onSubmit={submit}
        className="mx-auto max-w-5xl"
        noValidate
      >
        <h1 className="mb-6 text-center text-3xl font-bold">
          Create Product
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
            <Field
              label="Name"
              htmlFor="product-name"
              required
            >
              <input
                id="product-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                disabled={submitting}
                className={inputClass}
                placeholder="Name..."
                autoFocus
                required
              />
            </Field>

            <Field
              label="Price"
              htmlFor="product-price"
              required
            >
              <div className="flex">
                <input
                  id="product-price"
                  name="price"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
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

            <Field
              label="Category"
              htmlFor="product-category"
            >
              <select
                id="product-category"
                name="category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                disabled={submitting}
                className={inputClass}
              >
                {categories.map((item) => (
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
              {showNewCategory
                ? "Cancel new category"
                : "+ Add category"}
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
                  value={newCategory}
                  onChange={(event) =>
                    setNewCategory(event.target.value)
                  }
                  maxLength={50}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="e.g. Shirts"
                />
              </Field>
            ) : null}

            <Field
              label="Description"
              htmlFor="product-description"
            >
              <textarea
                id="product-description"
                name="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={6}
                maxLength={1000}
                disabled={submitting}
                className={`${inputClass} resize-y`}
                placeholder="Optional…"
              />

              <span className="mt-1 block text-right text-xs text-slate-400">
                {description.length}/1000
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
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h2 className="mb-3 font-semibold">
                Main image preview
              </h2>

              <img
                src={mainImage}
                alt="Main product preview"
                className="aspect-square w-full rounded-lg bg-black/30 object-cover"
              />

              <p className="mt-2 text-xs text-slate-400">
                Choose the star on an image row to make it the
                thumbnail.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Gallery images</h2>

                <button
                  type="button"
                  onClick={() =>
                    setImages((current) => [
                      ...current,
                      {
                        url: "",
                        altText: "",
                      },
                    ])
                  }
                  disabled={submitting}
                  className="rounded border border-amber-400 px-3 py-1 text-sm text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Add image
                </button>
              </div>

              <div className="space-y-3">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${
                      thumbnailIndex === index
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
                          updateImage(
                            index,
                            "url",
                            event.target.value,
                          )
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
                        updateImage(
                          index,
                          "altText",
                          event.target.value,
                        )
                      }
                      maxLength={300}
                      disabled={submitting}
                      className={`${inputClass} mt-2`}
                      placeholder="Alternative text"
                      aria-label={`Image ${
                        index + 1
                      } alternative text`}
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
                          submitting ||
                          index === images.length - 1
                        }
                        className={miniButton}
                        aria-label="Move image down"
                      >
                        ▼
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (image.url.trim()) {
                            setThumbnailIndex(index);
                          }
                        }}
                        disabled={
                          submitting || !image.url.trim()
                        }
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
                ))}
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
    <label
      htmlFor={htmlFor}
      className="mb-4 block text-sm font-medium"
    >
      <span className="mb-1 block">
        {label}
        {required ? (
          <span className="text-red-400"> *</span>
        ) : null}
      </span>

      {children}

      {help ? (
        <span className="mt-1 block text-xs text-slate-400">
          {help}
        </span>
      ) : null}
    </label>
  );
}