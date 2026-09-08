"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link } from "@/router/nextCompat";

type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  label: string;
  isDefault: boolean;
  externalId: string | null;
  provider: string | null;
  createdAtUtc: string | null;
};

type PaymentPageData = {
  region: string;
  regionCode: string;
  currency: string;
  balance: number;
  methods: PaymentMethod[];
};

type PaymentActionResponse = {
  ok?: boolean;
  message?: string;
};

type TopUpResponse = PaymentActionResponse & {
  transactionId?: string;
  amount?: number;
  balance?: number;
  currency?: string;
};

type AccountSection =
  | "overview"
  | "details"
  | "security"
  | "privacy"
  | "connections"
  | "payments"
  | "transactions";

const emptyData: PaymentPageData = {
  region: "",
  regionCode: "",
  currency: "USD",
  balance: 0,
  methods: [],
};

const showDevelopmentTopUp =
  process.env.NODE_ENV !== "production";

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

function finiteNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizePaymentMethod(
  value: unknown,
): PaymentMethod | null {
  const source = asRecord(value);

  const id = String(
    property(source, "id", "Id") ?? "",
  ).trim();

  if (!id) {
    return null;
  }

  const brand = String(
    property(source, "brand", "Brand") ??
      "Card",
  ).trim();

  const last4 = String(
    property(source, "last4", "Last4") ??
      "----",
  ).trim();

  const label = String(
    property(source, "label", "Label") ??
      "Payment Method",
  ).trim();

  const externalId = property(
    source,
    "externalId",
    "ExternalId",
  );

  const provider = property(
    source,
    "provider",
    "Provider",
  );

  const createdAtUtc = property(
    source,
    "createdAtUtc",
    "CreatedAtUtc",
  );

  return {
    id,

    brand:
      brand || "Card",

    last4:
      last4 || "----",

    label:
      label || "Payment Method",

    isDefault:
      property(
        source,
        "isDefault",
        "IsDefault",
      ) === true,

    externalId:
      typeof externalId === "string" &&
      externalId.trim()
        ? externalId.trim()
        : null,

    provider:
      typeof provider === "string" &&
      provider.trim()
        ? provider.trim()
        : null,

    createdAtUtc:
      typeof createdAtUtc === "string" &&
      createdAtUtc.trim()
        ? createdAtUtc.trim()
        : null,
  };
}

function normalizePaymentPage(
  payload: unknown,
): PaymentPageData {
  const source = asRecord(payload);

  const rawMethods = property(
    source,
    "methods",
    "Methods",
  );

  const methods = Array.isArray(rawMethods)
    ? rawMethods
        .map(normalizePaymentMethod)
        .filter(
          (
            method,
          ): method is PaymentMethod =>
            method !== null,
        )
    : [];

  return {
    region: String(
      property(
        source,
        "region",
        "Region",
      ) ?? "",
    ).trim(),

    regionCode: String(
      property(
        source,
        "regionCode",
        "RegionCode",
      ) ?? "",
    ).trim(),

    currency:
      String(
        property(
          source,
          "currency",
          "Currency",
        ) ?? "USD",
      ).trim() || "USD",

    balance: Math.max(
      0,
      finiteNumber(
        property(
          source,
          "balance",
          "Balance",
        ),
      ),
    ),

    methods,
  };
}

