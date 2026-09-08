"use client";

import { useEffect, useState } from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type ItemDto = {
  id: number;
  name: string;
  icon?: string | null;
  quality?: string | null;
};

type CsrfResponse = {
  token?: string;
};

const itemsApiEndpoint = "/Admin/api/items";

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

export default function DeleteItem() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const itemId = Number(id);
  const hasValidId = Number.isInteger(itemId) && itemId > 0;

  useEffect(() => {
    if (!hasValidId) {
      setItem(null);
      setError("Invalid or missing item ID.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchBackend(
          `${itemsApiEndpoint}/${itemId}/delete`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await readApiJson<ItemDto>(response);

        if (!controller.signal.aborted) {
          setItem(result);
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setItem(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "The item could not be loaded.",
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
  }, [hasValidId, itemId]);

  const confirmDelete = async () => {
    if (!hasValidId || deleting) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(
        `${itemsApiEndpoint}/${itemId}`,
        {
          method: "DELETE",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
        },
      );

      await readApiJson<unknown>(response);
      navigate("/Admin/Database?entity=Items");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The item could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="px-4 py-12 text-center text-slate-300">
        Loading item...
      </main>
    );
  }

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-2xl font-semibold">Delete Item</h2>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {item ? (
          <>
            <p className="mt-6 text-slate-200">
              Are you sure you want to delete this item?
            </p>

            <dl className="mt-5 overflow-hidden rounded-lg border border-slate-700">
              <div className="grid gap-2 px-4 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="font-medium text-slate-400">Name</dt>
                <dd>{item.name}</dd>
              </div>

              <div className="grid gap-2 border-t border-slate-700 px-4 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="font-medium text-slate-400">ID</dt>
                <dd>{item.id}</dd>
              </div>

              <div className="grid gap-2 border-t border-slate-700 px-4 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="font-medium text-slate-400">Quality</dt>
                <dd>{item.quality || "—"}</dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-md bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

              <Link
                to="/Admin/Database?entity=Items"
                className="rounded-md bg-slate-700 px-5 py-2.5 font-medium hover:bg-slate-600"
              >
                Cancel
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <p className="text-slate-300">The item was not found.</p>

            <Link
              to="/Admin/Database?entity=Items"
              className="mt-5 inline-flex rounded-md bg-slate-700 px-5 py-2.5 hover:bg-slate-600"
            >
              Back
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}