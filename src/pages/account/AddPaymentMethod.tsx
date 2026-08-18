"use client";

import {
  useEffect,
  useRef,
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

type StripeCardChangeEvent = {
  complete: boolean;
  error?: {
    message?: string;
  };
};

type StripeCardElement = {
  mount: (element: HTMLElement) => void;
  unmount: () => void;
  destroy?: () => void;
  on: (
    event: "change",
    callback: (
      event: StripeCardChangeEvent,
    ) => void,
  ) => void;
};

type StripeElements = {
  create: (
    type: "card",
    options?: Record<string, unknown>,
  ) => StripeCardElement;
};

type StripePaymentMethodResult = {
  paymentMethod?: {
    id: string;
  };
  error?: {
    message?: string;
  };
};

type StripeClient = {
  elements: (
    options?: Record<string, unknown>,
  ) => StripeElements;

  createPaymentMethod: (options: {
    type: "card";
    card: StripeCardElement;
  }) => Promise<StripePaymentMethodResult>;
};

declare global {
  interface Window {
    Stripe?: (
      publishableKey: string,
      options?: Record<string, unknown>,
    ) => StripeClient;
  }
}

type PaymentMethodSetupResponse = {
  publishableKey: string;
  customerId: string;
};

type AddPaymentMethodResponse = {
  ok?: boolean;
  message?: string;
};

const STRIPE_SCRIPT_ID =
  "stripe-js-v3";

let stripeScriptPromise:
  | Promise<void>
  | null = null;

function loadStripeScript(): Promise<void> {
  if (window.Stripe) {
    return Promise.resolve();
  }

  if (stripeScriptPromise) {
    return stripeScriptPromise;
  }

  stripeScriptPromise =
    new Promise<void>(
      (resolve, reject) => {
        const existingScript =
          document.getElementById(
            STRIPE_SCRIPT_ID,
          ) as HTMLScriptElement | null;

        const handleLoaded = () => {
          if (window.Stripe) {
            resolve();
            return;
          }

          stripeScriptPromise = null;

          reject(
            new Error(
              "Stripe.js loaded, but Stripe is unavailable.",
            ),
          );
        };

        const handleError = () => {
          stripeScriptPromise = null;

          reject(
            new Error(
              "Stripe.js could not be loaded.",
            ),
          );
        };

        if (existingScript) {
          existingScript.addEventListener(
            "load",
            handleLoaded,
            {
              once: true,
            },
          );

          existingScript.addEventListener(
            "error",
            handleError,
            {
              once: true,
            },
          );

          return;
        }

        const script =
          document.createElement("script");

        script.id = STRIPE_SCRIPT_ID;
        script.src =
          "https://js.stripe.com/v3/";
        script.async = true;

        script.addEventListener(
          "load",
          handleLoaded,
          {
            once: true,
          },
        );

        script.addEventListener(
          "error",
          handleError,
          {
            once: true,
          },
        );

        document.head.appendChild(script);
      },
    );

  return stripeScriptPromise;
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function AddPaymentMethod() {
  const navigate = useNavigate();

  const mountRef =
    useRef<HTMLDivElement | null>(null);

  const stripeRef =
    useRef<StripeClient | null>(null);

  const cardRef =
    useRef<StripeCardElement | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [ready, setReady] =
    useState(false);

  const [cardComplete, setCardComplete] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    let disposed = false;

    const initialize =
      async (): Promise<void> => {
        setLoading(true);
        setReady(false);
        setCardComplete(false);
        setError(null);

        try {
          const setupResponse =
            await fetchBackend(
              backendEndpoints.account
                .addPaymentMethod,
              {
                method: "GET",
                cache: "no-store",
                signal:
                  controller.signal,
              },
            );

          const setup =
            await readApiJson<PaymentMethodSetupResponse>(
              setupResponse,
            );

          const publishableKey =
            setup.publishableKey?.trim();

          if (!publishableKey) {
            throw new Error(
              "Stripe publishable key is not configured.",
            );
          }

          await loadStripeScript();

          if (
            disposed ||
            controller.signal.aborted
          ) {
            return;
          }

          if (
            !window.Stripe ||
            !mountRef.current
          ) {
            throw new Error(
              "Stripe could not be initialized.",
            );
          }

          const stripe =
            window.Stripe(
              publishableKey,
              {
                locale: "en",
              },
            );

          const elements =
            stripe.elements();

          const card =
            elements.create(
              "card",
              {
                hidePostalCode: true,

                style: {
                  base: {
                    color: "#e9ecef",
                    fontSize: "16px",
                    fontSmoothing:
                      "antialiased",
                    fontFamily:
                      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    iconColor:
                      "#a8b0bd",

                    "::placeholder": {
                      color:
                        "#7f8996",
                    },
                  },

                  invalid: {
                    color:
                      "#ff6b6b",
                    iconColor:
                      "#ff6b6b",
                  },
                },
              },
            );

          card.on(
            "change",
            (event) => {
              if (disposed) {
                return;
              }

              setCardComplete(
                event.complete,
              );

              setError(
                event.error?.message ??
                  null,
              );
            },
          );

          card.mount(
            mountRef.current,
          );

          stripeRef.current =
            stripe;

          cardRef.current =
            card;

          setReady(true);
        } catch (caught) {
          if (
            disposed ||
            controller.signal.aborted ||
            isAbortError(caught)
          ) {
            return;
          }

          setError(
            caught instanceof Error
              ? caught.message
              : "Stripe could not be initialized.",
          );
        } finally {
          if (
            !disposed &&
            !controller.signal.aborted
          ) {
            setLoading(false);
          }
        }
      };

    void initialize();

    return () => {
      disposed = true;
      controller.abort();

      const card =
        cardRef.current;

      if (card) {
        if (card.destroy) {
          card.destroy();
        } else {
          card.unmount();
        }
      }

      cardRef.current = null;
      stripeRef.current = null;
    };
  }, []);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const stripe =
      stripeRef.current;

    const card =
      cardRef.current;

    if (!stripe || !card || !ready) {
      setError(
        "The card form is not ready yet.",
      );
      return;
    }

    if (!cardComplete) {
      setError(
        "Complete the card details before saving.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const paymentMethodResult =
        await stripe.createPaymentMethod(
          {
            type: "card",
            card,
          },
        );

      if (
        paymentMethodResult.error ||
        !paymentMethodResult
          .paymentMethod?.id
      ) {
        throw new Error(
          paymentMethodResult.error
            ?.message ||
            "Stripe did not return a payment method.",
        );
      }

      const response =
        await fetchBackend(
          backendEndpoints.account
            .addStripePaymentMethod,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8",
            },

            body:
              new URLSearchParams({
                paymentMethodId:
                  paymentMethodResult
                    .paymentMethod.id,
              }),
          },
        );

      const result =
        await readApiJson<AddPaymentMethodResponse>(
          response,
        );

      if (result?.ok === false) {
        throw new Error(
          result.message ||
            "The payment method could not be added.",
        );
      }

      navigate(
        "/Account/PaymentMethods",
        {
          replace: true,
        },
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The payment method could not be added.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-semibold">
          Add Payment Method
        </h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AccountNavigation />

          <section className="min-w-0 flex-1">
            <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] shadow-xl">
              <div className="p-6">
                {error ? (
                  <div
                    className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}

                <form onSubmit={submit}>
                  <label className="mb-2 block text-sm font-medium">
                    Card details
                  </label>

                  <div
                    ref={mountRef}
                    className="min-h-12 rounded-md border border-[#313a45] bg-[#0f1216] px-3 py-3"
                    aria-label="Card details"
                    aria-busy={loading}
                  />

                  {loading ? (
                    <p className="mt-3 text-sm text-[#a8b0bd]">
                      Loading secure card
                      form...
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !ready ||
                        !cardComplete ||
                        saving
                      }
                      className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : loading
                          ? "Loading card form..."
                          : "Save card"}
                    </button>

                    <Link
                      to="/Account/PaymentMethods"
                      className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>

                <p className="mt-4 text-sm text-[#a8b0bd]">
                  In Stripe test mode, use
                  card number 4242 4242
                  4242 4242, any future
                  expiry date and any CVC.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AccountNavigation() {
  const links = [
    [
      "/Account/MyAccount",
      "Account Overview",
    ],
    [
      "/Account/AccountDetails",
      "Account Details",
    ],
    [
      "/Account/Security",
      "Security",
    ],
    [
      "/Account/Privacy",
      "Privacy & Communication",
    ],
    [
      "/Account/Connections",
      "Connections",
    ],
    [
      "/Account/PaymentMethods",
      "Payment Methods",
    ],
    [
      "/Account/TransactionHistory",
      "Transaction History",
    ],
  ] as const;

  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <nav
        className="flex flex-col gap-1 rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl"
        aria-label="Account navigation"
      >
        {links.map(
          ([to, label]) => (
            <Link
              key={to}
              to={to}
              aria-current={
                to ===
                "/Account/PaymentMethods"
                  ? "page"
                  : undefined
              }
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-[#20262d] ${
                to ===
                "/Account/PaymentMethods"
                  ? "bg-[#20262d] text-white"
                  : ""
              }`}
            >
              {label}
            </Link>
          ),
        )}
      </nav>
    </aside>
  );
}