function formatMoney(
  value: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

export default function PaymentMethods() {
  const [data, setData] =
    useState<PaymentPageData>(emptyData);

  const [amount, setAmount] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    workingId,
    setWorkingId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
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
            backendEndpoints.account
              .paymentMethods,
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

        setData(
          normalizePaymentPage(payload),
        );
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
            : "Payment methods could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const topUp = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      event.preventDefault();

      if (
        workingId !== null ||
        !showDevelopmentTopUp
      ) {
        return;
      }

      const value =
        Number.parseFloat(amount);

      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {
        setError(
          "Enter an amount greater than zero.",
        );
        return;
      }

      setWorkingId("topup");
      setError(null);
      setMessage(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.account
              .devTopUp,
            {
              method: "POST",
              cache: "no-store",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded;charset=UTF-8",
              },

              body: new URLSearchParams({
                amount:
                  value.toFixed(2),
              }),
            },
          );

        const result =
          await readApiJson<TopUpResponse>(
            response,
          );

        if (result?.ok === false) {
          throw new Error(
            result.message ||
              "Funds could not be added.",
          );
        }

        setAmount("");

        if (
          typeof result.balance ===
            "number" &&
          Number.isFinite(
            result.balance,
          )
        ) {
          setData((current) => ({
            ...current,
            balance: Math.max(
              0,
              result.balance!,
            ),
            currency:
              result.currency?.trim() ||
              current.currency,
          }));
        } else {
          await load();
        }

        setMessage(
          result?.message ||
            "Funds added to your wallet.",
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Funds could not be added.",
        );
      } finally {
        setWorkingId(null);
      }
    },
    [
      amount,
      load,
      workingId,
    ],
  );

  const setDefault =
    useCallback(
      async (
        paymentMethodId: string,
      ): Promise<void> => {
        if (workingId !== null) {
          return;
        }

        setWorkingId(
          paymentMethodId,
        );

        setError(null);
        setMessage(null);

        try {
          const response =
            await fetchBackend(
              backendEndpoints.account
                .setDefaultPaymentMethod,
              {
                method: "POST",
                cache: "no-store",

                headers: {
                  "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8",
                },

                body:
                  new URLSearchParams({
                    id: paymentMethodId,
                  }),
              },
            );

          const result =
            await readApiJson<PaymentActionResponse>(
              response,
            );

          if (result?.ok === false) {
            throw new Error(
              result.message ||
                "The default payment method could not be updated.",
            );
          }

          setData((current) => ({
            ...current,

            methods:
              current.methods.map(
                (method) => ({
                  ...method,

                  isDefault:
                    method.id ===
                    paymentMethodId,
                }),
              ),
          }));

          setMessage(
            result?.message ||
              "Default payment method updated.",
          );
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "The default payment method could not be updated.",
          );
        } finally {
          setWorkingId(null);
        }
      },
      [workingId],
    );

  const remove = useCallback(
    async (
      paymentMethodId: string,
    ): Promise<void> => {
      if (workingId !== null) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove this payment method?",
        );

      if (!confirmed) {
        return;
      }

      setWorkingId(
        paymentMethodId,
      );

      setError(null);
      setMessage(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.account
              .removePaymentMethod(
                paymentMethodId,
              ),
            {
              method: "DELETE",
              cache: "no-store",
            },
          );

        await readApiJson<null>(
          response,
        );

        setData((current) => ({
          ...current,

          methods:
            current.methods.filter(
              (method) =>
                method.id !==
                paymentMethodId,
            ),
        }));

        setMessage(
          "Payment method removed.",
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The payment method could not be removed.",
        );
      } finally {
        setWorkingId(null);
      }
    },
    [workingId],
  );

  return (
    <AccountPage
      active="payments"
      title="Payment Methods"
    >
      <div
        aria-live="polite"
        aria-atomic="true"
      >
        {error ? (
          <Message tone="error">
            <p>{error}</p>

            {data.methods.length === 0 &&
            !loading ? (
              <button
                type="button"
                onClick={() => {
                  void load();
                }}
                className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40"
              >
                Try again
              </button>
            ) : null}
          </Message>
        ) : null}

        {message ? (
          <Message tone="success">
            {message}
          </Message>
        ) : null}
      </div>

      <div className="space-y-4">
        <article className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Wallet Balance
              </h2>

              {data.region ? (
                <p className="mt-1 text-sm text-[#a8b0bd]">
                  Region: {data.region}
                </p>
              ) : null}
            </div>

            <Link
              to="/Account/MyAccount"
              className="text-sm text-blue-400 hover:underline"
            >
              Redeem a code
            </Link>
          </div>

          <div className="mt-3 text-4xl font-bold">
            {formatMoney(
              data.balance,
              data.currency,
            )}
          </div>

          {showDevelopmentTopUp ? (
            <>
              <hr className="my-6 border-[#313a45]" />

              <h3 className="mb-3 font-semibold">
                Development Wallet Top-up
              </h3>

              <form
                onSubmit={topUp}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <label className="block">
                  <span className="mb-2 block text-sm text-[#d4dae2]">
                    Amount ({data.currency})
                  </span>

                  <div className="flex">
                    <span className="rounded-l-md border border-r-0 border-[#46515e] bg-[#20262d] px-3 py-2.5">
                      $
                    </span>

                    <input
                      type="number"
                      value={amount}
                      onChange={(event) => {
                        setAmount(
                          event.target.value,
                        );
                      }}
                      step="0.01"
                      min="0.01"
                      required
                      disabled={
                        workingId !== null
                      }
                      className="w-48 rounded-r-md border border-[#46515e] bg-[#0f1216] px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={
                    workingId !== null
                  }
                  className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {workingId === "topup"
                    ? "Adding..."
                    : "Add Funds"}
                </button>
              </form>

              <p className="mt-3 text-xs text-amber-300">
                This option is available
                only in development builds.
              </p>
            </>
          ) : null}
        </article>

        <article className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Your Payment Methods
            </h2>

            <Link
              to="/Account/AddPaymentMethod"
              className="text-sm text-blue-400 hover:underline"
            >
              + Add a new Payment Method
            </Link>
          </div>

          {loading ? (
            <p className="mt-4 border-t border-[#26303a] py-5 text-sm text-[#a8b0bd]">
              Loading payment methods...
            </p>
          ) : null}

          {!loading &&
          data.methods.length === 0 ? (
            <p className="mt-4 border-t border-[#26303a] py-5 text-sm text-[#a8b0bd]">
              You have no saved payment
              methods yet.
            </p>
          ) : null}

          {!loading &&
          data.methods.length > 0 ? (
            <div className="mt-3 divide-y divide-[#26303a]">
              {data.methods.map(
                (method) => {
                  const isWorking =
                    workingId ===
                    method.id;

                  return (
                    <div
                      key={method.id}
                      className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="font-semibold">
                          {method.brand} ****{" "}
                          {method.last4}
                        </div>

                        <div className="mt-1 text-sm text-[#a8b0bd]">
                          {method.label}
                        </div>

                        {method.provider ? (
                          <div className="mt-1 text-xs text-[#7f8996]">
                            Provider:{" "}
                            {method.provider}
                          </div>
                        ) : null}

                        {method.createdAtUtc ? (
                          <div className="mt-1 text-xs text-[#7f8996]">
                            Added:{" "}
                            {formatDate(
                              method.createdAtUtc,
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {method.isDefault ? (
                          <span className="font-semibold text-emerald-300">
                            Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              void setDefault(
                                method.id,
                              );
                            }}
                            disabled={
                              workingId !== null
                            }
                            className="text-blue-400 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isWorking
                              ? "Updating..."
                              : "Set as default"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            void remove(
                              method.id,
                            );
                          }}
                          disabled={
                            workingId !== null
                          }
                          className="text-red-300 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isWorking
                            ? "Working..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : null}
        </article>
      </div>
    </AccountPage>
  );
}

function Message({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const classes =
    tone === "error"
      ? "border-red-500/50 bg-red-950/40 text-red-200"
      : "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";

  return (
    <div
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${classes}`}
      role={
        tone === "error"
          ? "alert"
          : "status"
      }
    >
      {children}
    </div>
  );
}

function AccountPage({
  active,
  title,
  children,
}: {
  active: AccountSection;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-semibold">
          {title}
        </h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AccountNavigation
            active={active}
          />

          <div className="min-w-0 flex-1">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountNavigation({
  active,
}: {
  active: AccountSection;
}) {
  const links: ReadonlyArray<
    readonly [
      AccountSection,
      string,
      string,
    ]
  > = [
    [
      "overview",
      "/Account/MyAccount",
      "Account Overview",
    ],
    [
      "details",
      "/Account/AccountDetails",
      "Account Details",
    ],
    [
      "security",
      "/Account/Security",
      "Security",
    ],
    [
      "privacy",
      "/Account/Privacy",
      "Privacy & Communication",
    ],
    [
      "connections",
      "/Account/Connections",
      "Connections",
    ],
    [
      "payments",
      "/Account/PaymentMethods",
      "Payment Methods",
    ],
    [
      "transactions",
      "/Account/TransactionHistory",
      "Transaction History",
    ],
  ];

  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <nav
        className="flex flex-col gap-1 rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl"
        aria-label="Account navigation"
      >
        {links.map(
          ([key, to, label]) => (
            <Link
              key={key}
              to={to}
              aria-current={
                active === key
                  ? "page"
                  : undefined
              }
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-[#20262d] ${
                active === key
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