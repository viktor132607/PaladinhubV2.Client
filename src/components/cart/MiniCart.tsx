"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  backendEndpoints,
  backendUrl,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link } from "@/router/nextCompat";

export type MiniCartItem = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
};

export type MiniCartData = {
  items: MiniCartItem[];
  totalPrice: number;
};

type MiniCartProps = {
  initialItems?: MiniCartItem[];
  initialTotalPrice?: number;
  onChanged?: (data: MiniCartData) => void;
};

type CartDeltaResponse = {
  ok?: boolean;
  removed?: boolean;
  cartTotal?: number;
  cartCount?: number;
  message?: string;
};

const CART_UPDATED_EVENT =
  "paladinhub:cart-updated";

function toRecord(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toStringValue(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value
    : value === null || value === undefined
      ? fallback
      : String(value);
}

function toNumber(
  value: unknown,
  fallback = 0,
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeJson(
  value: unknown,
): MiniCartData {
  const source = toRecord(value);

  const rawItems =
    source.items ??
    source.Items ??
    source.myProducts ??
    source.MyProducts ??
    [];

  const items = Array.isArray(rawItems)
    ? rawItems
        .map((raw): MiniCartItem => {
          const item = toRecord(raw);

          return {
            id: toStringValue(
              item.id ?? item.Id,
            ).trim(),

            name:
              toStringValue(
                item.name ?? item.Name,
                "Product",
              ).trim() || "Product",

            imageUrl: toStringValue(
              item.imageUrl ??
                item.ImageUrl,
            ).trim(),

            price: Math.max(
              0,
              toNumber(
                item.price ?? item.Price,
              ),
            ),

            quantity: Math.max(
              1,
              Math.trunc(
                toNumber(
                  item.quantity ??
                    item.Quantity,
                  1,
                ),
              ),
            ),
          };
        })
        .filter((item) => item.id.length > 0)
    : [];

  const calculatedTotal = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  );

  const rawTotal =
    source.totalPrice ??
    source.TotalPrice;

  return {
    items,
    totalPrice:
      rawTotal === undefined ||
      rawTotal === null
        ? calculatedTotal
        : Math.max(
            0,
            toNumber(
              rawTotal,
              calculatedTotal,
            ),
          ),
  };
}

function resolveImageUrl(
  imageUrl: string,
): string {
  const normalized = imageUrl.trim();

  if (!normalized) {
    return "";
  }

  if (
    /^(https?:)?\/\//i.test(normalized) ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  return backendUrl(normalized);
}

function formatMoney(value: number): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} $`;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function MiniCart({
  initialItems,
  initialTotalPrice = 0,
  onChanged,
}: MiniCartProps) {
  const [data, setData] =
    useState<MiniCartData>(() => ({
      items: initialItems ?? [],
      totalPrice: initialTotalPrice,
    }));

  const [loading, setLoading] =
    useState(initialItems === undefined);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const publish = useCallback(
    (next: MiniCartData): void => {
      setData(next);
      onChanged?.(next);

      window.dispatchEvent(
        new CustomEvent<MiniCartData>(
          CART_UPDATED_EVENT,
          {
            detail: next,
          },
        ),
      );
    },
    [onChanged],
  );

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchBackend(
          backendEndpoints.cart.mini,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const result =
          await readApiJson<unknown>(response);

        if (signal?.aborted) {
          return;
        }

        publish(normalizeJson(result));
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Mini cart could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [publish],
  );

  useEffect(() => {
    if (initialItems === undefined) {
      return;
    }

    setData({
      items: initialItems,
      totalPrice: initialTotalPrice,
    });

    setLoading(false);
  }, [
    initialItems,
    initialTotalPrice,
  ]);

  useEffect(() => {
    if (initialItems !== undefined) {
      return;
    }

    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [initialItems, load]);

  useEffect(() => {
    const handleCartUpdated = (
      event: Event,
    ): void => {
      const customEvent =
        event as CustomEvent<unknown>;

      if (
        customEvent.detail !== undefined &&
        customEvent.detail !== null
      ) {
        setData(
          normalizeJson(customEvent.detail),
        );

        return;
      }

      void load();
    };

    window.addEventListener(
      CART_UPDATED_EVENT,
      handleCartUpdated,
    );

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        handleCartUpdated,
      );
    };
  }, [load]);

  const visibleItems = useMemo(
    () => data.items.slice(0, 6),
    [data.items],
  );

  const hiddenItemsCount = Math.max(
    0,
    data.items.length -
      visibleItems.length,
  );

  const remove = useCallback(
    async (
      productId: string,
    ): Promise<void> => {
      if (removingId !== null) {
        return;
      }

      setRemovingId(productId);
      setError(null);

      try {
        /*
         * fetchBackend automatically requests and sends
         * the X-CSRF-TOKEN header for POST requests.
         * The product ID is already included in the
         * endpoint query string.
         */
        const response = await fetchBackend(
          backendEndpoints.cart.remove(
            productId,
          ),
          {
            method: "POST",
            cache: "no-store",
          },
        );

        const result =
          await readApiJson<CartDeltaResponse>(
            response,
          );

        if (result?.ok === false) {
          throw new Error(
            result.message ||
              "The product could not be removed.",
          );
        }

        const remainingItems =
          data.items.filter(
            (item) =>
              item.id !== productId,
          );

        const calculatedTotal =
          remainingItems.reduce(
            (sum, item) =>
              sum +
              item.price *
                item.quantity,
            0,
          );

        publish({
          items: remainingItems,
          totalPrice:
            typeof result?.cartTotal ===
              "number" &&
            Number.isFinite(
              result.cartTotal,
            )
              ? Math.max(
                  0,
                  result.cartTotal,
                )
              : calculatedTotal,
        });
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The product could not be removed.",
        );
      } finally {
        setRemovingId(null);
      }
    },
    [
      data.items,
      publish,
      removingId,
    ],
  );

  return (
    <section
      id="mini-cart"
      className="w-[min(92vw,390px)] overflow-hidden rounded-xl border border-[#313a45] bg-[#1a1f24] text-[#e9ecef] shadow-2xl"
      aria-label="Mini cart"
      aria-busy={loading}
    >
      {loading ? (
        <div className="p-5 text-center text-sm text-[#a8b0bd]">
          Loading cart...
        </div>
      ) : null}

      {error ? (
        <div
          className="border-b border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            className="mt-2 rounded border border-red-300/40 px-3 py-1.5 font-semibold hover:bg-red-900/50"
            onClick={() => {
              void load();
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading &&
      visibleItems.length === 0 ? (
        <div className="p-5 text-center text-[#a8b0bd]">
          The cart is empty!
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <>
          <ul className="divide-y divide-[#313a45]">
            {visibleItems.map((item) => {
              const imageUrl =
                resolveImageUrl(
                  item.imageUrl,
                );

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 p-3"
                >
                  <Link
                    to={`/products/${encodeURIComponent(
                      item.id,
                    )}`}
                    className="flex min-w-0 flex-1 items-start gap-3 text-inherit no-underline"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-14 w-14 shrink-0 rounded-md border border-[#46515e] object-cover"
                      />
                    ) : (
                      <div
                        className="h-14 w-14 shrink-0 rounded-md border border-dashed border-[#46515e]"
                        aria-hidden="true"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {item.name}
                      </div>

                      <div className="mt-1 text-sm text-[#a8b0bd]">
                        {formatMoney(
                          item.price,
                        )}{" "}
                        × {item.quantity}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      void remove(item.id);
                    }}
                    disabled={
                      removingId !== null
                    }
                    title="Remove"
                    aria-label={`Remove ${item.name}`}
                    className="rounded px-2 py-1 text-xl leading-none text-[#a8b0bd] hover:bg-red-950/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingId === item.id
                      ? "…"
                      : "×"}
                  </button>
                </li>
              );
            })}
          </ul>

          {hiddenItemsCount > 0 ? (
            <div className="border-t border-[#313a45] px-4 py-2 text-center text-sm text-[#a8b0bd]">
              And {hiddenItemsCount} more{" "}
              {hiddenItemsCount === 1
                ? "item"
                : "items"}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-[#313a45] bg-[#151a1f] px-4 py-3 font-semibold">
            <span>Total:</span>
            <span>
              {formatMoney(
                data.totalPrice,
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-[#313a45] p-3">
            <Link
              to="/cart"
              className="rounded-md bg-[#3f4650] px-4 py-2.5 text-center font-semibold text-white hover:bg-[#4a525e]"
            >
              My Cart
            </Link>

            <Link
              to="/checkout"
              className="rounded-md bg-[#f6b21a] px-4 py-2.5 text-center font-semibold text-white hover:bg-[#e0a10f]"
            >
              Buy
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}