"use client";

import { FormEvent, ReactNode, useState } from "react";
import { backendEndpoints, fetchBackend } from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

type PromoType = "1" | "2";

type CsrfResponse = {
  token?: string;
};

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
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("CSRF token could not be loaded.");
  }

  const payload = (await response.json()) as CsrfResponse;

  if (!payload.token) {
    throw new Error("CSRF token is missing.");
  }

  return payload.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as ErrorResponse | null;

    if (payload?.errors) {
      const validationErrors = Object.values(payload.errors).flat();

      if (validationErrors.length) {
        return validationErrors.join(" ");
      }
    }

    return (
      payload?.message ||
      payload?.title ||
      payload?.error ||
      `Request failed with status ${response.status}.`
    );
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
    setForm((current) => ({
      ...current,
      [field]: field === "code" ? value.toUpperCase() : value,
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : null;
    const currency = form.currency.trim().toUpperCase();
    const notes = form.notes.trim();

    if (!code) {
      setError("Code is required.");
      return;
    }

    if (code.length > 64) {
      setError("Code cannot exceed 64 characters.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError("Value must be greater than zero.");
      return;
    }

    if (form.type === "2" && value > 100) {
      setError("A percentage discount cannot exceed 100.");
      return;
    }

    if (form.type === "1" && currency.length > 3) {
      setError("Currency cannot exceed 3 characters.");
      return;
    }

    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      setError("Max Uses must be greater than zero.");
      return;
    }

    if (notes.length > 256) {
      setError("Notes cannot exceed 256 characters.");
      return;
    }

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
          currency: form.type === "1" ? currency || null : null,
          maxUses,
          expiresAtUtc: form.expiresAtUtc
            ? new Date(`${form.expiresAtUtc}T23:59:59.999Z`).toISOString()
            : null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      navigate("/Admin/PromoCodes");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The promo code could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-3xl font-semibold">Create Promo Code</h1>

        <p className="mt-1 text-sm text-slate-400">
          Create a balance credit or percentage discount code.
        </p>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-5">
          <Field label="Code" htmlFor="promo-code" required>
            <input
              id="promo-code"
              name="code"
              value={form.code}
              onChange={(event) => update("code", event.target.value)}
              placeholder="PROMO-2026"
              maxLength={64}
              disabled={saving}
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              required
            />
          </Field>

          <Field label="Type" htmlFor="promo-type" required>
            <select
              id="promo-type"
              name="type"
              value={form.type}
              onChange={(event) =>
                update("type", event.target.value as PromoType)
              }
              disabled={saving}
              className={inputClass}
            >
              <option value="1">Balance</option>
              <option value="2">Discount Percent</option>
            </select>
          </Field>

          <Field label="Value" htmlFor="promo-value" required>
            <input
              id="promo-value"
              name="value"
              type="number"
              min="0.01"
              max={form.type === "2" ? 100 : undefined}
              step="0.01"
              value={form.value}
              onChange={(event) => update("value", event.target.value)}
              placeholder="10"
              disabled={saving}
              className={inputClass}
              required
            />

            <span className="mt-1 block text-xs text-slate-500">
              {form.type === "1" ? "Balance amount" : "Discount percentage"}
            </span>
          </Field>

          <Field label="Currency (for Balance)" htmlFor="promo-currency">
            <input
              id="promo-currency"
              name="currency"
              value={form.currency}
              onChange={(event) =>
                update("currency", event.target.value.toUpperCase())
              }
              placeholder="EUR"
              maxLength={3}
              disabled={saving || form.type !== "1"}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-45`}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>

          <Field label="Max Uses (optional)" htmlFor="promo-max-uses">
            <input
              id="promo-max-uses"
              name="maxUses"
              type="number"
              min="1"
              step="1"
              value={form.maxUses}
              onChange={(event) => update("maxUses", event.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </Field>

          <Field label="Expires At (UTC, optional)" htmlFor="promo-expiry">
            <input
              id="promo-expiry"
              name="expiresAtUtc"
              type="date"
              value={form.expiresAtUtc}
              onChange={(event) => update("expiresAtUtc", event.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </Field>

          <Field label="Notes" htmlFor="promo-notes">
            <textarea
              id="promo-notes"
              name="notes"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              maxLength={256}
              disabled={saving}
              className={`${inputClass} min-h-28 resize-y`}
            />
          </Field>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create"}
            </button>

            <Link
              to="/Admin/PromoCodes"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
            >
              Back
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </span>

      {children}
    </label>
  );
}