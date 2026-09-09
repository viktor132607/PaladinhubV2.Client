"use client";

import { useCallback, useEffect, useState } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
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
};

type CsrfResponse = { token?: string };
type DeactivateResponse = { message?: string };

const promoCodesEndpoint = "/Admin/api/promo-codes";

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

function typeLabel(type: number | string): string {
  const normalized = String(type).toLowerCase();
  if (normalized === "1" || normalized === "balance") return "Balance";
  if (normalized === "2" || normalized === "discountpercent" || normalized === "discount_percent") return "DiscountPercent";
  return String(type);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
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
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal,
      });
      const payload = await readApiJson<PromoCode[]>(response);
      if (!signal?.aborted) setItems(payload ?? []);
    } catch (caught) {
      if (signal?.aborted) return;
      setItems([]);
      setError(caught instanceof Error ? caught.message : "The promo codes could not be loaded.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const deactivate = async (id: string) => {
    if (workingId) return;
    setWorkingId(id);
    setError("");
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(`${promoCodesEndpoint}/${encodeURIComponent(id)}/deactivate`, {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/json", "X-CSRF-TOKEN": csrfToken },
      });
      const result = await readApiJson<DeactivateResponse>(response);
      setItems((current) => current.map((promo) => promo.id === id ? { ...promo, isActive: false } : promo));
      setMessage(result?.message || "Promo deactivated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The promo code could not be deactivated.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Promo Codes</h2>
        <Link className="btn btn-primary" to="/Admin/PromoCodes/Create">New Code</Link>
      </div>

      {message ? <div className="alert alert-success" role="status">{message}</div> : null}
      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}

      <table className="table table-dark table-striped">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Currency</th>
            <th>Max Uses</th>
            <th>Used</th>
            <th>Expires</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9}>Loading promo codes...</td></tr>
          ) : items.map((promo) => (
            <tr key={promo.id}>
              <td>{promo.code}</td>
              <td>{typeLabel(promo.type)}</td>
              <td>{promo.value}</td>
              <td>{promo.currency}</td>
              <td>{promo.maxUses?.toString() ?? "—"}</td>
              <td>{promo.usedCount}</td>
              <td>{formatDate(promo.expiresAtUtc)}</td>
              <td>{promo.isActive ? "Yes" : "No"}</td>
              <td className="text-end">
                {promo.isActive ? (
                  <form className="d-inline" onSubmit={(event) => { event.preventDefault(); void deactivate(promo.id); }}>
                    <button className="btn btn-sm btn-warning" disabled={Boolean(workingId)}>
                      {workingId === promo.id ? "Working..." : "Deactivate"}
                    </button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
