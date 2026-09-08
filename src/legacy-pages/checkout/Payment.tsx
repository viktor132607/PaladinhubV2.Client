"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import {
  Link,
  useNavigate,
} from "@/router/nextCompat";

type PaymentMethod =
  | "Card"
  | "CashOnDelivery"
  | "Balance";

type PaymentResponse = {
  ok?: boolean;
  method?: unknown;
  Method?: unknown;
  paymentMethod?: unknown;
  PaymentMethod?: unknown;
  redirect?: string;
  Redirect?: string;
  message?: string;
  Message?: string;
  title?: string;
};

type PaymentOption = {
  value: PaymentMethod;
  title: string;
  description: string;
  icon: string;
};

const paymentMethodValues: Record<
  PaymentMethod,
  number
> = {
  Card: 0,
  CashOnDelivery: 1,
  Balance: 2,
};

const paymentOptions: PaymentOption[] = [
  {
    value: "Card",
    title: "Card",
    description:
      "Pay securely with a debit or credit card through Stripe.",
    icon: "💳",
  },
  {
    value: "CashOnDelivery",
    title: "Cash on delivery",
    description:
      "Register the order now and pay when it is delivered.",
    icon: "📦",
  },
  {
    value: "Balance",
    title: "Wallet Balance",
    description:
      "Use the available balance in your PaladinHub wallet.",
    icon: "👛",
  },
];

class CheckoutRequestError extends Error {
  readonly redirect: string | null;

  constructor(
    message: string,
    redirect?: string | null,
  ) {
    super(message);
    this.name = "CheckoutRequestError";
    this.redirect =
      redirect?.trim() || null;
  }
}

function normalizePaymentMethod(
  value: unknown,
): PaymentMethod {
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

  return "Card";
}

async function readPaymentResponse(
  response: Response,
): Promise<PaymentResponse> {
  if (response.ok) {
    return (
      (await readApiJson<PaymentResponse>(
        response,
      )) ?? {}
    );
  }

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    const payload =
      (await response
        .json()
        .catch(
          () => null,
        )) as PaymentResponse | null;

    throw new CheckoutRequestError(
      payload?.message ||
        payload?.Message ||
        payload?.title ||
        `Payment request failed with status ${response.status}.`,
      payload?.redirect ??
        payload?.Redirect,
    );
  }

  const message =
    await response
      .text()
      .catch(() => "");

  throw new CheckoutRequestError(
    message ||
      `Payment request failed with status ${response.status}.`,
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

export default function Payment() {
  const navigate = useNavigate();

  const [method, setMethod] =
    useState<PaymentMethod>("Card");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.checkout
              .payment,
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

        const result =
          await readPaymentResponse(
            response,
          );

        if (signal?.aborted) {
          return;
        }

        setMethod(
          normalizePaymentMethod(
            result.method ??
              result.Method ??
              result.paymentMethod ??
              result.PaymentMethod,
          ),
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
            CheckoutRequestError &&
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

        setError(
          caught instanceof Error
            ? caught.message
            : "Payment details could not be loaded.",
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

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (loading || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response =
        await fetchBackend(
          backendEndpoints.checkout
            .payment,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              method:
                paymentMethodValues[
                  method
                ],
            }),
          },
        );

      const result =
        await readPaymentResponse(
          response,
        );

      if (result.ok === false) {
        throw new Error(
          result.message ||
            result.Message ||
            "Payment method could not be saved.",
        );
      }

      navigate(
        result.redirect ||
          result.Redirect ||
          "/Checkout/Review",
      );
    } catch (caught) {
      if (
        caught instanceof
          CheckoutRequestError &&
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

      setError(
        caught instanceof Error
          ? caught.message
          : "Payment method could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section
        id="payment-page"
        className="mx-auto max-w-2xl rounded-xl border border-[#2a3139] bg-[#1b1f24] p-6 shadow-xl sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">
          Checkout
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-[#8ab4ff]">
          Choose payment method
        </h1>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200"
            role="alert"
          >
            <p>{error}</p>

            {loading === false ? (
              <button
                type="button"
                onClick={() => {
                  void load();
                }}
                disabled={saving}
                className="mt-3 rounded border border-red-300/40 px-3 py-2 text-sm font-semibold hover:bg-red-900/40 disabled:opacity-50"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={submit}
          className="mt-6 space-y-3"
        >
          {paymentOptions.map(
            (option) => {
              const selected =
                method === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                    selected
                      ? "border-[#8ab4ff] bg-[#8ab4ff]/10"
                      : "border-[#39424d] bg-[#151a1f] hover:border-[#596675]"
                  } ${
                    loading || saving
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={
                      option.value
                    }
                    checked={selected}
                    onChange={() => {
                      setMethod(
                        option.value,
                      );
                    }}
                    disabled={
                      loading || saving
                    }
                    className="mt-1 h-4 w-4 accent-[#8ab4ff]"
                  />

                  <span
                    className="text-2xl"
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>

                  <span>
                    <span className="block font-semibold text-white">
                      {option.title}
                    </span>

                    <span className="mt-1 block text-sm text-[#b1bac4]">
                      {
                        option.description
                      }
                    </span>
                  </span>
                </label>
              );
            },
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a3139] pt-5">
            <Link
              to="/Checkout/Shipping"
              className="rounded-md border border-[#596675] px-5 py-2.5 font-semibold hover:bg-[#252b33]"
            >
              Back
            </Link>

            <button
              type="submit"
              disabled={
                loading || saving
              }
              className="rounded-md bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : loading
                  ? "Loading..."
                  : "Continue"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}