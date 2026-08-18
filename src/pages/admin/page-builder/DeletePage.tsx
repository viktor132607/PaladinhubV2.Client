"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useSearchParams } from "@/router/nextCompat";

type SectionName = "Holy" | "Protection" | "Retribution";

type DeletePageDetails = {
  id: number;
  title: string;
  section: string;
  slug: string;
  createdAt?: string;
};

type CsrfResponse = {
  token?: string;
};

type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

function normalizeSection(value: string | null | undefined): SectionName {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "protection" || normalized === "prot") {
    return "Protection";
  }

  if (
    normalized === "retribution" ||
    normalized === "retri" ||
    normalized === "ret"
  ) {
    return "Retribution";
  }

  return "Holy";
}

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

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ErrorResponse
      | null;

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

export default function DeletePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedSection = normalizeSection(searchParams.get("section"));
  const requestedSlug = searchParams.get("slug")?.trim() ?? "";

  const [page, setPage] = useState<DeletePageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requestedSlug) {
      setPage(null);
      setError("The page slug is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setPage(null);
      setError("");

      try {
        const query = new URLSearchParams({
          section: requestedSection,
          slug: requestedSlug,
        });

        const response = await fetchBackend(
          `/Admin/PageBuilder/DeleteConfirm?${query.toString()}`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await readApiJson<DeletePageDetails>(response);

        if (controller.signal.aborted) {
          return;
        }

        setPage({
          ...result,
          section: normalizeSection(result.section),
        });
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "The page could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [requestedSection, requestedSlug]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!page || deleting) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const csrfToken = await getCsrfToken();

      const query = new URLSearchParams({
        section: page.section,
        slug: page.slug,
      });

      const response = await fetchBackend(
        `/Admin/api/pages?${query.toString()}`,
        {
          method: "DELETE",
          cache: "no-store",
          headers: {
            "X-CSRF-TOKEN": csrfToken,
          },
        },
      );

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      navigate(`/${page.section}/Overview`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The page could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="px-4 py-12 text-center text-slate-300">
        Loading page...
      </main>
    );
  }

  if (!page) {
    return (
      <main className="px-4 py-10 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-xl">
          <h1 className="text-3xl font-semibold text-red-300">
            Delete Page
          </h1>

          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error || "The page was not found."}
          </div>

          <Link
            to={`/${requestedSection}/Overview`}
            className="mt-6 inline-flex rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
          >
            Back
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-3xl font-semibold text-red-300">
          Delete Page
        </h1>

        <div className="mt-5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-5 py-4 text-amber-100">
          <p>
            <strong>Warning!</strong> You are about to delete the page{" "}
            <span className="font-bold">{page.title}</span> from section{" "}
            <span className="font-bold uppercase">{page.section}</span>.
          </p>

          <p className="mt-2">
            This action <strong>cannot</strong> be undone.
          </p>
        </div>

        <dl className="mt-6 divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-950/50">
          <Detail label="ID" value={String(page.id)} />
          <Detail label="Section" value={page.section} />
          <Detail label="Title" value={page.title} />
          <Detail label="Slug" value={page.slug} />
        </dl>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={deleting}
            className="rounded-md bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "🗑 Confirm Delete"}
          </button>

          <Link
            to={`/${page.section}/Overview`}
            className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
          >
            Cancel
          </Link>
        </form>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 px-4 py-4 sm:grid-cols-[9rem_1fr]">
      <dt className="font-medium text-slate-400">{label}</dt>
      <dd className="break-all text-slate-100">{value}</dd>
    </div>
  );
}