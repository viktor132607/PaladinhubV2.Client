"use client";

import { useCurrency } from "@/currency/CurrencyContext";

import { useCallback, useEffect, useState } from "react";
import {
  backendEndpoints,
  backendUrl,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link } from "@/router/nextCompat";
import styles from "./Cart.module.css";

type CartItem = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
};

type CartData = {
  items: CartItem[];
  totalPrice: number;
};

type CartDeltaResponse = {
  ok?: boolean;
  removed?: boolean;
  quantity?: number;
  cartTotal?: number;
  message?: string;
};

type CartAction = "increase" | "decrease" | "remove";

const CART_UPDATED_EVENT = "paladinhub:cart-updated";
const emptyCart: CartData = { items: [], totalPrice: 0 };

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeCart(payload: unknown): CartData {
  const root = asRecord(payload);
  const source = root.items ?? root.Items ?? root.myProducts ?? root.MyProducts ?? [];

  const items = Array.isArray(source)
    ? source
        .map((entry): CartItem | null => {
          const item = asRecord(entry);
          const id = String(item.id ?? item.Id ?? "").trim();
          if (!id) return null;

          return {
            id,
            name: String(item.name ?? item.Name ?? "Product").trim() || "Product",
            imageUrl: String(item.imageUrl ?? item.ImageUrl ?? "").trim(),
            price: Math.max(0, finiteNumber(item.price ?? item.Price)),
            quantity: Math.max(
              1,
              Math.trunc(finiteNumber(item.quantity ?? item.Quantity, 1)),
            ),
          };
        })
        .filter((item): item is CartItem => item !== null)
    : [];

  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const rawTotal = root.totalPrice ?? root.TotalPrice;

  return {
    items,
    totalPrice:
      rawTotal === null || rawTotal === undefined
        ? calculatedTotal
        : Math.max(0, finiteNumber(rawTotal, calculatedTotal)),
  };
}

