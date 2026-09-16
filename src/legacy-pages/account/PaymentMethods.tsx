"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import AccountLayout from "@/components/account/AccountLayout";
import AccountPanel from "@/components/account/AccountPanel";
import s from "@/components/account/account.module.css";
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

const emptyData: PaymentPageData = {
  region: "",
  regionCode: "",
  currency: "USD",
  balance: 0,
  methods: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function property(
  source: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): unknown {
  return source[camelCaseName] ?? source[pascalCaseName];
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePaymentMethod(value: unknown): PaymentMethod | null {
  const source = asRecord(value);

  const id = String(property(source, "id", "Id") ?? "").trim();

  if (!id) {
    return null;
  }

  const brand = String(property(source, "brand", "Brand") ?? "Card").trim();

  const last4 = String(property(source, "last4", "Last4") ?? "----").trim();

  const label = String(
    property(source, "label", "Label") ?? "Payment Method",
  ).trim();

  const externalId = property(source, "externalId", "ExternalId");

  const provider = property(source, "provider", "Provider");

  const createdAtUtc = property(source, "createdAtUtc", "CreatedAtUtc");

  return {
    id,

    brand: brand || "Card",

    last4: last4 || "----",

    label: label || "Payment Method",

    isDefault: property(source, "isDefault", "IsDefault") === true,

    externalId:
      typeof externalId === "string" && externalId.trim()
        ? externalId.trim()
        : null,

    provider:
      typeof provider === "string" && provider.trim() ? provider.trim() : null,

    createdAtUtc:
      typeof createdAtUtc === "string" && createdAtUtc.trim()
        ? createdAtUtc.trim()
        : null,
  };
}

function normalizePaymentPage(payload: unknown): PaymentPageData {
  const source = asRecord(payload);

  const rawMethods = property(source, "methods", "Methods");

  const methods = Array.isArray(rawMethods)
    ? rawMethods
        .map(normalizePaymentMethod)
        .filter((method): method is PaymentMethod => method !== null)
    : [];

  return {
    region: String(property(source, "region", "Region") ?? "").trim(),

    regionCode: String(
      property(source, "regionCode", "RegionCode") ?? "",
    ).trim(),

    currency:
      String(property(source, "currency", "Currency") ?? "USD").trim() || "USD",

    balance: Math.max(0, finiteNumber(property(source, "balance", "Balance"))),

    methods,
  };
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export default function PaymentMethods() {
  const [data, setData] = useState<PaymentPageData>(emptyData);

  const [loading, setLoading] = useState(true);

  const [workingId, setWorkingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchBackend(
        backendEndpoints.account.paymentMethods,
        {
          method: "GET",
          cache: "no-store",
          signal,
        },
      );

      const payload = await readApiJson<unknown>(response);

      if (signal?.aborted) {
        return;
      }

      setData(normalizePaymentPage(payload));
    } catch (caught) {
      if (signal?.aborted || isAbortError(caught)) {
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
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const setDefault = useCallback(
    async (paymentMethodId: string): Promise<void> => {
      if (workingId !== null) {
        return;
      }

      setWorkingId(paymentMethodId);

      setError(null);
      setMessage(null);

      try {
        const response = await fetchBackend(
          backendEndpoints.account.setDefaultPaymentMethod,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },

            body: new URLSearchParams({
              id: paymentMethodId,
            }),
          },
        );

        const result = await readApiJson<PaymentActionResponse>(response);

        if (result?.ok === false) {
          throw new Error(
            result.message ||
              "The default payment method could not be updated.",
          );
        }

        setData((current) => ({
          ...current,

          methods: current.methods.map((method) => ({
            ...method,

            isDefault: method.id === paymentMethodId,
          })),
        }));

        setMessage(result?.message || "Default payment method updated.");
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
    async (paymentMethodId: string): Promise<void> => {
      if (workingId !== null) {
        return;
      }

      const confirmed = window.confirm("Remove this payment method?");

      if (!confirmed) {
        return;
      }

      setWorkingId(paymentMethodId);

      setError(null);
      setMessage(null);

      try {
        const response = await fetchBackend(
          backendEndpoints.account.removePaymentMethod(paymentMethodId),
          {
            method: "DELETE",
            cache: "no-store",
          },
        );

        await readApiJson<null>(response);

        setData((current) => ({
          ...current,

          methods: current.methods.filter(
            (method) => method.id !== paymentMethodId,
          ),
        }));

        setMessage("Payment method removed.");
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
    <AccountLayout active="PaymentMethods">
      <h1>Payment Methods</h1>
      {error && (
        <Message tone="error">
          <p>{error}</p>
          <button onClick={() => void load()} disabled={loading}>
            Try again
          </button>
        </Message>
      )}
      {message && <Message tone="success">{message}</Message>}
      <div className={s.stack}>
        <AccountPanel title="PaladinHub Balance">
          <div className={s.row}>
            <dl className={s.info}>
              <dt>Current balance</dt>
              <dd>
                {loading
                  ? "Loading…"
                  : formatMoney(data.balance, data.currency)}
              </dd>
              {data.region && (
                <>
                  <dt>Region</dt>
                  <dd>{data.region}</dd>
                </>
              )}
            </dl>
            <div className={s.stack}>
              <Link to="/Account/MyAccount">+ Add PaladinHub balance</Link>
              <Link to="/Account/MyAccount">Redeem a code</Link>
            </div>
          </div>
        </AccountPanel>
        <AccountPanel
          title="Your Payment Methods"
          action={
            <Link to="/Account/AddPaymentMethod">
              + Add a new Payment Method
            </Link>
          }
        >
          {loading ? (
            <p role="status">Loading payment methods…</p>
          ) : data.methods.length === 0 ? (
            <p className={s.empty}>You have no saved payment methods yet.</p>
          ) : (
            data.methods.map((method) => (
              <div className={s.paymentRow} key={method.id}>
                <div>
                  {method.isDefault ? (
                    <span className={s.positive}>✓ Default</span>
                  ) : (
                    <button
                      className={s.textButton}
                      onClick={() => void setDefault(method.id)}
                      disabled={workingId !== null}
                    >
                      Set as default
                    </button>
                  )}
                </div>
                <div>
                  {method.brand} {method.last4}
                  <p className={s.muted}>{method.label}</p>
                </div>
                <button
                  className={s.textButton}
                  onClick={() => void remove(method.id)}
                  disabled={workingId !== null}
                >
                  {workingId === method.id ? "Working…" : "× Remove"}
                </button>
              </div>
            ))
          )}
        </AccountPanel>
      </div>
    </AccountLayout>
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
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
