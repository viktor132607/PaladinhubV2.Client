"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
} from "@/config/api";
import {
  Link,
  useNavigate,
} from "@/router/nextCompat";

type PaymentMethod =
  | "Card"
  | "CashOnDelivery"
  | "Balance";

type ShippingInfo = {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
};

type CheckoutReviewData = {
  shipping: ShippingInfo | null;
  paymentMethod: PaymentMethod | null;
  total: number;
  items: number;
  walletBalance: number | null;
  paymentError: string | null;
  orderId: string | null;
};

type PlaceOrderResponse = {
  ok?: boolean;
  redirect?: string;
  orderId?: string;
  paymentError?: string;
  message?: string;
};

type JsonRecord =
  Record<string, unknown>;

const emptyReview: CheckoutReviewData = {
  shipping: null,
  paymentMethod: null,
  total: 0,
  items: 0,
  walletBalance: null,
  paymentError: null,
  orderId: null,
};

class CheckoutResponseError extends Error {
  readonly redirect: string | null;
  readonly paymentError: string | null;

  constructor(
    message: string,
    redirect?: unknown,
    paymentError?: unknown,
  ) {
    super(message);

    this.name =
      "CheckoutResponseError";

    this.redirect =
      typeof redirect === "string" &&
      redirect.trim()
        ? redirect.trim()
        : null;

    this.paymentError =
      typeof paymentError === "string" &&
      paymentError.trim()
        ? paymentError.trim()
        : null;
  }
}

