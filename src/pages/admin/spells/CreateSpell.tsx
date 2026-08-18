"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

type SpellForm = {
  name: string;
  icon: string;
  description: string;
  url: string;
  quality: string;
};

type SpellDto = {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality: string;
};

type CsrfResponse = {
  token?: string;
};

const spellsApiEndpoint = "/Admin/api/spells";

const initialForm: SpellForm = {
  name: "",
  icon: "",
  description: "",
  url: "",
  quality: "spell",
};

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

export default function CreateSpell() {
  const navigate = useNavigate();

  const [form, setForm] = useState<SpellForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [iconFailed, setIconFailed] = useState(false);

  const iconSource = useMemo(() => {
    const icon = form.icon.trim();

    return icon
      ? `/images/SpellIcons/${encodeURIComponent(icon)}`
      : "";
  }, [form.icon]);

  const update = (field: keyof SpellForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "icon") {
      setIconFailed(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    const name = form.name.trim();
    const icon = form.icon.trim();
    const description = form.description.trim();
    const url = form.url.trim();
    const quality = form.quality.trim().toLowerCase() || "spell";

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (url) {
      try {
        new URL(url);
      } catch {
        setError("URL must be a valid absolute address.");
        return;
      }
    }

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(spellsApiEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          name,
          icon: icon || null,
          description: description || null,
          url: url || null,
          quality,
        }),
      });

      await readApiJson<SpellDto>(response);
      navigate("/Admin/Database?entity=Spells");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The spell could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-3xl font-semibold">Create Spell</h1>

        <p className="mt-1 text-sm text-slate-400">
          Add a spell to the PaladinHub database.
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
          <Field label="Name" htmlFor="spell-name" required>
            <input
              id="spell-name"
              name="name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={100}
              disabled={saving}
              className={inputClass}
              autoFocus
              required
            />
          </Field>

          <Field label="Icon" htmlFor="spell-icon">
            <input
              id="spell-icon"
              name="icon"
              value={form.icon}
              onChange={(event) => update("icon", event.target.value)}
              maxLength={100}
              placeholder="spell-icon.jpg"
              disabled={saving}
              className={inputClass}
            />

            {iconSource ? (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                {!iconFailed ? (
                  <img
                    src={iconSource}
                    alt={form.name || "Spell icon"}
                    onError={() => setIconFailed(true)}
                    className="h-16 w-16 rounded-md border border-slate-600 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-red-500/60 text-xs text-red-300">
                    Missing
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Icon preview
                  </div>

                  <div className="mt-1 break-all text-sm text-slate-300">
                    {form.icon}
                  </div>
                </div>
              </div>
            ) : null}
          </Field>

          <Field label="Description" htmlFor="spell-description">
            <textarea
              id="spell-description"
              name="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={500}
              rows={5}
              disabled={saving}
              className={`${inputClass} resize-y`}
            />

            <span className="mt-1 block text-right text-xs text-slate-500">
              {form.description.length}/500
            </span>
          </Field>

          <Field label="URL" htmlFor="spell-url">
            <input
              id="spell-url"
              name="url"
              type="url"
              value={form.url}
              onChange={(event) => update("url", event.target.value)}
              maxLength={300}
              placeholder="https://www.wowhead.com/spell=..."
              disabled={saving}
              className={inputClass}
            />

            {form.url.trim() ? (
              <a
                href={form.url.trim()}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block break-all text-sm text-blue-400 hover:underline"
              >
                {form.url.trim()}
              </a>
            ) : null}
          </Field>

          <Field label="Quality" htmlFor="spell-quality">
            <input
              id="spell-quality"
              name="quality"
              value={form.quality}
              onChange={(event) => update("quality", event.target.value)}
              maxLength={50}
              disabled={saving}
              className={inputClass}
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
              to="/Admin/Database?entity=Spells"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
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