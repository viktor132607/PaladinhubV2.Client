"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  backendEndpoints,
  backendUrl,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link } from "@/router/nextCompat";

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
  productId?: string;
  removed?: boolean;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  cartTotal?: number;
  cartCount?: number;
  cleared?: boolean;
  message?: string;
};

type CartAction =
  | "increase"
  | "decrease"
  | "remove";

const CART_UPDATED_EVENT =
  "paladinhub:cart-updated";

const emptyCart: CartData = {
  items: [],
  totalPrice: 0,
};

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function finiteNumber(
  value: unknown,
  fallback = 0,
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeCart(
  payload: unknown,
): CartData {
  const root = asRecord(payload);

  const rawItems =
    root.items ??
    root.Items ??
    root.myProducts ??
    root.MyProducts ??
    [];

  const items = Array.isArray(rawItems)
    ? rawItems
        .map((entry): CartItem | null => {
          const item = asRecord(entry);

          const id = String(
            item.id ??
              item.Id ??
              "",
          ).trim();

          if (!id) {
            return null;
          }

          const name = String(
            item.name ??
              item.Name ??
              "Product",
          ).trim();

          const imageUrl = String(
            item.imageUrl ??
              item.ImageUrl ??
              "",
          ).trim();

          return {
            id,

            name:
              name || "Product",

            imageUrl,

            price: Math.max(
              0,
              finiteNumber(
                item.price ??
                  item.Price,
              ),
            ),

            quantity: Math.max(
              1,
              Math.trunc(
                finiteNumber(
                  item.quantity ??
                    item.Quantity,
                  1,
                ),
              ),
            ),
          };
        })
        .filter(
          (
            item,
          ): item is CartItem =>
            item !== null,
        )
    : [];

  const calculatedTotal =
    items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0,
    );

  const rawTotal =
    root.totalPrice ??
    root.TotalPrice;

  return {
    items,

    totalPrice:
      rawTotal === null ||
      rawTotal === undefined
        ? calculatedTotal
        : Math.max(
            0,
            finiteNumber(
              rawTotal,
              calculatedTotal,
            ),
          ),
  };
}

