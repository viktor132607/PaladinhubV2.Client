"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  BACKEND_BASE_URL,
  backendEndpoints,
  fetchBackend,
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

type PaymentIntent = {
  id: string;
  status: string;
};

type ConfirmCardResult = {
  error?: {
    message?: string;
  };
  paymentIntent?: PaymentIntent;
};

type StripeClient = {
  elements: (
    options?: Record<string, unknown>,
  ) => StripeElements;

  confirmCardPayment: (
    clientSecret: string,
    options: {
      payment_method: {
        card: StripeCardElement;
      };
    },
  ) => Promise<ConfirmCardResult>;
};

type StripeFactory = (
  publishableKey: string,
  options?: Record<string, unknown>,
) => StripeClient;

type CardSession = {
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  orderId: string;
  amount: number;
  currency: string;
};

type FinalizeResponse = {
  ok?: boolean;
  orderId?: string;
  redirect?: string;
  message?: string;
};

type ApiErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  redirect?: string;
};

const STRIPE_SCRIPT_ID =
  "stripe-js-v3";

let stripeScriptPromise:
  | Promise<void>
  | null = null;

class CardPaymentError extends Error {
  readonly redirect: string | null;

  constructor(
    message: string,
    redirect?: string | null,
  ) {
    super(message);

    this.name = "CardPaymentError";
    this.redirect =
      redirect?.trim() || null;
  }
}

function stripeFactory():
  | StripeFactory
  | undefined {
  return (
    window as unknown as {
      Stripe?: StripeFactory;
    }
  ).Stripe;
}

