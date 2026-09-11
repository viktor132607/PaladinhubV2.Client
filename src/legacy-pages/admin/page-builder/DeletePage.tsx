"use client";

import { FormEvent, useEffect, useState } from "react";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useSearchParams } from "@/router/nextCompat";

type DeletePageDetails = {
  id: number;
  title: string;
  section: string;
  slug: string;
  isPublished: boolean;
};

type CsrfResponse = {
  token?: string;
};

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

export default function DeletePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = Number(searchParams.get("id") || 0);

  const [page, setPage] = useState<DeletePageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("The page ID is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetchBackend(
          `/Admin/api/page-builder/pages/${id}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const result = await readApiJson<DeletePageDetails>(response);
        if (!controller.signal.aborted) setPage(result);
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
  }, [id]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!page || deleting) return;

    setDeleting(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(
        `/Admin/api/page-builder/pages/${page.id}`,
        {
          method: "DELETE",
          cache: "no-store",
          headers: {
            "X-CSRF-TOKEN": csrfToken,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}.`);
      }
      navigate("/Admin/PageBuilder/Index");
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
      <main className="admin-page-builder px-4 py-12 text-center text-slate-300">
        Loading page...
      </main>
    );
  }

  return (
    <main className="admin-page-builder px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <BuilderNavigation />

        <section className="rounded-xl border border-red-500/40 bg-slate-900 p-6">
          <h1 className="text-3xl font-semibold text-red-300">Delete Page</h1>

          {!page ? (
            <>
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200"
              >
                {error || "The page was not found."}
              </div>
              <Link
                to="/Admin/PageBuilder/Index"
                className="mt-6 inline-flex rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600"
              >
                Back to pages
              </Link>
            </>
          ) : (
            <>
              <div className="mt-5 rounded-lg border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-amber-100">
                This deletes only the dynamic Page Builder page. Hardcoded guide pages are not part of this delete flow.
              </div>

              <dl className="mt-6 divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-950/50">
                <Detail label="Page" value={page.title} />
                <Detail label="Category" value={page.section} />
                <Detail label="Slug" value={page.slug} />
                <Detail label="Route" value={`/${page.section}/${page.slug}`} />
              </dl>

              {error ? (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200"
                >
                  {error}
                </div>
              ) : null}

              <form onSubmit={submit} className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={deleting}
                  className="rounded-md bg-red-700 px-5 py-2.5 font-semibold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete page"}
                </button>
                <Link
                  to="/Admin/PageBuilder/Index"
                  className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold hover:bg-slate-600"
                >
                  Cancel
                </Link>
              </form>
            </>
          )}
        </section>
      </div>
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