function asRecord(
  value: unknown,
): JsonRecord {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function stringValue(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function numberValue(
  value: unknown,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function nullableNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function normalizeShipping(
  value: unknown,
): ShippingInfo | null {
  const source = asRecord(value);

  const shipping: ShippingInfo = {
    fullName: stringValue(
      source.fullName ??
        source.FullName,
    ),

    address: stringValue(
      source.address ??
        source.Address,
    ),

    city: stringValue(
      source.city ??
        source.City,
    ),

    postalCode: stringValue(
      source.postalCode ??
        source.PostalCode,
    ),

    country: stringValue(
      source.country ??
        source.Country,
    ),

    phone: stringValue(
      source.phone ??
        source.Phone,
    ),

    email: stringValue(
      source.email ??
        source.Email,
    ),
  };

  return shipping.fullName ||
    shipping.address ||
    shipping.city ||
    shipping.postalCode ||
    shipping.country ||
    shipping.phone ||
    shipping.email
    ? shipping
    : null;
}

function normalizePaymentMethod(
  value: unknown,
): PaymentMethod | null {
  if (
    value === 0 ||
    value === "0" ||
    value === "Card"
  ) {
    return "Card";
  }

  if (
    value === 1 ||
    value === "1" ||
    value === "CashOnDelivery"
  ) {
    return "CashOnDelivery";
  }

  if (
    value === 2 ||
    value === "2" ||
    value === "Balance"
  ) {
    return "Balance";
  }

  return null;
}

function normalizeReview(
  value: unknown,
): CheckoutReviewData {
  const source = asRecord(value);

  return {
    shipping: normalizeShipping(
      source.shipping ??
        source.Shipping,
    ),

    paymentMethod:
      normalizePaymentMethod(
        source.paymentMethod ??
          source.PaymentMethod,
      ),

    total: Math.max(
      0,
      numberValue(
        source.total ??
          source.Total,
      ),
    ),

    items: Math.max(
      0,
      Math.trunc(
        numberValue(
          source.items ??
            source.Items,
        ),
      ),
    ),

    walletBalance:
      nullableNumber(
        source.walletBalance ??
          source.WalletBalance,
      ),

    paymentError:
      stringValue(
        source.paymentError ??
          source.PaymentError,
      ) || null,

    orderId:
      stringValue(
        source.orderId ??
          source.OrderId,
      ) || null,
  };
}

async function readCheckoutJson<T>(
  response: Response,
): Promise<T> {
  const responseText =
    await response
      .text()
      .catch(() => "");

  let payload: unknown = null;

  if (responseText.trim()) {
    try {
      payload =
        JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const source =
      asRecord(payload);

    const message =
      stringValue(
        source.message ??
          source.Message ??
          source.title ??
          source.Title ??
          source.error ??
          source.Error,
      ) ||
      responseText.trim() ||
      `Request failed with status ${response.status}.`;

    throw new CheckoutResponseError(
      message,
      source.redirect ??
        source.Redirect,
      source.paymentError ??
        source.PaymentError,
    );
  }

  return payload as T;
}

function paymentLabel(
  method: PaymentMethod | null,
): string {
  switch (method) {
    case "Card":
      return "Card";

    case "CashOnDelivery":
      return "Cash on delivery";

    case "Balance":
      return "Wallet Balance";

    default:
      return "Not selected";
  }
}

function formatMoney(
  amount: number,
): string {
  return new Intl.NumberFormat(
    undefined,
    {
      style: "currency",
      currency: "USD",
    },
  ).format(amount);
}

function appendOrderId(
  route: string,
  orderId: string | undefined,
): string {
  const normalizedOrderId =
    orderId?.trim();

  if (
    !normalizedOrderId ||
    route.includes("orderId=")
  ) {
    return route;
  }

  const separator =
    route.includes("?")
      ? "&"
      : "?";

  return (
    `${route}${separator}` +
    `orderId=${encodeURIComponent(
      normalizedOrderId,
    )}`
  );
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function Review() {
  const navigate = useNavigate();

  const [data, setData] =
    useState<CheckoutReviewData>(
      emptyReview,
    );

  const [loading, setLoading] =
    useState(true);

  const [placing, setPlacing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    paymentError,
    setPaymentError,
  ] = useState<string | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      setPaymentError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.checkout
              .review,
            {
              method: "GET",
              cache: "no-store",
              signal,

              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const payload =
          await readCheckoutJson<unknown>(
            response,
          );

        if (signal?.aborted) {
          return;
        }

        const review =
          normalizeReview(payload);

        setData(review);
        setPaymentError(
          review.paymentError,
        );
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        if (
          caught instanceof
            CheckoutResponseError &&
          caught.redirect
        ) {
          navigate(
            caught.redirect,
            {
              replace: true,
            },
          );

          return;
        }

        setData(emptyReview);

        setError(
          caught instanceof Error
            ? caught.message
            : "Checkout details could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [navigate],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const missingDetails =
    !data.shipping ||
    !data.paymentMethod;

  const cannotPlace =
    loading ||
    placing ||
    missingDetails ||
    data.items <= 0 ||
    data.total <= 0 ||
    Boolean(paymentError);

  const placeOrder =
    async (): Promise<void> => {
      if (cannotPlace) {
        return;
      }

      setPlacing(true);
      setError(null);
      setPaymentError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.checkout
              .placeOrder,
            {
              method: "POST",
              cache: "no-store",

              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const result =
          await readCheckoutJson<PlaceOrderResponse>(
            response,
          );

        if (result.ok === false) {
          throw new CheckoutResponseError(
            result.message ||
              "The order could not be placed.",
            result.redirect,
            result.paymentError,
          );
        }

        if (result.paymentError) {
          setPaymentError(
            result.paymentError,
          );
          return;
        }

        const route =
          appendOrderId(
            result.redirect ||
              "/Checkout/Success",
            result.orderId,
          );

        navigate(route);
      } catch (caught) {
        if (
          caught instanceof
          CheckoutResponseError
        ) {
          if (caught.paymentError) {
            setPaymentError(
              caught.paymentError,
            );
          }

          if (
            caught.redirect &&
            caught.redirect.toLowerCase() !==
              "/checkout/review"
          ) {
            navigate(
              caught.redirect,
              {
                replace: true,
              },
            );

            return;
          }
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "The order could not be placed.",
        );
      } finally {
        setPlacing(false);
      }
    };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section
        id="checkout-review"
        className="mx-auto max-w-3xl"
      >
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">
          Checkout
        </p>

        <h1 className="mt-2 text-center text-3xl font-semibold text-[#8ab4ff]">
          Overview
        </h1>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200"
            role="alert"
          >
            <p>{error}</p>

            {!data.shipping ? (
              <button
                type="button"
                onClick={() => {
                  void load();
                }}
                disabled={loading}
                className="mt-3 rounded-md border border-red-300/40 px-3 py-2 text-sm font-semibold hover:bg-red-900/40 disabled:opacity-60"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {paymentError ? (
          <div
            className="mt-5 rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-amber-100"
            role="alert"
          >
            {paymentError}
          </div>
        ) : null}

        {missingDetails &&
        !loading ? (
          <div className="mt-5 rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-amber-100">
            Shipping details or payment
            method are missing. Return to
            the previous checkout steps.
          </div>
        ) : null}

        <h2 className="mb-2 mt-7 text-lg font-semibold text-[#b8c0cc]">
          Shipping
        </h2>

        <div className="rounded-xl border border-[#3a4047] bg-[#23272b] p-5 shadow-lg">
          {loading ? (
            <p className="text-[#a8b0bd]">
              Loading checkout details...
            </p>
          ) : null}

          {!loading &&
          data.shipping ? (
            <div className="space-y-1">
              <div className="font-semibold text-white">
                {data.shipping.fullName}
              </div>

              <div>
                {data.shipping.address}
              </div>

              <div>
                {data.shipping.postalCode}{" "}
                {data.shipping.city},{" "}
                {data.shipping.country}
              </div>

              <div>
                Phone:{" "}
                {data.shipping.phone}
              </div>

              {data.shipping.email ? (
                <div>
                  Email:{" "}
                  {data.shipping.email}
                </div>
              ) : null}
            </div>
          ) : null}

          {!loading &&
          !data.shipping ? (
            <div className="text-amber-300">
              Missing shipping details.
            </div>
          ) : null}
        </div>

        <h2 className="mb-2 mt-6 text-lg font-semibold text-[#b8c0cc]">
          Payment
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <p className="mb-0 font-semibold">
            {paymentLabel(
              data.paymentMethod,
            )}
          </p>

          <Link
            to="/Checkout/Payment"
            className="rounded-md border border-[#596675] px-3 py-1.5 text-sm font-semibold hover:bg-[#252b33]"
          >
            Change payment
          </Link>

          {data.paymentMethod ===
            "Balance" &&
          data.walletBalance !== null ? (
            <span className="text-sm text-[#a8b0bd]">
              Wallet:{" "}
              {formatMoney(
                data.walletBalance,
              )}
            </span>
          ) : null}
        </div>

        <h2 className="mb-2 mt-6 text-lg font-semibold text-[#b8c0cc]">
          Order
        </h2>

        <div className="rounded-xl border border-[#3a4047] bg-[#23272b] p-5 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#b8c0cc]">
              Items
            </span>

            <span className="font-semibold">
              {data.items}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#3a4047] pt-3">
            <span className="text-lg font-semibold">
              Total
            </span>

            <span className="text-xl font-bold">
              {formatMoney(
                data.total,
              )}
            </span>
          </div>
        </div>

        {!loading &&
        (data.items <= 0 ||
          data.total <= 0) ? (
          <p className="mt-3 text-sm text-amber-300">
            Your cart is empty.
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void placeOrder();
            }}
            disabled={cannotPlace}
            className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing
              ? "Processing..."
              : paymentError
                ? "Resolve payment issue"
                : "Place order"}
          </button>

          <Link
            to="/Checkout/Shipping"
            className="rounded-md border border-[#596675] px-5 py-2.5 font-semibold hover:bg-[#252b33]"
          >
            Back
          </Link>
        </div>
      </section>
    </main>
  );
}