function loadStripeScript(): Promise<void> {
  if (stripeFactory()) {
    return Promise.resolve();
  }

  if (stripeScriptPromise) {
    return stripeScriptPromise;
  }

  stripeScriptPromise =
    new Promise<void>(
      (resolve, reject) => {
        const handleLoaded = () => {
          if (stripeFactory()) {
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

        const existingScript =
          document.getElementById(
            STRIPE_SCRIPT_ID,
          ) as HTMLScriptElement | null;

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

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
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

async function readJsonResponse<T>(
  response: Response,
): Promise<T> {
  const responseText =
    await response
      .text()
      .catch(() => "");

  let payload: unknown = null;

  if (responseText.trim()) {
    try {
      payload = JSON.parse(
        responseText,
      );
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error =
      asRecord(payload);

    throw new CardPaymentError(
      stringValue(
        error.message ??
          error.title ??
          error.error,
      ) ||
        responseText.trim() ||
        `Request failed with status ${response.status}.`,

      stringValue(
        error.redirect,
      ),
    );
  }

  return payload as T;
}

function normalizeCardSession(
  value: unknown,
): CardSession {
  const source = asRecord(value);

  const session: CardSession = {
    clientSecret: stringValue(
      source.clientSecret ??
        source.ClientSecret,
    ),

    publishableKey: stringValue(
      source.publishableKey ??
        source.PublishableKey,
    ),

    paymentIntentId: stringValue(
      source.paymentIntentId ??
        source.PaymentIntentId,
    ),

    orderId: stringValue(
      source.orderId ??
        source.OrderId,
    ),

    amount: Math.max(
      0,
      numberValue(
        source.amount ??
          source.Amount,
      ),
    ),

    currency:
      stringValue(
        source.currency ??
          source.Currency,
      ) || "USD",
  };

  if (
    !session.clientSecret ||
    !session.publishableKey
  ) {
    throw new Error(
      "The server response is missing the Stripe client secret or publishable key.",
    );
  }

  return session;
}

async function loadCardSession(
  signal?: AbortSignal,
): Promise<CardSession> {
  const response =
    await fetchBackend(
      backendEndpoints.checkout.card,
      {
        method: "GET",
        cache: "no-store",
        signal,

        headers: {
          Accept: "application/json",
        },
      },
    );

  return normalizeCardSession(
    await readJsonResponse<unknown>(
      response,
    ),
  );
}

function redirectPath(
  value: string | undefined,
): string {
  if (!value?.trim()) {
    return "/Checkout/Success";
  }

  try {
    const parsed = new URL(
      value,
      `${BACKEND_BASE_URL}/`,
    );

    return (
      `${parsed.pathname}` +
      `${parsed.search}` +
      `${parsed.hash}`
    );
  } catch {
    return value.startsWith("/")
      ? value
      : "/Checkout/Success";
  }
}

function formatMoney(
  amount: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency:
          currency.toUpperCase(),
      },
    ).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function CardPayment() {
  const navigate = useNavigate();

  const mountRef =
    useRef<HTMLDivElement | null>(null);

  const stripeRef =
    useRef<StripeClient | null>(null);

  const cardRef =
    useRef<StripeCardElement | null>(
      null,
    );

  const clientSecretRef =
    useRef("");

  const [session, setSession] =
    useState<CardSession | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [ready, setReady] =
    useState(false);

  const [
    cardComplete,
    setCardComplete,
  ] = useState(false);

  const [
    processing,
    setProcessing,
  ] = useState(false);

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
          const cardSession =
            await loadCardSession(
              controller.signal,
            );

          await loadStripeScript();

          if (
            disposed ||
            controller.signal.aborted
          ) {
            return;
          }

          const createStripe =
            stripeFactory();

          if (
            !createStripe ||
            !mountRef.current
          ) {
            throw new Error(
              "Stripe could not be initialized.",
            );
          }

          const stripe =
            createStripe(
              cardSession.publishableKey,
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
                    color: "#ffffff",
                    iconColor: "#ffffff",
                    fontSize: "16px",
                    fontFamily:
                      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    fontSmoothing:
                      "antialiased",

                    "::placeholder": {
                      color:
                        "#9aa5b1",
                    },
                  },

                  invalid: {
                    color:
                      "#ff8a80",
                    iconColor:
                      "#ff8a80",
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

          clientSecretRef.current =
            cardSession.clientSecret;

          setSession(cardSession);
          setReady(true);
        } catch (caught) {
          if (
            disposed ||
            controller.signal.aborted ||
            isAbortError(caught)
          ) {
            return;
          }

          if (
            caught instanceof
              CardPaymentError &&
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
              : "Card payment could not be initialized.",
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
      clientSecretRef.current = "";
    };
  }, [navigate]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (processing) {
      return;
    }

    setError(null);

    const stripe =
      stripeRef.current;

    const card =
      cardRef.current;

    const clientSecret =
      clientSecretRef.current;

    if (
      !stripe ||
      !card ||
      !clientSecret ||
      !ready
    ) {
      setError(
        "The card form is not ready yet.",
      );
      return;
    }

    if (!cardComplete) {
      setError(
        "Complete the card details before paying.",
      );
      return;
    }

    setProcessing(true);

    try {
      const result =
        await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card,
            },
          },
        );

      if (result.error) {
        throw new Error(
          result.error.message ||
            "Payment failed.",
        );
      }

      if (
        !result.paymentIntent ||
        result.paymentIntent.status !==
          "succeeded"
      ) {
        throw new Error(
          "Payment was not completed.",
        );
      }

      const response =
        await fetchBackend(
          backendEndpoints.checkout
            .finalizeCard,
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
              paymentIntentId:
                result.paymentIntent.id,
            }),
          },
        );

      const finalized =
        await readJsonResponse<FinalizeResponse>(
          response,
        );

      if (finalized.ok === false) {
        throw new Error(
          finalized.message ||
            "The payment could not be finalized.",
        );
      }

      navigate(
        redirectPath(
          finalized.redirect,
        ),
        {
          replace: true,
        },
      );
    } catch (caught) {
      if (
        caught instanceof
          CardPaymentError &&
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
          : "Payment failed.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section className="mx-auto max-w-2xl rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Card Payment
          </h1>

          {session ? (
            <p className="mt-3 text-lg font-semibold text-[#cfd6df]">
              {formatMoney(
                session.amount,
                session.currency,
              )}
            </p>
          ) : null}
        </div>

        {error ? (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form
          onSubmit={submit}
          autoComplete="off"
        >
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor="stripe-card-element"
          >
            Card details
          </label>

          <div
            id="stripe-card-element"
            ref={mountRef}
            className="min-h-14 rounded-lg border border-[#2a3139] bg-[#0b0e12] p-4"
            aria-label="Card details"
            aria-busy={loading}
          />

          {loading ? (
            <p className="mt-3 text-sm text-[#9aa5b1]">
              Loading secure payment
              form...
            </p>
          ) : (
            <p className="mt-3 text-sm text-[#9aa5b1]">
              In Stripe test mode, use
              4242 4242 4242 4242, any
              future expiry date and any
              CVC.
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              processing ||
              !ready ||
              !cardComplete
            }
            className="mt-6 w-full rounded-md bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing
              ? "Processing..."
              : loading
                ? "Loading payment form..."
                : "Pay"}
          </button>

          <Link
            to="/Checkout/Review"
            className="mt-3 block w-full rounded-md border border-[#46515e] px-5 py-3 text-center font-semibold text-[#cfd6df] hover:bg-[#252b33]"
          >
            Back
          </Link>
        </form>
      </section>
    </main>
  );
}