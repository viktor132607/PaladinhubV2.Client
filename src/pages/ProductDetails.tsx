"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import ProductGallery, {
  type ProductImage,
} from "@/components/products/ProductGallery";
import ProductGalleryModal from "@/components/products/ProductGalleryModal";
import {
  backendEndpoints,
  backendUrl,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import {
  Link,
  useParams,
} from "@/router/nextCompat";

type Review = {
  id: number;
  userName: string;
  rating: number;
  content: string | null;
  createdAt: string;
  canDelete: boolean;
};

type SimilarProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
};

type ProductDetailsData = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  description: string | null;
  averageRating: number;
  reviewsCount: number;
  reviews: Review[];
  similar: SimilarProduct[];
  images: ProductImage[];
  canReview: boolean;
  alreadyReviewed: boolean;
};

type ActionResponse = {
  ok?: boolean;
  message?: string;
};

const CART_UPDATED_EVENT =
  "paladinhub:cart-updated";

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function property(
  source: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): unknown {
  return (
    source[camelCaseName] ??
    source[pascalCaseName]
  );
}

function toStringValue(
  value: unknown,
  fallback = "",
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
}

function toNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toBoolean(
  value: unknown,
): boolean {
  return value === true ||
    value === "true" ||
    value === 1;
}

function normalizeRating(
  value: unknown,
): number {
  return Math.max(
    0,
    Math.min(
      5,
      toNumber(value),
    ),
  );
}

function normalizeJson(
  payload: unknown,
  fallbackId: string,
): ProductDetailsData {
  const body = asRecord(payload);

  const rawReviews = property(
    body,
    "reviews",
    "Reviews",
  );

  const rawSimilar = property(
    body,
    "similar",
    "Similar",
  );

  const rawImages = property(
    body,
    "images",
    "Images",
  );

  const reviews = Array.isArray(
    rawReviews,
  )
    ? rawReviews
        .map((entry): Review | null => {
          const review =
            asRecord(entry);

          const id = Math.trunc(
            toNumber(
              property(
                review,
                "id",
                "Id",
              ),
            ),
          );

          if (id <= 0) {
            return null;
          }

          return {
            id,

            userName:
              toStringValue(
                property(
                  review,
                  "userName",
                  "UserName",
                ),
                "User",
              ).trim() || "User",

            rating: Math.round(
              normalizeRating(
                property(
                  review,
                  "rating",
                  "Rating",
                ),
              ),
            ),

            content:
              toStringValue(
                property(
                  review,
                  "content",
                  "Content",
                ),
              ).trim() || null,

            createdAt:
              toStringValue(
                property(
                  review,
                  "createdAt",
                  "CreatedAt",
                ),
              ),

            canDelete: toBoolean(
              property(
                review,
                "canDelete",
                "CanDelete",
              ),
            ),
          };
        })
        .filter(
          (
            review,
          ): review is Review =>
            review !== null,
        )
    : [];

  const similar = Array.isArray(
    rawSimilar,
  )
    ? rawSimilar
        .map(
          (
            entry,
          ): SimilarProduct | null => {
            const item =
              asRecord(entry);

            const id =
              toStringValue(
                property(
                  item,
                  "id",
                  "Id",
                ),
              ).trim();

            if (!id) {
              return null;
            }

            const rawImageUrl =
              property(
                item,
                "imageUrl",
                "ImageUrl",
              );

            return {
              id,

              name:
                toStringValue(
                  property(
                    item,
                    "name",
                    "Name",
                  ),
                  "Unnamed product",
                ).trim() ||
                "Unnamed product",

              price: Math.max(
                0,
                toNumber(
                  property(
                    item,
                    "price",
                    "Price",
                  ),
                ),
              ),

              imageUrl:
                typeof rawImageUrl ===
                  "string" &&
                rawImageUrl.trim()
                  ? rawImageUrl.trim()
                  : null,
            };
          },
        )
        .filter(
          (
            item,
          ): item is SimilarProduct =>
            item !== null,
        )
    : [];

  const images = Array.isArray(
    rawImages,
  )
    ? rawImages
        .map(
          (
            entry,
          ): ProductImage | null => {
            const image =
              asRecord(entry);

            const url =
              toStringValue(
                property(
                  image,
                  "url",
                  "Url",
                ),
              ).trim();

            if (!url) {
              return null;
            }

            const id = property(
              image,
              "id",
              "Id",
            );

            const altText =
              toStringValue(
                property(
                  image,
                  "altText",
                  "AltText",
                ),
              ).trim();

            return {
              id:
                typeof id === "string" ||
                typeof id === "number"
                  ? id
                  : undefined,

              url,

              altText:
                altText ||
                undefined,
            };
          },
        )
        .filter(
          (
            image,
          ): image is ProductImage =>
            image !== null,
        )
    : [];

  const rawImageUrl = property(
    body,
    "imageUrl",
    "ImageUrl",
  );

  const imageUrl =
    typeof rawImageUrl === "string" &&
    rawImageUrl.trim()
      ? rawImageUrl.trim()
      : null;

  return {
    id:
      toStringValue(
        property(
          body,
          "id",
          "Id",
        ),
        fallbackId,
      ).trim() || fallbackId,

    name:
      toStringValue(
        property(
          body,
          "name",
          "Name",
        ),
        "Unnamed product",
      ).trim() || "Unnamed product",

    price: Math.max(
      0,
      toNumber(
        property(
          body,
          "price",
          "Price",
        ),
      ),
    ),

    imageUrl,

    category:
      toStringValue(
        property(
          body,
          "category",
          "Category",
        ),
        "Other",
      ).trim() || "Other",

    description:
      toStringValue(
        property(
          body,
          "description",
          "Description",
        ),
      ).trim() || null,

    averageRating:
      normalizeRating(
        property(
          body,
          "averageRating",
          "AverageRating",
        ),
      ),

    reviewsCount: Math.max(
      0,
      Math.trunc(
        toNumber(
          property(
            body,
            "reviewsCount",
            "ReviewsCount",
          ),
          reviews.length,
        ),
      ),
    ),

    reviews,
    similar,
    images,

    canReview: toBoolean(
      property(
        body,
        "canReview",
        "CanReview",
      ),
    ),

    alreadyReviewed: toBoolean(
      property(
        body,
        "alreadyReviewed",
        "AlreadyReviewed",
      ),
    ),
  };
}