function resolveImageUrl(
  value: string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    return "";
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

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function Cart() {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [cart, setCart] =
    useState<CartData>(emptyCart);

  const [loading, setLoading] =
    useState(true);

  const [
    busyAction,
    setBusyAction,
  ] = useState<{
    id: string;
    action: CartAction | "clear";
  } | null>(null);

  const [
    cancelOpen,
    setCancelOpen,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const publishCart = useCallback(
    (
      nextCart: CartData,
    ): void => {
      setCart(nextCart);

      window.dispatchEvent(
        new CustomEvent<CartData>(
          CART_UPDATED_EVENT,
          {
            detail: nextCart,
          },
        ),
      );
    },
    [],
  );

  const reload = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      if (!isAuthenticated) {
        setCart(emptyCart);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.cart.index,
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

        if (!signal?.aborted) {
          setCart(
            normalizeCart(payload),
          );
        }
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
            : "Your cart could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const controller =
      new AbortController();

    void reload(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [
    authLoading,
    reload,
  ]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setNotice(null);
        },
        2600,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [notice]);

  useEffect(() => {
    if (!cancelOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ): void => {
      if (
        event.key === "Escape" &&
        busyAction === null
      ) {
        setCancelOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    busyAction,
    cancelOpen,
  ]);

  const runAction = useCallback(
    async (
      action: CartAction,
      productId: string,
    ): Promise<void> => {
      if (busyAction !== null) {
        return;
      }

      setBusyAction({
        id: productId,
        action,
      });

      setError(null);
      setNotice(null);

      try {
        const path =
          action === "increase"
            ? backendEndpoints.cart.increase(
                productId,
              )
            : action === "decrease"
              ? backendEndpoints.cart.decrease(
                  productId,
                )
              : backendEndpoints.cart.remove(
                  productId,
                );

        const response =
          await fetchBackend(
            path,
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
              "The cart could not be updated.",
          );
        }

        const currentItem =
          cart.items.find(
            (item) =>
              item.id === productId,
          );

        if (!currentItem) {
          await reload();
          return;
        }

        const fallbackQuantity =
          action === "increase"
            ? currentItem.quantity + 1
            : action === "decrease"
              ? Math.max(
                  0,
                  currentItem.quantity - 1,
                )
              : 0;

        const nextQuantity =
          typeof result?.quantity ===
            "number" &&
          Number.isFinite(
            result.quantity,
          )
            ? Math.max(
                0,
                Math.trunc(
                  result.quantity,
                ),
              )
            : fallbackQuantity;

        const shouldRemove =
          action === "remove" ||
          result?.removed === true ||
          nextQuantity <= 0;

        const nextItems =
          shouldRemove
            ? cart.items.filter(
                (item) =>
                  item.id !==
                  productId,
              )
            : cart.items.map(
                (item) =>
                  item.id ===
                  productId
                    ? {
                        ...item,
                        quantity:
                          nextQuantity,
                      }
                    : item,
              );

        const calculatedTotal =
          nextItems.reduce(
            (sum, item) =>
              sum +
              item.price *
                item.quantity,
            0,
          );

        const nextCart: CartData = {
          items: nextItems,

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
        };

        publishCart(nextCart);

        setNotice(
          result?.message ||
            (shouldRemove
              ? "The product was removed from your cart."
              : "Cart quantity updated."),
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The cart could not be updated.",
        );
      } finally {
        setBusyAction(null);
      }
    },
    [
      busyAction,
      cart.items,
      publishCart,
      reload,
    ],
  );

  const clearCart =
    useCallback(
      async (): Promise<void> => {
        if (busyAction !== null) {
          return;
        }

        setBusyAction({
          id: "__clear__",
          action: "clear",
        });

        setError(null);
        setNotice(null);

        try {
          const response =
            await fetchBackend(
              backendEndpoints.cart.cancel,
              {
                method: "POST",
                cache: "no-store",
              },
            );

          const result =
            await readApiJson<CartDeltaResponse>(
              response,
            );

          if (
            result?.ok === false
          ) {
            throw new Error(
              result.message ||
                "The cart could not be cleared.",
            );
          }

          publishCart(emptyCart);

          setCancelOpen(false);

          setNotice(
            result?.message ||
              "Cart was cleared.",
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "The cart could not be cleared.",
          );
        } finally {
          setBusyAction(null);
        }
      },
      [
        busyAction,
        publishCart,
      ],
    );

  const busyId =
    busyAction?.id ?? null;

  const pageLoading =
    authLoading || loading;

  if (
    !authLoading &&
    !isAuthenticated
  ) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
        <section className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-blue-400/30 bg-blue-950/20 p-10 text-center">
            <h1 className="text-3xl font-semibold text-[#ff5fb3]">
              My Cart
            </h1>

            <p className="mt-4 text-[#cfd6df]">
              Sign in to open your cart.
            </p>

            <Link
              to="/login"
              className="mt-5 inline-block rounded-md bg-[#f6b21a] px-5 py-2.5 font-semibold text-white hover:bg-[#e0a10f]"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-center text-3xl font-semibold text-[#ff5fb3]">
          My Cart
        </h1>

        <div
          aria-live="polite"
          aria-atomic="true"
        >
          {notice ? (
            <div
              className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-emerald-200"
              role="status"
            >
              ✓ {notice}
            </div>
          ) : null}

          {error ? (
            <div
              className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200"
              role="alert"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() => {
                  void reload();
                }}
                className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40"
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>

        {pageLoading ? (
          <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-10 text-center text-[#a8b0bd]">
            Loading your cart...
          </div>
        ) : null}

        {!pageLoading &&
        !error &&
        cart.items.length === 0 ? (
          <div className="rounded-xl border border-blue-400/30 bg-blue-950/20 p-10 text-center">
            <div
              className="text-5xl"
              aria-hidden="true"
            >
              🛒
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Your cart is empty.
            </h2>

            <Link
              to="/products"
              className="mt-5 inline-block rounded-md bg-[#f6b21a] px-5 py-2.5 font-semibold text-white hover:bg-[#e0a10f]"
            >
              Browse merchandise
            </Link>
          </div>
        ) : null}

        {!pageLoading &&
        cart.items.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[#313a45] bg-[#1a1f24] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="border-b border-[#313a45] bg-[#151a1f] text-sm uppercase tracking-wide text-[#a8b0bd]">
                  <tr>
                    <th className="w-[84px] px-5 py-4">
                      <span className="sr-only">
                        Image
                      </span>
                    </th>

                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="w-[190px] px-5 py-4 text-center">
                      Quantity
                    </th>

                    <th className="w-[130px] px-5 py-4 text-right">
                      Price
                    </th>

                    <th className="w-[150px] px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#313a45]">
                  {cart.items.map(
                    (item) => {
                      const imageUrl =
                        resolveImageUrl(
                          item.imageUrl,
                        );

                      const productPath =
                        `/products/${encodeURIComponent(
                          item.id,
                        )}`;

                      const itemBusy =
                        busyId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#20262d]"
                        >
                          <td className="px-5 py-4">
                            <Link
                              to={
                                productPath
                              }
                            >
                              {imageUrl ? (
                                <img
                                  src={
                                    imageUrl
                                  }
                                  alt={
                                    item.name
                                  }
                                  className="h-14 w-14 rounded-md border border-[#46515e] object-cover"
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
                              ) : (
                                <div
                                  className="h-14 w-14 rounded-md border border-dashed border-[#46515e]"
                                  aria-hidden="true"
                                />
                              )}
                            </Link>
                          </td>

                          <td className="px-5 py-4">
                            <Link
                              to={
                                productPath
                              }
                              className="font-semibold text-white hover:text-[#ff5fb3]"
                            >
                              {item.name}
                            </Link>
                          </td>

                          <td className="px-5 py-4">
                            <div className="mx-auto flex w-fit items-center overflow-hidden rounded-md border border-[#46515e]">
                              <button
                                type="button"
                                onClick={() => {
                                  void runAction(
                                    "decrease",
                                    item.id,
                                  );
                                }}
                                disabled={
                                  busyAction !==
                                  null
                                }
                                aria-label={`Decrease ${item.name} quantity`}
                                className="h-9 w-10 bg-[#151a1f] text-xl hover:bg-[#2a3139] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                −
                              </button>

                              <span className="min-w-12 px-3 text-center font-semibold">
                                {itemBusy
                                  ? "…"
                                  : item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  void runAction(
                                    "increase",
                                    item.id,
                                  );
                                }}
                                disabled={
                                  busyAction !==
                                  null
                                }
                                aria-label={`Increase ${item.name} quantity`}
                                className="h-9 w-10 bg-[#151a1f] text-xl hover:bg-[#2a3139] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div>
                              {formatMoney(
                                item.price,
                              )}
                            </div>

                            {item.quantity >
                            1 ? (
                              <div className="mt-1 text-xs text-[#a8b0bd]">
                                {formatMoney(
                                  item.price *
                                    item.quantity,
                                )}{" "}
                                total
                              </div>
                            ) : null}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                void runAction(
                                  "remove",
                                  item.id,
                                );
                              }}
                              disabled={
                                busyAction !==
                                null
                              }
                              className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {itemBusy
                                ? "Working..."
                                : "Remove"}
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#313a45] bg-[#151a1f] px-5 py-5">
              <h2 className="text-xl font-semibold">
                Total:{" "}
                <span className="text-[#ff5fb3]">
                  {formatMoney(
                    cart.totalPrice,
                  )}
                </span>
              </h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/checkout"
                  className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500"
                >
                  Buy
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setCancelOpen(true);
                  }}
                  disabled={
                    busyAction !== null
                  }
                  className="rounded-md bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear cart
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {cancelOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-cart-title"
          onMouseDown={(
            event,
          ) => {
            if (
              event.currentTarget ===
                event.target &&
              busyAction === null
            ) {
              setCancelOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-[#313a45] bg-[#171a21] text-[#e6e6e6] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#313a45] px-5 py-4">
              <h2
                id="cancel-cart-title"
                className="text-lg font-semibold"
              >
                Clear cart?
              </h2>

              <button
                type="button"
                onClick={() => {
                  setCancelOpen(false);
                }}
                disabled={
                  busyAction !== null
                }
                className="rounded px-2 py-1 text-xl text-[#a8b0bd] hover:bg-[#252b33] disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-5 text-[#cfd6df]">
              This will remove all items
              from your cart.
            </div>

            <div className="flex justify-end gap-3 border-t border-[#313a45] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setCancelOpen(false);
                }}
                disabled={
                  busyAction !== null
                }
                className="rounded-md border border-[#46515e] px-4 py-2 font-semibold hover:bg-[#252b33] disabled:opacity-50"
              >
                Keep cart
              </button>

              <button
                type="button"
                onClick={() => {
                  void clearCart();
                }}
                disabled={
                  busyAction !== null
                }
                className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyId === "__clear__"
                  ? "Clearing..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}