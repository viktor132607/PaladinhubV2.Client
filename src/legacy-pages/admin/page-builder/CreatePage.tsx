"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useSearchParams } from "@/router/nextCompat";

type SectionName = "Holy" | "Protection" | "Retribution";

type ManagedPage = {
  id: number;
  section: SectionName;
  title: string;
  slug: string;
  isPublished: boolean;
  jsonLayout?: string;
};

type CsrfResponse = {
  token?: string;
};

type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
};

const inputClass =
  "w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

function normalizeSection(value: string | null | undefined): SectionName {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "protection" || normalized === "prot") return "Protection";
  if (
    normalized === "retribution" ||
    normalized === "retri" ||
    normalized === "ret"
  ) {
    return "Retribution";
  }
  return "Holy";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countBlocks(jsonLayout?: string): number {
  if (!jsonLayout) return 0;
  try {
    const parsed: unknown = JSON.parse(jsonLayout);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ErrorResponse
      | null;
    return (
      payload?.message ||
      payload?.title ||
      payload?.error ||
      `Request failed with status ${response.status}.`
    );
  }
  return (await response.text().catch(() => "")) || `Request failed with status ${response.status}.`;
}

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idValue = Number(searchParams.get("id") || 0);
  const editingId = Number.isInteger(idValue) && idValue > 0 ? idValue : 0;
  const isEditing = editingId > 0;

  const [section, setSection] = useState<SectionName>(() =>
    normalizeSection(searchParams.get("section")),
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [existingBlockCount, setExistingBlockCount] = useState(0);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const response = await fetchBackend(
          `/Admin/api/page-builder/pages/${editingId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const page = await readApiJson<ManagedPage>(response);
        if (controller.signal.aborted) return;
        setSection(normalizeSection(page.section));
        setTitle(page.title);
        setSlug(page.slug);
        setIsPublished(page.isPublished);
        setExistingBlockCount(countBlocks(page.jsonLayout));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "The page could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [editingId, isEditing]);

  const finalSlug = useMemo(() => slugify(slug || title), [slug, title]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setError("");
    const normalizedTitle = title.trim();
    const normalizedSlug = finalSlug;

    if (!normalizedTitle) {
      setError("Page title is required.");
      return;
    }
    if (!normalizedSlug) {
      setError("Slug is required.");
      return;
    }
    if (normalizedTitle.length > 200) {
      setError("Page title cannot exceed 200 characters.");
      return;
    }
    if (normalizedSlug.length > 100) {
      setError("Slug cannot exceed 100 characters.");
      return;
    }

    setSaving(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(
        isEditing
          ? `/Admin/api/page-builder/pages/${editingId}`
          : "/Admin/api/page-builder/pages",
        {
          method: isEditing ? "PUT" : "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify({
            section,
            title: normalizedTitle,
            slug: normalizedSlug,
            isPublished,
          }),
        },
      );

      if (!response.ok) throw new Error(await responseMessage(response));
      await readApiJson<ManagedPage>(response);
      navigate("/Admin/PageBuilder/Index");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The page could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="px-4 py-12 text-center text-slate-300">
        Loading page...
      </main>
    );
  }

  return (
    <main className="px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <BuilderNavigation />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              {isEditing ? "Edit Page" : "Add Page"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Define the page first. Lego-style content blocks will be added here next.
            </p>
          </div>
          <Link
            to="/Admin/PageBuilder/Index"
            className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600"
          >
            Back to pages
          </Link>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-6">
          <section className="grid gap-5 rounded-xl border border-slate-700 bg-slate-900 p-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Category / Section
              </span>
              <select
                className={inputClass}
                value={section}
                disabled={saving}
                onChange={(event) =>
                  setSection(event.target.value as SectionName)
                }
              >
                <option value="Holy">Holy</option>
                <option value="Protection">Protection</option>
                <option value="Retribution">Retribution</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Page name
              </span>
              <input
                className={inputClass}
                value={title}
                maxLength={200}
                disabled={saving}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Mythic+ Guide"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Slug
              </span>
              <input
                className={inputClass}
                value={slug}
                maxLength={100}
                disabled={saving}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="mythic-plus-guide"
              />
              <span className="mt-2 block text-xs text-slate-400">
                Route: /{section}/{finalSlug || "page-slug"}
              </span>
            </label>

            <label className="flex items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={isPublished}
                disabled={saving}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-4 w-4"
              />
              <span>
                Published
                <span className="ml-2 text-sm text-slate-400">
                  Uncheck to keep the page as a draft.
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Page content</h2>
                <p className="mt-1 text-sm text-slate-400">
                  This is the slot where the reusable Lego components will be assembled.
                </p>
              </div>
              {isEditing ? (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  Existing blocks preserved: {existingBlockCount}
                </span>
              ) : null}
            </div>

            <div className="flex min-h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center text-slate-400">
              Component builder placeholder — block implementation comes in the next step.
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-amber-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditing ? "Save page" : "Create page"}
            </button>
            <Link
              to="/Admin/PageBuilder/Index"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold hover:bg-slate-600"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