function resolveImageUrl(value: string): string {
  const normalized = value.trim();
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export default function Cart() {
  const { formatMoney } = useCurrency();
  const [cart, setCart] = useState<CartData>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<{
    id: string;
    action: CartAction | "clear";
  } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const publishCart = useCallback((nextCart: CartData): void => {
    setCart(nextCart);
    window.dispatchEvent(
      new CustomEvent<CartData>(CART_UPDATED_EVENT, { detail: nextCart }),
    );
  }, []);

  const reload = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchBackend(backendEndpoints.cart.index, {
        method: "GET",
        cache: "no-store",
        signal,
      });
      const payload = await readApiJson<unknown>(response);
      if (!signal?.aborted) setCart(normalizeCart(payload));
    } catch (caught) {
      if (signal?.aborted || isAbortError(caught)) return;
      setError(
        caught instanceof Error ? caught.message : "Your cart could not be loaded.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!cancelOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && busyAction === null) setCancelOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busyAction, cancelOpen]);

  const runAction = useCallback(
    async (action: CartAction, productId: string): Promise<void> => {
      if (busyAction !== null) return;

      setBusyAction({ id: productId, action });
      setError(null);
      setNotice(null);

      try {
        const path =
          action === "increase"
            ? backendEndpoints.cart.increase(productId)
            : action === "decrease"
              ? backendEndpoints.cart.decrease(productId)
              : backendEndpoints.cart.remove(productId);

        const response = await fetchBackend(path, {
          method: "POST",
          cache: "no-store",
        });
        const result = await readApiJson<CartDeltaResponse>(response);

        if (result?.ok === false) {
          throw new Error(result.message || "The cart could not be updated.");
        }

        const currentItem = cart.items.find((item) => item.id === productId);
        if (!currentItem) {
          await reload();
          return;
        }

        const fallbackQuantity =
          action === "increase"
            ? currentItem.quantity + 1
            : action === "decrease"
              ? Math.max(0, currentItem.quantity - 1)
              : 0;
        const nextQuantity =
          typeof result?.quantity === "number" && Number.isFinite(result.quantity)
            ? Math.max(0, Math.trunc(result.quantity))
            : fallbackQuantity;
        const shouldRemove =
          action === "remove" || result?.removed === true || nextQuantity <= 0;

        const nextItems = shouldRemove
          ? cart.items.filter((item) => item.id !== productId)
          : cart.items.map((item) =>
              item.id === productId ? { ...item, quantity: nextQuantity } : item,
            );
        const calculatedTotal = nextItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        publishCart({
          items: nextItems,
          totalPrice:
            typeof result?.cartTotal === "number" && Number.isFinite(result.cartTotal)
              ? Math.max(0, result.cartTotal)
              : calculatedTotal,
        });
        setNotice(
          result?.message ||
            (shouldRemove ? "The product was removed from your cart." : "Cart quantity updated."),
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "The cart could not be updated.",
        );
      } finally {
        setBusyAction(null);
      }
    },
    [busyAction, cart.items, publishCart, reload],
  );

  const clearCart = useCallback(async (): Promise<void> => {
    if (busyAction !== null) return;

    setBusyAction({ id: "__clear__", action: "clear" });
    setError(null);
    setNotice(null);

    try {
      const response = await fetchBackend(backendEndpoints.cart.cancel, {
        method: "POST",
        cache: "no-store",
      });
      const result = await readApiJson<CartDeltaResponse>(response);
      if (result?.ok === false) {
        throw new Error(result.message || "The cart could not be cleared.");
      }

      publishCart(emptyCart);
      setCancelOpen(false);
      setNotice(result?.message || "Cart was cleared.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The cart could not be cleared.",
      );
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, publishCart]);

  const busyId = busyAction?.id ?? null;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Merchandise</p>
            <h1>My Cart</h1>
            {!loading && cart.items.length > 0 ? <p>{itemCount} {itemCount === 1 ? "item" : "items"} in your cart</p> : null}
          </div>
          <Link to="/products" className={styles.continueLink}>Continue shopping <span aria-hidden="true">→</span></Link>
        </header>

        {notice ? (
          <div className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-emerald-200" role="status">
            ✓ {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40"
            >
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.loading}>
            Loading your cart...
          </div>
        ) : null}

        {!loading && !error && cart.items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true"><i className="fa-solid fa-cart-shopping" /></div>
            <h2>Your cart is empty.</h2>
            <p>Explore the merchandise and add something you like.</p>
            <Link
              to="/products"
              className={styles.primaryButton}
            >
              Browse merchandise
            </Link>
          </div>
        ) : null}

        {!loading && cart.items.length > 0 ? (
          <div className={styles.layout}>
            <div className={styles.products}>
              <h2>Products <span>{itemCount}</span></h2>
              {cart.items.map((item) => {
                const imageUrl = resolveImageUrl(item.imageUrl);
                const productPath = `/products/${encodeURIComponent(item.id)}`;
                const itemBusy = busyId === item.id;
                return (
                  <article key={item.id} className={styles.product}>
                    <Link to={productPath} className={styles.imageLink} aria-label={`View ${item.name}`}>
                      <img src={imageUrl || "/placeholder-image.jpg"} alt={item.name} loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/placeholder-image.jpg";
                        }} />
                    </Link>
                    <div className={styles.productInfo}>
                      <Link to={productPath} className={styles.productName}>{item.name}</Link>
                      <span className={styles.unitPrice}>{formatMoney(item.price)} each</span>
                      <div className={styles.productControls}>
                        <div className={styles.quantity} aria-label={`Quantity of ${item.name}`}>
                          <button type="button" onClick={() => void runAction("decrease", item.id)} disabled={busyAction !== null} aria-label={`Decrease ${item.name} quantity`}>−</button>
                          <span aria-live="polite">{itemBusy ? "…" : item.quantity}</span>
                          <button type="button" onClick={() => void runAction("increase", item.id)} disabled={busyAction !== null} aria-label={`Increase ${item.name} quantity`}>+</button>
                        </div>
                        <button type="button" onClick={() => void runAction("remove", item.id)} disabled={busyAction !== null} className={styles.remove}>
                          {itemBusy ? "Working..." : "Remove"}
                        </button>
                      </div>
                    </div>
                    <strong className={styles.lineTotal}>{formatMoney(item.price * item.quantity)}</strong>
                  </article>
                );
              })}
            </div>
            <aside className={styles.summary} aria-label="Order summary">
              <h2>Order summary</h2>
              <div className={styles.summaryRow}><span>Items ({itemCount})</span><span>{formatMoney(cart.totalPrice)}</span></div>
              <div className={styles.summaryTotal}><span>Subtotal</span><strong>{formatMoney(cart.totalPrice)}</strong></div>
              <p>Shipping and payment details are selected during checkout.</p>
              <Link to="/Checkout/Shipping" className={styles.primaryButton}>Proceed to checkout <span aria-hidden="true">→</span></Link>
              <button type="button" onClick={() => setCancelOpen(true)} disabled={busyAction !== null} className={styles.clear}>
                Clear cart
              </button>
            </aside>
          </div>
        ) : null}
      </section>

      {cancelOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-cart-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && busyAction === null) setCancelOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-[#313a45] bg-[#171a21] text-[#e6e6e6] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#313a45] px-5 py-4">
              <h2 id="cancel-cart-title" className="text-lg font-semibold">Clear cart?</h2>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                disabled={busyAction !== null}
                className="rounded px-2 py-1 text-xl text-[#a8b0bd] hover:bg-[#252b33] disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-5 text-[#cfd6df]">This will remove all items from your cart.</div>
            <div className="flex justify-end gap-3 border-t border-[#313a45] px-5 py-4">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                disabled={busyAction !== null}
                className="rounded-md border border-[#46515e] px-4 py-2 font-semibold hover:bg-[#252b33] disabled:opacity-50"
              >
                Keep cart
              </button>
              <button
                type="button"
                onClick={() => void clearCart()}
                disabled={busyAction !== null}
                className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {busyId === "__clear__" ? "Clearing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
