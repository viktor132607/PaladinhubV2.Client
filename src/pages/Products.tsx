"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { backendEndpoints, backendUrl, fetchBackend, readApiJson } from "@/config/api";
import { Link, useLocation, useNavigate } from "@/router/nextCompat";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  averageRating: number;
  reviewsCount: number;
};

type MerchandiseData = {
  products: Product[];
  allCategories: string[];
  ratingAtLeast: Record<number, number>;
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type Filters = {
  search: string;
  categories: string[];
  priceRanges: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  sortBy: number;
  desc: boolean;
  page: number;
  pageSize: number;
};

type AddToCartResponse = {
  ok?: boolean;
  cartCount?: number;
  message?: string;
};

const CART_UPDATED_EVENT = "paladinhub:cart-updated";

const PAGE_SIZES = [20, 40, 100] as const;

const DEFAULT_PAGE_SIZE = 20;

const priceBands = [
  ["0-100", "$0–100"],
  ["100-200", "$100–200"],
  ["200-500", "$200–500"],
  ["500+", "$500+"],
] as const;

const sortOptions = [
  "Relevance",
  "Name",
  "Price",
  "Newest",
  "Rating",
  "Most reviewed",
] as const;

const emptyData: MerchandiseData = {
  products: [],
  allCategories: [],
  ratingAtLeast: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
  totalItems: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 1,
};

const inputClass =
  "w-full rounded-lg border border-[#2a2f3a] bg-[#0f1115] px-3 py-2 text-sm text-[#e6e6e6] outline-none placeholder:text-[#6b7280] focus:border-[#3a7bd5] focus:ring-2 focus:ring-[rgba(58,123,213,.25)]";

const selectClass =
  "rounded border border-[#2a2f3a] bg-[#0f1115] px-2 py-1.5 text-sm text-[#e6e6e6] outline-none focus:border-[#3a7bd5]";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function get(
  source: Record<string, unknown>,
  camel: string,
  pascal: string,
): unknown {
  return source[camel] ?? source[pascal];
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function positiveInteger(
  value: unknown,
  fallback: number,
): number {
  return Math.max(
    1,
    Math.trunc(
      numberValue(value, fallback),
    ),
  );
}

function normalizePageSize(value: unknown): number {
  const parsed = Math.trunc(
    numberValue(
      value,
      DEFAULT_PAGE_SIZE,
    ),
  );

  return PAGE_SIZES.includes(
    parsed as (typeof PAGE_SIZES)[number],
  )
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

function normalizePrice(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) &&
    parsed >= 0
    ? String(parsed)
    : "";
}

function normalizeFilters(
  filters: Filters,
): Filters {
  const minRating = Math.trunc(
    numberValue(
      filters.minRating,
      0,
    ),
  );

  const sortBy = Math.trunc(
    numberValue(
      filters.sortBy,
      0,
    ),
  );

  return {
    search: filters.search,

    categories: Array.from(
      new Set(
        filters.categories
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ),

    priceRanges: Array.from(
      new Set(
        filters.priceRanges.filter(
          (x) =>
            priceBands.some(
              ([key]) => key === x,
            ),
        ),
      ),
    ),

    minPrice: normalizePrice(
      filters.minPrice,
    ),

    maxPrice: normalizePrice(
      filters.maxPrice,
    ),

    minRating:
      minRating >= 1 &&
      minRating <= 5
        ? minRating
        : 0,

    sortBy:
      sortBy >= 0 &&
      sortBy <= 5
        ? sortBy
        : 0,

    desc: Boolean(
      filters.desc,
    ),

    page: positiveInteger(
      filters.page,
      1,
    ),

    pageSize: normalizePageSize(
      filters.pageSize,
    ),
  };
}

function initialFilters(search: string): Filters {
  const params =
    new URLSearchParams(search);

  return normalizeFilters({
    search:
      params.get("Search") ??
      "",

    categories:
      params.getAll(
        "Categories",
      ),

    priceRanges:
      params.getAll(
        "PriceRanges",
      ),

    minPrice:
      params.get(
        "MinPrice",
      ) ?? "",

    maxPrice:
      params.get(
        "MaxPrice",
      ) ?? "",

    minRating:
      numberValue(
        params.get(
          "MinRating",
        ),
        0,
      ),

    sortBy:
      numberValue(
        params.get(
          "SortBy",
        ),
        0,
      ),

    desc:
      params
        .get("Desc")
        ?.toLowerCase() ===
      "true",

    page:
      numberValue(
        params.get("Page"),
        1,
      ),

    pageSize:
      normalizePageSize(
        params.get(
          "PageSize",
        ),
      ),
  });
}

function toQuery(
  filters: Filters,
): URLSearchParams {
  const f =
    normalizeFilters(
      filters,
    );

  const params =
    new URLSearchParams();

  if (f.search.trim()) {
    params.set(
      "Search",
      f.search.trim(),
    );
  }

  f.categories.forEach(
    (x) =>
      params.append(
        "Categories",
        x,
      ),
  );

  f.priceRanges.forEach(
    (x) =>
      params.append(
        "PriceRanges",
        x,
      ),
  );

  if (f.minPrice) {
    params.set(
      "MinPrice",
      f.minPrice,
    );
  }

  if (f.maxPrice) {
    params.set(
      "MaxPrice",
      f.maxPrice,
    );
  }

  if (f.minRating > 0) {
    params.set(
      "MinRating",
      String(
        f.minRating,
      ),
    );
  }

  params.set(
    "SortBy",
    String(
      f.sortBy,
    ),
  );

  params.set(
    "Desc",
    String(
      f.desc,
    ),
  );

  params.set(
    "Page",
    String(
      f.page,
    ),
  );

  params.set(
    "PageSize",
    String(
      f.pageSize,
    ),
  );

  return params;
}

function normalizeProduct(
  value: unknown,
): Product | null {
  const source =
    asRecord(value);

  const id = String(
    get(
      source,
      "id",
      "Id",
    ) ?? "",
  ).trim();

  if (!id) {
    return null;
  }

  const rawImage =
    get(
      source,
      "imageUrl",
      "ImageUrl",
    );

  return {
    id,

    name:
      String(
        get(
          source,
          "name",
          "Name",
        ) ??
          "Unnamed product",
      ).trim() ||
      "Unnamed product",

    price: Math.max(
      0,
      numberValue(
        get(
          source,
          "price",
          "Price",
        ),
        0,
      ),
    ),

    imageUrl:
      typeof rawImage ===
        "string" &&
      rawImage.trim()
        ? rawImage.trim()
        : null,

    category:
      String(
        get(
          source,
          "category",
          "Category",
        ) ?? "Other",
      ).trim() ||
      "Other",

    averageRating:
      Math.max(
        0,
        Math.min(
          5,
          numberValue(
            get(
              source,
              "averageRating",
              "AverageRating",
            ),
            0,
          ),
        ),
      ),

    reviewsCount:
      Math.max(
        0,
        Math.trunc(
          numberValue(
            get(
              source,
              "reviewsCount",
              "ReviewsCount",
            ),
            0,
          ),
        ),
      ),
  };
}

function normalizeJson(
  payload: unknown,
): MerchandiseData {
  const body =
    asRecord(payload);

  const productsBlock =
    asRecord(
      get(
        body,
        "products",
        "Products",
      ),
    );

  const rawItems =
    get(
      productsBlock,
      "items",
      "Items",
    );

  const ratings =
    asRecord(
      get(
        body,
        "ratingAtLeast",
        "RatingAtLeast",
      ),
    );

  const categoriesRaw =
    get(
      body,
      "allCategories",
      "AllCategories",
    );

  const products =
    Array.isArray(rawItems)
      ? rawItems
          .map(
            normalizeProduct,
          )
          .filter(
            (
              x,
            ): x is Product =>
              x !== null,
          )
      : [];

  const allCategories =
    Array.isArray(
      categoriesRaw,
    )
      ? Array.from(
          new Set(
            categoriesRaw
              .filter(
                (
                  x,
                ): x is string =>
                  typeof x ===
                  "string",
              )
              .map(
                (x) =>
                  x.trim(),
              )
              .filter(
                Boolean,
              ),
          ),
        )
      : [];

  return {
    products,

    allCategories,

    ratingAtLeast: {
      1: Math.max(
        0,
        Math.trunc(
          numberValue(
            ratings["1"],
            0,
          ),
        ),
      ),

      2: Math.max(
        0,
        Math.trunc(
          numberValue(
            ratings["2"],
            0,
          ),
        ),
      ),

      3: Math.max(
        0,
        Math.trunc(
          numberValue(
            ratings["3"],
            0,
          ),
        ),
      ),

      4: Math.max(
        0,
        Math.trunc(
          numberValue(
            ratings["4"],
            0,
          ),
        ),
      ),

      5: Math.max(
        0,
        Math.trunc(
          numberValue(
            ratings["5"],
            0,
          ),
        ),
      ),
    },

    totalItems:
      Math.max(
        0,
        Math.trunc(
          numberValue(
            get(
              productsBlock,
              "totalItems",
              "TotalItems",
            ),
            products.length,
          ),
        ),
      ),

    page:
      positiveInteger(
        get(
          productsBlock,
          "page",
          "Page",
        ),
        1,
      ),

    pageSize:
      positiveInteger(
        get(
          productsBlock,
          "pageSize",
          "PageSize",
        ),
        DEFAULT_PAGE_SIZE,
      ),

    totalPages:
      positiveInteger(
        get(
          productsBlock,
          "totalPages",
          "TotalPages",
        ),
        1,
      ),
  };
}

function resolveProductImage(
  imageUrl: string | null,
): string {
  if (!imageUrl) {
    return "/images/placeholder.png";
  }

  if (
    /^(https?:)?\/\//i.test(
      imageUrl,
    ) ||
    imageUrl.startsWith(
      "data:",
    ) ||
    imageUrl.startsWith(
      "blob:",
    )
  ) {
    return imageUrl;
  }

  return backendUrl(
    imageUrl,
  );
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof
      DOMException &&
    error.name ===
      "AbortError"
  );
}

function formatPrice(
  value: number,
): string {
  return `$${value.toFixed(
    2,
  )}`;
}

export default function Products() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const { hasRole } =
    useAuth();

  const [
    filters,
    setFilters,
  ] = useState<Filters>(
    () =>
      initialFilters(
        location.search,
      ),
  );

  const [
    data,
    setData,
  ] =
    useState<MerchandiseData>(
      emptyData,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<
    string | null
  >(null);

  const [
    actionError,
    setActionError,
  ] = useState<
    string | null
  >(null);

  const [
    notice,
    setNotice,
  ] = useState<
    string | null
  >(null);

  const [
    addingProductId,
    setAddingProductId,
  ] = useState<
    string | null
  >(null);

  const [
    deletingProductId,
    setDeletingProductId,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    setFilters(
      initialFilters(
        location.search,
      ),
    );
  }, [
    location.search,
  ]);

  const query =
    useMemo(
      () =>
        toQuery(
          filters,
        ).toString(),
      [filters],
    );

  const load =
    useCallback(
      async (
        signal?:
          AbortSignal,
      ): Promise<void> => {
        setLoading(true);

        setLoadError(
          null,
        );

        try {
          const endpoint =
            `${backendEndpoints.merchandise.list}?${query}`;

          const response =
            await fetchBackend(
              endpoint,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                signal,
              },
            );

          const payload =
            await readApiJson<unknown>(
              response,
            );

          if (
            !signal?.aborted
          ) {
            setData(
              normalizeJson(
                payload,
              ),
            );
          }
        } catch (
          error
        ) {
          if (
            signal?.aborted ||
            isAbortError(
              error,
            )
          ) {
            return;
          }

          setLoadError(
            error instanceof
              Error
              ? error.message
              : "Could not load merchandise.",
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false,
            );
          }
        }
      },
      [query],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(
      controller.signal,
    );

    return () =>
      controller.abort();
  }, [load]);

  const apply =
    useCallback(
      (
        next: Filters,
      ) => {
        const normalized =
          normalizeFilters(
            next,
          );

        const nextQuery =
          toQuery(
            normalized,
          ).toString();

        setFilters(
          normalized,
        );

        navigate(
          `${location.pathname}?${nextQuery}`,
        );
      },
      [
        location.pathname,
        navigate,
      ],
    );

  const toggleArray =
    useCallback(
      (
        key:
          | "categories"
          | "priceRanges",
        value: string,
      ) => {
        const current =
          filters[key];

        apply({
          ...filters,

          [key]:
            current.includes(
              value,
            )
              ? current.filter(
                  (x) =>
                    x !==
                    value,
                )
              : [
                  ...current,
                  value,
                ],

          page: 1,
        });
      },
      [
        apply,
        filters,
      ],
    );

  const addToCart =
    useCallback(
      async (
        product: Product,
      ) => {
        if (
          addingProductId !==
          null
        ) {
          return;
        }

        setAddingProductId(
          product.id,
        );

        setActionError(
          null,
        );

        setNotice(
          null,
        );

        try {
          const response =
            await fetchBackend(
              backendEndpoints
                .cart
                .add(
                  product.id,
                ),
              {
                method:
                  "POST",

                cache:
                  "no-store",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    {
                      productId:
                        product.id,

                      quantity: 1,
                    },
                  ),
              },
            );

          const result =
            await readApiJson<AddToCartResponse>(
              response,
            );

          if (
            result?.ok ===
            false
          ) {
            throw new Error(
              result.message ||
                "The product could not be added to the cart.",
            );
          }

          setNotice(
            result?.message ||
              "The product is added successfully to your cart.",
          );

          window.dispatchEvent(
            new Event(
              CART_UPDATED_EVENT,
            ),
          );
        } catch (
          error
        ) {
          setActionError(
            error instanceof
              Error
              ? error.message
              : "The product could not be added to the cart.",
          );
        } finally {
          setAddingProductId(
            null,
          );
        }
      },
      [
        addingProductId,
      ],
    );

  const deleteProduct =
    useCallback(
      async (
        product: Product,
      ) => {
        if (
          deletingProductId !==
          null
        ) {
          return;
        }

        if (
          !window.confirm(
            `Delete "${product.name}"?`,
          )
        ) {
          return;
        }

        setDeletingProductId(
          product.id,
        );

        setActionError(
          null,
        );

        setNotice(
          null,
        );

        try {
          const response =
            await fetchBackend(
              backendEndpoints
                .product
                .delete(
                  product.id,
                ),
              {
                method:
                  "DELETE",

                cache:
                  "no-store",
              },
            );

          await readApiJson<unknown>(
            response,
          );

          setNotice(
            `${product.name} was deleted.`,
          );

          await load();
        } catch (
          error
        ) {
          setActionError(
            error instanceof
              Error
              ? error.message
              : "The product could not be deleted.",
          );
        } finally {
          setDeletingProductId(
            null,
          );
        }
      },
      [
        deletingProductId,
        load,
      ],
    );

  const start =
    data.totalItems === 0
      ? 0
      : (data.page - 1) *
          data.pageSize +
        1;

  const end =
    Math.min(
      data.page *
        data.pageSize,
      data.totalItems,
    );

  return (
    <div className="w-full bg-[#0f1115] py-6 text-[#e6e6e6]">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="min-w-[270px] rounded-xl border border-[#272b35] bg-[#171a21] p-4">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Filters
            </h2>

            <label className="mb-4 block text-sm font-semibold text-[#d7dde7]">
              Search

              <input
                value={
                  filters.search
                }
                onChange={(
                  e,
                ) =>
                  setFilters(
                    (
                      current,
                    ) => ({
                      ...current,

                      search:
                        e.target
                          .value,
                    }),
                  )
                }
                onBlur={() =>
                  apply({
                    ...filters,
                    page: 1,
                  })
                }
                onKeyDown={(
                  e,
                ) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    e.preventDefault();

                    apply({
                      ...filters,
                      page: 1,
                    });
                  }
                }}
                className={`${inputClass} mt-2`}
                placeholder="Name, category, descr"
              />
            </label>

            <FilterGroup title="Category">
              {data.allCategories.map(
                (
                  category,
                ) => (
                  <Check
                    key={
                      category
                    }
                    label={
                      category
                    }
                    checked={filters.categories.includes(
                      category,
                    )}
                    onChange={() =>
                      toggleArray(
                        "categories",
                        category,
                      )
                    }
                  />
                ),
              )}
            </FilterGroup>

            <FilterGroup title="Price ranges">
              {priceBands.map(
                ([
                  key,
                  label,
                ]) => (
                  <Check
                    key={
                      key
                    }
                    label={
                      label
                    }
                    checked={filters.priceRanges.includes(
                      key,
                    )}
                    onChange={() =>
                      toggleArray(
                        "priceRanges",
                        key,
                      )
                    }
                  />
                ),
              )}
            </FilterGroup>

            <FilterGroup title="Price (custom)">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    filters.minPrice
                  }
                  onChange={(
                    e,
                  ) =>
                    setFilters(
                      (
                        current,
                      ) => ({
                        ...current,

                        minPrice:
                          e.target
                            .value,
                      }),
                    )
                  }
                  onBlur={() =>
                    apply({
                      ...filters,
                      page: 1,
                    })
                  }
                  className={
                    inputClass
                  }
                  placeholder="From"
                />

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    filters.maxPrice
                  }
                  onChange={(
                    e,
                  ) =>
                    setFilters(
                      (
                        current,
                      ) => ({
                        ...current,

                        maxPrice:
                          e.target
                            .value,
                      }),
                    )
                  }
                  onBlur={() =>
                    apply({
                      ...filters,
                      page: 1,
                    })
                  }
                  className={
                    inputClass
                  }
                  placeholder="To"
                />
              </div>
            </FilterGroup>

            <FilterGroup title="Rating">
              <div className="grid gap-1.5">
                {[
                  5,
                  4,
                  3,
                  2,
                  1,
                ].map(
                  (
                    rating,
                  ) => {
                    const active =
                      filters.minRating ===
                      rating;

                    return (
                      <button
                        key={
                          rating
                        }
                        type="button"
                        onClick={() =>
                          apply({
                            ...filters,

                            minRating:
                              active
                                ? 0
                                : rating,

                            page: 1,
                          })
                        }
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-sm transition ${
                          active
                            ? "border-[#3a7bd5] bg-[#1a2230] shadow-[0_0_0_2px_rgba(58,123,213,.2)]"
                            : "border-[#2a2f3a] bg-[#111419] hover:border-[#3a4150] hover:bg-[#161a21]"
                        }`}
                      >
                        <Stars
                          rating={
                            rating
                          }
                        />

                        <span className="text-xs text-[#6b7280]">
                          (
                          {data
                            .ratingAtLeast[
                            rating
                          ] ??
                            0}
                          )
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </FilterGroup>

            <button
              type="button"
              onClick={() =>
                apply(
                  initialFilters(
                    "",
                  ),
                )
              }
              className="mt-5 w-full rounded-lg border border-[#2a2f3a] bg-[#0f1115] px-3 py-2 text-sm font-semibold text-[#cfd3da] transition hover:border-[#3a4150] hover:bg-[#171a21] hover:text-white"
            >
              🧹 Clear all filters
            </button>
          </div>
        </aside>

        <section className="min-w-0 lg:col-span-9">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="m-0 text-[1.75rem] font-semibold text-white">
              Welcome to PaladinHub&apos;s Merch Shop!
            </h1>

            <div className="flex items-center gap-2">
              <Link
                to="/Cart/MyCart"
                className="inline-flex items-center gap-2 rounded-full bg-[#ffc107] px-4 py-1.5 text-sm font-bold text-black no-underline hover:bg-[#ffca2c]"
              >
                🛒 My Cart
              </Link>

              {hasRole(
                "Admin",
              ) && (
                <Link
                  to="/Admin/Products/Create"
                  className="rounded bg-[#198754] px-3 py-1.5 text-sm font-semibold text-white no-underline hover:bg-[#157347]"
                >
                  + Create Product
                </Link>
              )}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <strong className="text-white">
                {
                  data.totalItems
                }
              </strong>{" "}
              results

              {data.totalItems >
                0 && (
                <span className="text-[#6c757d]">
                  {" "}
                  — showing{" "}
                  {start}–
                  {end}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[#6c757d]">
                Page{" "}
                {data.page} of{" "}
                {
                  data.totalPages
                }
              </span>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6c757d]">
                  Sort by
                </label>

                <select
                  value={
                    filters.sortBy
                  }
                  onChange={(
                    e,
                  ) =>
                    apply({
                      ...filters,

                      sortBy:
                        Number(
                          e.target
                            .value,
                        ),

                      page: 1,
                    })
                  }
                  className={
                    selectClass
                  }
                >
                  {sortOptions.map(
                    (
                      option,
                      index,
                    ) => (
                      <option
                        key={
                          option
                        }
                        value={
                          index
                        }
                      >
                        {
                          option
                        }
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    apply({
                      ...filters,

                      desc:
                        !filters.desc,

                      page: 1,
                    })
                  }
                  className="rounded border border-[#2a2f3a] bg-transparent px-2 py-1.5 text-white hover:border-[#3a7bd5]"
                >
                  {filters.desc
                    ? "↓ Desc"
                    : "↑ Asc"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6c757d]">
                  Items per page
                </label>

                <select
                  value={
                    filters.pageSize
                  }
                  onChange={(
                    e,
                  ) =>
                    apply({
                      ...filters,

                      pageSize:
                        normalizePageSize(
                          e.target
                            .value,
                        ),

                      page: 1,
                    })
                  }
                  className={
                    selectClass
                  }
                >
                  {PAGE_SIZES.map(
                    (
                      size,
                    ) => (
                      <option
                        key={
                          size
                        }
                        value={
                          size
                        }
                      >
                        {
                          size
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          {notice && (
            <div className="mb-3 rounded border border-[#198754] bg-[rgba(25,135,84,.15)] px-4 py-3 text-[#9ee2bd]">
              {notice}
            </div>
          )}

          {actionError && (
            <div className="mb-3 rounded border border-[#dc3545] bg-[rgba(220,53,69,.15)] px-4 py-3 text-[#ffb3bb]">
              {actionError}
            </div>
          )}

          {loadError ? (
            <div className="rounded border border-[#dc3545] bg-[rgba(220,53,69,.15)] px-4 py-3 text-[#ffb3bb]">
              {loadError}

              <button
                type="button"
                onClick={() =>
                  void load()
                }
                className="ml-3 rounded border border-[#dc3545] px-3 py-1"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-[#6c757d]">
              Loading products…
            </div>
          ) : data.products
              .length ===
            0 ? (
            <div className="rounded border border-[#2a2f3a] bg-[#171a21] p-4 text-[#cff4fc]">
              No products match
              your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.products.map(
                (
                  product,
                ) => {
                  const roundedRating =
                    Math.max(
                      0,
                      Math.min(
                        5,
                        Math.round(
                          product.averageRating,
                        ),
                      ),
                    );

                  const detailsPath =
                    `/Products/Details/${encodeURIComponent(
                      product.id,
                    )}`;

                  const editPath =
                    `/Admin/Products/Edit/${encodeURIComponent(
                      product.id,
                    )}`;

                  return (
                    <article
                      key={
                        product.id
                      }
                      className="relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[#272b35] bg-[#171a21] transition hover:-translate-y-0.5 hover:border-[#2f3542] hover:shadow-[0_8px_24px_rgba(0,0,0,.35)]"
                    >
                      <Link
                        to={
                          detailsPath
                        }
                        className="relative block aspect-[5/8] w-full"
                      >
                        <img
                          src={resolveProductImage(
                            product.imageUrl,
                          )}
                          alt={
                            product.name
                          }
                          className="absolute inset-0 h-full w-full object-cover p-[5px]"
                          onError={(
                            e,
                          ) => {
                            e.currentTarget.onerror =
                              null;

                            e.currentTarget.src =
                              "/images/placeholder.png";
                          }}
                        />
                      </Link>

                      <div className="flex flex-1 flex-col p-3">
                        <div className="min-h-[3.6em] overflow-hidden text-xs leading-[1.2] text-[#6c757d] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                          {
                            product.category
                          }
                        </div>

                        <h2 className="mt-2 min-h-[3.6em] overflow-hidden text-sm font-semibold leading-[1.2] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                          <Link
                            to={
                              detailsPath
                            }
                            className="text-white no-underline"
                          >
                            {
                              product.name
                            }
                          </Link>
                        </h2>

                        <div className="mt-2 flex items-center text-xs">
                          <Stars
                            rating={
                              roundedRating
                            }
                          />

                          <span className="ml-1 text-[#6c757d]">
                            (
                            {
                              product.reviewsCount
                            }
                            )
                          </span>
                        </div>

                        <div className="mt-auto pt-3 font-semibold text-[#9bd66f]">
                          {formatPrice(
                            product.price,
                          )}
                        </div>
                      </div>

                      <div className="relative z-[2] grid gap-2 px-3 pb-3">
                        <button
                          type="button"
                          onClick={() =>
                            void addToCart(
                              product,
                            )
                          }
                          disabled={
                            addingProductId !==
                            null
                          }
                          className="rounded bg-[#0d6efd] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0b5ed7] disabled:opacity-60"
                        >
                          {addingProductId ===
                          product.id
                            ? "Adding..."
                            : "Add to Cart"}
                        </button>

                        {hasRole(
                          "Admin",
                        ) && (
                          <>
                            <Link
                              to={
                                editPath
                              }
                              className="rounded bg-[#ffc107] px-3 py-1.5 text-center text-sm font-semibold text-black no-underline hover:bg-[#ffca2c]"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteProduct(
                                  product,
                                )
                              }
                              disabled={
                                deletingProductId !==
                                null
                              }
                              className="rounded border border-[#dc3545] bg-transparent px-3 py-1.5 text-sm font-semibold text-[#dc3545] hover:bg-[#dc3545] hover:text-white disabled:opacity-60"
                            >
                              {deletingProductId ===
                              product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}

          {!loading &&
            data.totalPages >
              1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={
                  data.page <=
                  1
                }
                onClick={() =>
                  apply({
                    ...filters,

                    page:
                      data.page -
                      1,
                  })
                }
                className="rounded border border-[#2a2f3a] bg-[#171a21] px-3 py-2 text-sm text-[#cfd3da] disabled:opacity-40"
              >
                Prev
              </button>

              <span className="px-2 text-sm text-[#6c757d]">
                {data.page} /{" "}
                {
                  data.totalPages
                }
              </span>

              <button
                type="button"
                disabled={
                  data.page >=
                  data.totalPages
                }
                onClick={() =>
                  apply({
                    ...filters,

                    page:
                      data.page +
                      1,
                  })
                }
                className="rounded border border-[#2a2f3a] bg-[#171a21] px-3 py-2 text-sm text-[#cfd3da] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-semibold text-[#d7dde7]">
        {title}
      </legend>

      {children}
    </fieldset>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="mb-1.5 flex cursor-pointer items-center gap-2 text-sm text-[#e6e6e6]">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={
          onChange
        }
        className="h-4 w-4 cursor-pointer accent-[#0d6efd]"
      />

      <span>
        {label}
      </span>
    </label>
  );
}

function Stars({
  rating,
}: {
  rating: number;
}) {
  return (
    <span className="whitespace-nowrap text-[#f6c441]">
      {"★".repeat(
        rating,
      )}

      <span className="text-[#6b7280]">
        {"☆".repeat(
          5 - rating,
        )}
      </span>
    </span>
  );
}