"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link } from "@/router/nextCompat";

type PromoCode = {
  id: string;
  code: string;
  type: number | string;
  value: number;
  currency?: string | null;
  maxUses?: number | null;
  usedCount: number;
  expiresAtUtc?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAtUtc?: string | null;
};

type CsrfResponse = {
  token?: string;
};

type DeactivateResponse = {
  ok?: boolean;
  id?: string;
  isActive?: boolean;
  message?: string;
};

const promoCodesEndpoint = "/Admin/api/promo-codes";

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  const payload = await readApiJson<CsrfResponse>(response);

  if (!payload?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return payload.token;
}

function typeLabel(type: number | string): string {
  const normalized = String(type).toLowerCase();

  if (normalized === "1" || normalized === "balance") {
    return "Balance";
  }

  if (
    normalized === "2" ||
    normalized === "discountpercent" ||
    normalized === "discount_percent"
  ) {
    return "Discount Percent";
  }

  return String(type);
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toISOString().slice(0, 10);
}

export default function PromoCodes() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchBackend(promoCodesEndpoint, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      });

      const payload = await readApiJson<PromoCode[]>(response);

      if (!signal?.aborted) {
        setItems(payload ?? []);
      }
    } catch (caught) {
      if (signal?.aborted) {
        return;
      }

      setItems([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "The promo codes could not be loaded.",
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

  const deactivate = async (id: string) => {
    if (workingId) {
      return;
    }

    setWorkingId(id);
    setError("");
    setMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(
        `${promoCodesEndpoint}/${encodeURIComponent(id)}/deactivate`,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
        },
      );

      const result = await readApiJson<DeactivateResponse>(response);

      setItems((current) =>
        current.map((promo) =>
          promo.id === id ? { ...promo, isActive: false } : promo,
        ),
      );

      setMessage(result?.message || "Promo deactivated.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The promo code could not be deactivated.",
      );
    } finally {
      setWorkingId("");
    }
  };

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Promo Codes</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage balance and discount codes.
            </p>
          </div>

          <Link
            to="/Admin/PromoCodes/Create"
            className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
          >
            New Code
          </Link>
        </div>

        {message ? (
          <div
            className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <Th>Code</Th>
                <Th>Type</Th>
                <Th>Value</Th>
                <Th>Currency</Th>
                <Th>Max Uses</Th>
                <Th>Used</Th>
                <Th>Expires</Th>
                <Th>Active</Th>
                <Th>Notes</Th>
                <Th />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Loading promo codes...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((promo) => (
                  <tr
                    key={promo.id}
                    className="odd:bg-slate-900 even:bg-slate-800/40"
                  >
                    <Td>
                      <span className="font-mono font-semibold text-amber-300">
                        {promo.code}
                      </span>
                    </Td>

                    <Td>{typeLabel(promo.type)}</Td>
                    <Td>{promo.value}</Td>
                    <Td>{promo.currency || "—"}</Td>
                    <Td>{promo.maxUses ?? "—"}</Td>
                    <Td>{promo.usedCount}</Td>
                    <Td>{formatDate(promo.expiresAtUtc)}</Td>

                    <Td>
                      {promo.isActive ? (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          Yes
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-300">
                          No
                        </span>
                      )}
                    </Td>

                    <Td>
                      <div
                        className="max-w-64 truncate"
                        title={promo.notes ?? ""}
                      >
                        {promo.notes || "—"}
                      </div>
                    </Td>

                    <Td>
                      {promo.isActive ? (
                        <button
                          type="button"
                          disabled={Boolean(workingId)}
                          onClick={() => void deactivate(promo.id)}
                          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {workingId === promo.id
                            ? "Working..."
                            : "Deactivate"}
                        </button>
                      ) : null}
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No promo codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || Boolean(workingId)}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>

          <Link
            to="/Admin"
            className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Back to Admin
          </Link>
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-3 align-middle text-slate-200">
      {children}
    </td>
  );
}