function resolveImageUrl(
  value: string | null | undefined,
): string {
  const normalized =
    value?.trim() ?? "";

  if (!normalized) {
    return "/images/placeholder.png";
  }

  if (
    /^(https?:)?\/\//i.test(
      normalized,
    ) ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  return backendUrl(normalized);
}

function formatMoney(
  value: number,
): string {
  return new Intl.NumberFormat(
    undefined,
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function ProductDetails() {
  const params =
    useParams<{ id: string }>();

  const productId =
    params.id?.trim() ?? "";

  const {
    isAuthenticated,
    hasRole,
  } = useAuth();

  const [
    product,
    setProduct,
  ] = useState<ProductDetailsData | null>(
    null,
  );

  const [loading, setLoading] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<string | null>(null);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [tab, setTab] =
    useState<"reviews" | "similar">(
      "reviews",
    );

  const [rating, setRating] =
    useState(5);

  const [
    reviewContent,
    setReviewContent,
  ] = useState("");

  const [
    submittingReview,
    setSubmittingReview,
  ] = useState(false);

  const [
    deletingReviewId,
    setDeletingReviewId,
  ] = useState<number | null>(null);

  const [
    addingProductId,
    setAddingProductId,
  ] = useState<string | null>(null);

  const [
    modalIndex,
    setModalIndex,
  ] = useState<number | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      if (!productId) {
        setProduct(null);
        setLoadError(
          "Product ID is missing.",
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.product.details(
              productId,
            ),
            {
              method: "GET",
              cache: "no-store",
              signal,
            },
          );

        const payload =
          await readApiJson<unknown>(
            response,
          );

        if (signal?.aborted) {
          return;
        }

        setProduct(
          normalizeJson(
            payload,
            productId,
          ),
        );

        setModalIndex(null);
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setProduct(null);

        setLoadError(
          caught instanceof Error
            ? caught.message
            : "Could not load the product.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const galleryImages =
    useMemo<ProductImage[]>(() => {
      if (!product) {
        return [];
      }

      const source =
        product.images.length > 0
          ? product.images
          : product.imageUrl
            ? [
                {
                  url:
                    product.imageUrl,
                },
              ]
            : [];

      if (source.length === 0) {
        return [
          {
            url:
              "/images/placeholder.png",
            altText:
              product.name,
          },
        ];
      }

      return source.map(
        (image) => ({
          ...image,

          url: resolveImageUrl(
            image.url,
          ),

          altText:
            image.altText ||
            product.name,
        }),
      );
    }, [product]);

  const roundedRating =
    useMemo(
      () =>
        Math.max(
          0,
          Math.min(
            5,
            Math.round(
              product?.averageRating ??
                0,
            ),
          ),
        ),
      [product?.averageRating],
    );

  const addToCart = useCallback(
    async (
      id: string,
      name: string,
    ): Promise<void> => {
      if (
        addingProductId !== null
      ) {
        return;
      }

      setAddingProductId(id);
      setActionError(null);
      setNotice(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.cart.add(
              id,
            ),
            {
              method: "POST",
              cache: "no-store",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId: id,
                quantity: 1,
              }),
            },
          );

        const result =
          await readApiJson<ActionResponse>(
            response,
          );

        if (result?.ok === false) {
          throw new Error(
            result.message ||
              "The product could not be added to the cart.",
          );
        }

        setNotice(
          result?.message ||
            `${name} was added to your cart.`,
        );

        window.dispatchEvent(
          new Event(
            CART_UPDATED_EVENT,
          ),
        );
      } catch (caught) {
        setActionError(
          caught instanceof Error
            ? caught.message
            : "The product could not be added to your cart.",
        );
      } finally {
        setAddingProductId(null);
      }
    },
    [addingProductId],
  );

  const addReview = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      event.preventDefault();

      if (
        !product ||
        submittingReview
      ) {
        return;
      }

      const content =
        reviewContent.trim();

      setSubmittingReview(true);
      setActionError(null);
      setNotice(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.product.addReview(
              product.id,
            ),
            {
              method: "POST",
              cache: "no-store",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId:
                  product.id,
                rating,
                content:
                  content || null,
              }),
            },
          );

        const result =
          await readApiJson<ActionResponse>(
            response,
          );

        if (result?.ok === false) {
          throw new Error(
            result.message ||
              "The review could not be submitted.",
          );
        }

        setReviewContent("");

        setNotice(
          result?.message ||
            "Review submitted.",
        );

        await load();
      } catch (caught) {
        setActionError(
          caught instanceof Error
            ? caught.message
            : "The review could not be submitted.",
        );
      } finally {
        setSubmittingReview(false);
      }
    },
    [
      load,
      product,
      rating,
      reviewContent,
      submittingReview,
    ],
  );

  const deleteReview = useCallback(
    async (
      reviewId: number,
    ): Promise<void> => {
      if (
        !product ||
        deletingReviewId !== null
      ) {
        return;
      }

      setDeletingReviewId(
        reviewId,
      );

      setActionError(null);
      setNotice(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.product.deleteReview(
              product.id,
              reviewId,
            ),
            {
              method: "DELETE",
              cache: "no-store",
            },
          );

        await readApiJson<null>(
          response,
        );

        setNotice(
          "Review deleted.",
        );

        await load();
      } catch (caught) {
        setActionError(
          caught instanceof Error
            ? caught.message
            : "The review could not be deleted.",
        );
      } finally {
        setDeletingReviewId(null);
      }
    },
    [
      deletingReviewId,
      load,
      product,
    ],
  );

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-16 text-center text-slate-400">
        Loading product…
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-16 text-center">
        <div
          className="text-red-300"
          role="alert"
        >
          {loadError ||
            "Product not found."}
        </div>

        {productId ? (
          <button
            type="button"
            onClick={() => {
              void load();
            }}
            className="mt-5 rounded border border-slate-600 px-4 py-2 font-semibold text-slate-100 hover:border-slate-400"
          >
            Try again
          </button>
        ) : null}
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div
          aria-live="polite"
          aria-atomic="true"
        >
          {notice ? (
            <div className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-200">
              {notice}
            </div>
          ) : null}

          {actionError ? (
            <div
              className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-red-200"
              role="alert"
            >
              {actionError}
            </div>
          ) : null}
        </div>

        <section className="grid gap-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ProductGallery
            images={galleryImages}
            productName={
              product.name
            }
            onOpen={
              setModalIndex
            }
          />

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-bold">
                {product.name}
              </h1>

              {hasRole("Admin") ? (
                <Link
                  to={`/Admin/Products/Edit/${encodeURIComponent(
                    product.id,
                  )}`}
                  className="rounded border border-amber-400 px-3 py-2 text-sm text-amber-300"
                >
                  Edit product
                </Link>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>
                Category:{" "}
                <strong className="text-slate-200">
                  {
                    product.category
                  }
                </strong>
              </span>

              <span
                className="text-amber-300"
                aria-label={`${product.averageRating.toFixed(
                  1,
                )} out of 5`}
              >
                {"★".repeat(
                  roundedRating,
                )}

                <span className="text-slate-600">
                  {"☆".repeat(
                    5 -
                      roundedRating,
                  )}
                </span>
              </span>

              <span>
                (
                {
                  product.reviewsCount
                }
                )
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-lime-300">
              {formatMoney(
                product.price,
              )}
            </p>

            {product.description ? (
              <p className="mt-5 whitespace-pre-wrap text-slate-300">
                {
                  product.description
                }
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void addToCart(
                    product.id,
                    product.name,
                  );
                }}
                disabled={
                  addingProductId !==
                  null
                }
                className="rounded bg-amber-400 px-5 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingProductId ===
                product.id
                  ? "Adding…"
                  : "Add to Cart"}
              </button>

              <Link
                to="/products"
                className="rounded border border-slate-600 px-5 py-3 font-semibold"
              >
                Back
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div
            className="flex border-b border-slate-700"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={
                tab === "reviews"
              }
              onClick={() => {
                setTab(
                  "reviews",
                );
              }}
              className={`px-5 py-3 font-semibold ${
                tab === "reviews"
                  ? "bg-amber-400 text-slate-950"
                  : "text-slate-300"
              }`}
            >
              Reviews (
              {
                product.reviewsCount
              }
              )
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={
                tab === "similar"
              }
              onClick={() => {
                setTab(
                  "similar",
                );
              }}
              className={`px-5 py-3 font-semibold ${
                tab === "similar"
                  ? "bg-amber-400 text-slate-950"
                  : "text-slate-300"
              }`}
            >
              Similar
            </button>
          </div>

          <div className="p-5">
            {tab === "reviews" ? (
              <>
                {isAuthenticated ? (
                  <form
                    onSubmit={
                      addReview
                    }
                    className="mb-6 grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-end"
                  >
                    <label className="text-sm">
                      Your rating

                      <select
                        value={
                          rating
                        }
                        onChange={(
                          event,
                        ) => {
                          setRating(
                            Number(
                              event
                                .target
                                .value,
                            ),
                          );
                        }}
                        className="mt-1 block rounded border border-slate-600 bg-slate-950 px-3 py-2"
                      >
                        {[
                          5,
                          4,
                          3,
                          2,
                          1,
                        ].map(
                          (value) => (
                            <option
                              key={
                                value
                              }
                              value={
                                value
                              }
                            >
                              {
                                value
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label className="text-sm">
                      Review

                      <input
                        value={
                          reviewContent
                        }
                        onChange={(
                          event,
                        ) => {
                          setReviewContent(
                            event
                              .target
                              .value,
                          );
                        }}
                        maxLength={
                          2000
                        }
                        className="mt-1 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
                        placeholder="Share your thoughts…"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={
                        submittingReview
                      }
                      className="rounded bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingReview
                        ? "Submitting…"
                        : "Submit"}
                    </button>
                  </form>
                ) : (
                  <div className="mb-5 rounded border border-slate-600 bg-slate-800 p-3 text-slate-300">
                    <Link
                      to="/login"
                      className="text-amber-300 underline"
                    >
                      Login
                    </Link>{" "}
                    to leave a review.
                  </div>
                )}

                {product.reviews
                  .length === 0 ? (
                  <p className="text-slate-400">
                    No reviews yet.
                  </p>
                ) : (
                  <ul>
                    {product.reviews.map(
                      (review) => {
                        const reviewRating =
                          Math.max(
                            0,
                            Math.min(
                              5,
                              Math.round(
                                review.rating,
                              ),
                            ),
                          );

                        return (
                          <li
                            key={
                              review.id
                            }
                            className="border-b border-slate-700 py-4 last:border-0"
                          >
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="font-semibold">
                                  {
                                    review.userName
                                  }
                                </p>

                                <p className="text-sm text-amber-300">
                                  {"★".repeat(
                                    reviewRating,
                                  )}

                                  <span className="text-slate-600">
                                    {"☆".repeat(
                                      5 -
                                        reviewRating,
                                    )}
                                  </span>
                                </p>
                              </div>

                              {review.createdAt ? (
                                <time
                                  dateTime={
                                    review.createdAt
                                  }
                                  className="text-xs text-slate-400"
                                >
                                  {formatDate(
                                    review.createdAt,
                                  )}
                                </time>
                              ) : null}
                            </div>

                            {review.content ? (
                              <p className="mt-2 whitespace-pre-wrap text-slate-300">
                                {
                                  review.content
                                }
                              </p>
                            ) : null}

                            {review.canDelete ? (
                              <button
                                type="button"
                                onClick={() => {
                                  void deleteReview(
                                    review.id,
                                  );
                                }}
                                disabled={
                                  deletingReviewId !==
                                  null
                                }
                                className="mt-3 rounded border border-red-500 px-3 py-1 text-sm text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingReviewId ===
                                review.id
                                  ? "Deleting…"
                                  : "Delete"}
                              </button>
                            ) : null}
                          </li>
                        );
                      },
                    )}
                  </ul>
                )}
              </>
            ) : product.similar
                .length === 0 ? (
              <p className="text-slate-400">
                No similar products.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {product.similar.map(
                  (similar) => (
                    <article
                      key={
                        similar.id
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950 p-3"
                    >
                      <Link
                        to={`/products/${encodeURIComponent(
                          similar.id,
                        )}`}
                      >
                        <img
                          src={resolveImageUrl(
                            similar.imageUrl,
                          )}
                          alt={
                            similar.name
                          }
                          className="aspect-square w-full rounded object-contain"
                          loading="lazy"
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              "/images/placeholder.png";
                          }}
                        />

                        <h2 className="mt-3 truncate font-semibold">
                          {
                            similar.name
                          }
                        </h2>
                      </Link>

                      <p className="mt-2 text-lime-300">
                        {formatMoney(
                          similar.price,
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          void addToCart(
                            similar.id,
                            similar.name,
                          );
                        }}
                        disabled={
                          addingProductId !==
                          null
                        }
                        className="mt-3 w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingProductId ===
                        similar.id
                          ? "Adding…"
                          : "Add to Cart"}
                      </button>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <ProductGalleryModal
        open={
          modalIndex !== null
        }
        imageUrl={
          modalIndex === null
            ? undefined
            : galleryImages[
                modalIndex
              ]?.url
        }
        altText={
          modalIndex === null
            ? product.name
            : galleryImages[
                modalIndex
              ]?.altText ||
              product.name
        }
        onClose={() => {
          setModalIndex(null);
        }}
      />
    </main>
  );
}