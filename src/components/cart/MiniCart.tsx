"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { backendEndpoints, backendUrl, fetchBackend, readApiJson } from "@/config/api";
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

const CART_UPDATED_EVENT = "paladinhub:cart-updated";

function toRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string"
    ? value
    : value === null || value === undefined
      ? fallback
      : String(value);
}

function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeJson(value: unknown): MiniCartData {
  const source = toRecord(value);
  const rawItems = source.items ?? source.Items ?? source.myProducts ?? source.MyProducts ?? [];

  const items = Array.isArray(rawItems)
    ? rawItems
        .map((raw): MiniCartItem => {
          const item = toRecord(raw);
          return {
            id: toStringValue(item.id ?? item.Id).trim(),
            name: toStringValue(item.name ?? item.Name, "Product").trim() || "Product",
            imageUrl: toStringValue(item.imageUrl ?? item.ImageUrl).trim(),
            price: Math.max(0, toNumber(item.price ?? item.Price)),
            quantity: Math.max(1, Math.trunc(toNumber(item.quantity ?? item.Quantity, 1))),
          };
        })
        .filter((item) => item.id.length > 0)
    : [];

  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const rawTotal = source.totalPrice ?? source.TotalPrice;

  return {
    items,
    totalPrice:
      rawTotal === undefined || rawTotal === null
        ? calculatedTotal
        : Math.max(0, toNumber(rawTotal, calculatedTotal)),
  };
}

function resolveImageUrl(imageUrl: string): string {
  const normalized = imageUrl.trim();
  if (!normalized) return "";

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
  return error instanceof DOMException && error.name === "AbortError";
}

