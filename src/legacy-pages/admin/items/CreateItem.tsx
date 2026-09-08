"use client";

import { FormEvent, ReactNode, useState } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

type ItemFormState = {
  name: string;
  icon: string;
  secondIcon: string;
  description: string;
  url: string;
  itemLevel: string;
  requiredLevel: string;
  quality: string;
};

type CsrfResponse = {
  token?: string;
};

const itemsApiEndpoint = "/Admin/api/items";

const initialState: ItemFormState = {
  name: "",
  icon: "",
  secondIcon: "",
  description: "",
  url: "",
  itemLevel: "",
  requiredLevel: "",
  quality: "",
};

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  const result = await readApiJson<CsrfResponse>(response);

  if (!result?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return result.token;
}

function nullableInteger(value: string, fieldName: string): number | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be a whole number.`);
  }

  return parsed;
}

export default function CreateItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ItemFormState>(initialState);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field: keyof ItemFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const itemLevel = nullableInteger(form.itemLevel, "Item level");
      const requiredLevel = nullableInteger(
        form.requiredLevel,
        "Required level",
      );
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(itemsApiEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon.trim() || null,
          secondIcon: form.secondIcon.trim() || null,
          description: form.description.trim() || null,
          url: form.url.trim() || null,
          itemLevel,
          requiredLevel,
          quality: form.quality.trim() || null,
        }),
      });

      await readApiJson<unknown>(response);
      navigate("/Admin/Database?entity=Items");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The item could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-2xl font-semibold">Create Item</h2>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Field
            label="Name"
            htmlFor="item-name"
            required
            error={!form.name.trim() && error ? "Name is required." : undefined}
          >
            <input
              id="item-name"
              name="name"
              className={inputClass}
              maxLength={100}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              disabled={saving}
              autoFocus
              required
            />
          </Field>

          <Field label="Icon" htmlFor="item-icon">
            <input
              id="item-icon"
              name="icon"
              className={inputClass}
              maxLength={100}
              value={form.icon}
              onChange={(event) => update("icon", event.target.value)}
              disabled={saving}
            />
          </Field>

          <Field label="Second Icon" htmlFor="item-second-icon">
            <input
              id="item-second-icon"
              name="secondIcon"
              className={inputClass}
              maxLength={100}
              value={form.secondIcon}
              onChange={(event) => update("secondIcon", event.target.value)}
              disabled={saving}
            />
          </Field>

          <Field label="Description" htmlFor="item-description">
            <textarea
              id="item-description"
              name="description"
              className={`${inputClass} min-h-32 resize-y`}
              maxLength={2000}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              disabled={saving}
            />
          </Field>

          <Field label="Url" htmlFor="item-url">
            <input
              id="item-url"
              name="url"
              className={inputClass}
              type="url"
              maxLength={300}
              value={form.url}
              onChange={(event) => update("url", event.target.value)}
              disabled={saving}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Item Level" htmlFor="item-level">
              <input
                id="item-level"
                name="itemLevel"
                className={inputClass}
                type="number"
                min={0}
                step={1}
                value={form.itemLevel}
                onChange={(event) => update("itemLevel", event.target.value)}
                disabled={saving}
              />
            </Field>

            <Field label="Required Level" htmlFor="item-required-level">
              <input
                id="item-required-level"
                name="requiredLevel"
                className={inputClass}
                type="number"
                min={0}
                step={1}
                value={form.requiredLevel}
                onChange={(event) =>
                  update("requiredLevel", event.target.value)
                }
                disabled={saving}
              />
            </Field>
          </div>

          <Field label="Quality" htmlFor="item-quality">
            <input
              id="item-quality"
              name="quality"
              className={inputClass}
              maxLength={50}
              value={form.quality}
              onChange={(event) => update("quality", event.target.value)}
              disabled={saving}
            />
          </Field>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <Link
              to="/Admin/Database?entity=Items"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-medium text-white hover:bg-slate-600"
            >
              Cancel
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
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </span>

      {children}

      {error ? (
        <span className="mt-1 block text-sm text-red-400">{error}</span>
      ) : null}
    </label>
  );
}