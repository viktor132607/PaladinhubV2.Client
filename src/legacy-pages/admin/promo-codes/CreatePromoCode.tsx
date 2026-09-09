"use client";

import { useState, type FormEvent } from "react";
import { backendEndpoints, fetchBackend } from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

type PromoType = "1" | "2";
type CsrfResponse = { token?: string };
type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};
type PromoForm = {
  code: string;
  type: PromoType;
  value: string;
  currency: string;
  maxUses: string;
  expiresAtUtc: string;
  notes: string;
};

const promoCodesApiEndpoint = "/Admin/api/promo-codes";
const initialForm: PromoForm = {
  code: "",
  type: "1",
  value: "5",
  currency: "EUR",
  maxUses: "",
  expiresAtUtc: "",
  notes: "",
};

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  if (!response.ok) throw new Error("CSRF token could not be loaded.");
  const payload = (await response.json()) as CsrfResponse;
  if (!payload.token) throw new Error("CSRF token is missing.");
  return payload.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
    if (payload?.errors) {
      const validationErrors = Object.values(payload.errors).flat();
      if (validationErrors.length) return validationErrors.join(" ");
    }
    return payload?.message || payload?.title || payload?.error || `Request failed with status ${response.status}.`;
  }
  const text = await response.text().catch(() => "");
  return text || `Request failed with status ${response.status}.`;
}

export default function CreatePromoCode() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PromoForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof PromoForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError("");

    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : null;
    const currency = form.currency.trim().toUpperCase();
    const notes = form.notes.trim();

    if (!code) { setError("Code is required."); return; }
    if (!Number.isFinite(value) || value <= 0) { setError("Value must be greater than zero."); return; }
    if (form.type === "2" && value > 100) { setError("A percentage discount cannot exceed 100."); return; }
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) { setError("Max Uses must be greater than zero."); return; }

    setSaving(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(promoCodesApiEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          code,
          type: Number(form.type),
          value,
          currency: currency || null,
          maxUses,
          expiresAtUtc: form.expiresAtUtc ? new Date(`${form.expiresAtUtc}T00:00:00.000Z`).toISOString() : null,
          notes: notes || null,
        }),
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      navigate("/Admin/PromoCodes");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The promo code could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Create Promo Code</h2>
      {error ? <div className="text-danger mt-3" role="alert">{error}</div> : null}
      <form onSubmit={submit} className="mt-3">
        <div className="mb-3">
          <label className="form-label" htmlFor="promo-code">Code</label>
          <input id="promo-code" name="code" className="form-control" placeholder="PROMO-2025" value={form.code} onChange={(event) => update("code", event.target.value)} disabled={saving} />
          <span className="text-danger">{error === "Code is required." ? error : ""}</span>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="promo-type">Type</label>
          <select id="promo-type" name="type" className="form-select" value={form.type} onChange={(event) => update("type", event.target.value as PromoType)} disabled={saving}>
            <option value="1">Balance</option>
            <option value="2">DiscountPercent</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="promo-value">Value</label>
          <input id="promo-value" name="value" className="form-control" placeholder="10 (EUR) / 10 (%)" value={form.value} onChange={(event) => update("value", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="promo-currency">Currency (for Balance)</label>
          <input id="promo-currency" name="currency" className="form-control" placeholder="EUR or USD (optional)" value={form.currency} onChange={(event) => update("currency", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="promo-max-uses">Max Uses (optional)</label>
          <input id="promo-max-uses" name="maxUses" type="number" className="form-control" value={form.maxUses} onChange={(event) => update("maxUses", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="promo-expiry">Expires At (UTC, optional)</label>
          <input id="promo-expiry" name="expiresAtUtc" type="date" className="form-control" value={form.expiresAtUtc} onChange={(event) => update("expiresAtUtc", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="promo-notes">Notes</label>
          <input id="promo-notes" name="notes" className="form-control" value={form.notes} onChange={(event) => update("notes", event.target.value)} disabled={saving} />
        </div>

        <button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Creating..." : "Create"}</button>
        <Link to="/Admin/PromoCodes" className="btn btn-secondary ms-2">Back</Link>
      </form>
    </div>
  );
}