export default function MiniCart({
  initialItems,
  initialTotalPrice = 0,
  onChanged,
}: MiniCartProps) {
  const [data, setData] = useState<MiniCartData>(() => ({
    items: initialItems ?? [],
    totalPrice: initialTotalPrice,
  }));
  const [loading, setLoading] = useState(initialItems === undefined);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publish = useCallback(
    (next: MiniCartData): void => {
      setData(next);
      onChanged?.(next);
      window.dispatchEvent(new CustomEvent<MiniCartData>(CART_UPDATED_EVENT, { detail: next }));
    },
    [onChanged],
  );

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchBackend(backendEndpoints.cart.mini, {
          method: "GET",
          cache: "no-store",
          signal,
        });
        const result = await readApiJson<unknown>(response);
        if (signal?.aborted) return;
        publish(normalizeJson(result));
      } catch (caught) {
        if (signal?.aborted || isAbortError(caught)) return;
        setError(caught instanceof Error ? caught.message : "Mini cart could not be loaded.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [publish],
  );

  useEffect(() => {
    if (initialItems === undefined) return;
    setData({ items: initialItems, totalPrice: initialTotalPrice });
    setLoading(false);
  }, [initialItems, initialTotalPrice]);

  useEffect(() => {
    if (initialItems !== undefined) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [initialItems, load]);

  useEffect(() => {
    const handleCartUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<unknown>;
      if (customEvent.detail !== undefined && customEvent.detail !== null) {
        setData(normalizeJson(customEvent.detail));
        return;
      }
      void load();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
  }, [load]);

  const visibleItems = useMemo(() => data.items.slice(0, 6), [data.items]);

  const remove = useCallback(
    async (productId: string): Promise<void> => {
      if (removingId !== null) return;

      setRemovingId(productId);
      setError(null);

      try {
        const response = await fetchBackend(backendEndpoints.cart.remove(productId), {
          method: "POST",
          cache: "no-store",
        });
        const result = await readApiJson<CartDeltaResponse>(response);

        if (result?.ok === false) {
          throw new Error(result.message || "The product could not be removed.");
        }

        const remainingItems = data.items.filter((item) => item.id !== productId);
        const calculatedTotal = remainingItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        publish({
          items: remainingItems,
          totalPrice:
            typeof result?.cartTotal === "number" && Number.isFinite(result.cartTotal)
              ? Math.max(0, result.cartTotal)
              : calculatedTotal,
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The product could not be removed.");
      } finally {
        setRemovingId(null);
      }
    },
    [data.items, publish, removingId],
  );

  return (
    <section
      id="mini-cart"
      className="mini-cart w-[min(92vw,360px)] overflow-hidden rounded-[10px] border border-[#2a2a2a] bg-[#111] text-[14px] text-[#eee] shadow-[0_12px_30px_rgba(0,0,0,.6)] [font-family:'Segoe_UI',Roboto,Arial,sans-serif]"
      aria-label="Mini cart"
      aria-busy={loading}
    >
      {loading ? (
        <div className="p-3 text-center text-[#a7a7a7]">Loading cart...</div>
      ) : null}

      {error ? (
        <div className="border-b border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-red-300" role="alert">
          <span>{error}</span>{" "}
          <button type="button" className="font-semibold underline" onClick={() => void load()}>
            Try again
          </button>
        </div>
      ) : null}

      {!loading && visibleItems.length === 0 ? (
        <div className="p-3 text-center text-[#a7a7a7]">The cart is empty!</div>
      ) : null}

      {visibleItems.length > 0 ? (
        <>
          <ul className="mini-cart-list mb-0 max-h-[360px] list-none overflow-y-auto bg-[#1a1a1a] p-0">
            {visibleItems.map((item) => {
              const imageUrl = resolveImageUrl(item.imageUrl);
              return (
                <li
                  key={item.id}
                  className="mini-cart-item flex items-center gap-[10px] border-b border-[#2a2a2a] bg-[#1a1a1a] px-3 py-[10px] last:border-b-0"
                >
                  <Link
                    to={`/products/${encodeURIComponent(item.id)}`}
                    className="mini-cart-link group flex min-w-0 flex-1 items-start text-inherit no-underline"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="mini-cart-thumb h-[52px] w-[52px] shrink-0 rounded-md border border-[#333] object-cover"
                      />
                    ) : (
                      <div className="h-[52px] w-[52px] shrink-0 rounded-md border border-[#333] bg-[#111]" aria-hidden="true" />
                    )}

                    <div className="mini-cart-text min-w-0 pl-[6px]">
                      <div className="mini-cart-name truncate font-semibold text-white transition-colors group-hover:text-[#ff5fb3]">
                        {item.name}
                      </div>
                      <div className="mini-cart-meta mt-1 text-white">
                        {formatMoney(item.price)} × {item.quantity}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => void remove(item.id)}
                    disabled={removingId !== null}
                    title="Remove"
                    aria-label={`Remove ${item.name}`}
                    className="mini-remove shrink-0 bg-transparent px-1 text-[22px] leading-none text-white opacity-90 transition hover:scale-[1.06] hover:text-[#cfcfcf] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {removingId === item.id ? "…" : "×"}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mini-cart-total flex items-center justify-between border-t border-[#2a2a2a] bg-[#1f1f1f] px-3 py-[10px] font-extrabold text-white">
            <span>Total:</span>
            <span>{formatMoney(data.totalPrice)}</span>
          </div>

          <div className="mini-cart-actions grid grid-cols-2 gap-[10px] border-t border-[#2a2a2a] bg-[#111] p-3">
            <Link
              to="/cart"
              className="go-to-cart-btn rounded-md border border-[#3b3b3b] bg-[#242424] px-4 py-[9px] text-center font-semibold text-white no-underline transition hover:-translate-y-px hover:brightness-110 hover:shadow-lg"
            >
              My Cart
            </Link>

            <Link
              to="/checkout"
              className="mini-buy-btn rounded-md border border-[#e0a10f] bg-[#f6b21a] px-4 py-[9px] text-center font-semibold text-[#111] no-underline transition hover:-translate-y-px hover:brightness-110 hover:shadow-lg"
            >
              Buy
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
