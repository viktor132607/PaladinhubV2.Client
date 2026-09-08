"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type SpellDto = {
  id: number;
  name: string;
  description?: string | null;
  quality?: string | null;
};

type CsrfResponse = {
  token?: string;
};

const spellsApiEndpoint = "/Admin/api/spells";

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

export default function DeleteSpell() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [spell, setSpell] = useState<SpellDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const spellId = Number(id);
  const hasValidId = Number.isInteger(spellId) && spellId > 0;

  useEffect(() => {
    if (!hasValidId) {
      setSpell(null);
      setError("Invalid or missing spell ID.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setSpell(null);
      setError("");

      try {
        const response = await fetchBackend(
          `${spellsApiEndpoint}/${spellId}/delete`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await readApiJson<SpellDto>(response);

        if (!controller.signal.aborted) {
          setSpell(result);
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "The spell could not be loaded.",
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
  }, [hasValidId, spellId]);

  const remove = async () => {
    if (!hasValidId || !spell || deleting) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(
        `${spellsApiEndpoint}/${spellId}`,
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
      navigate("/Admin/Database?entity=Spells");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The spell could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <PageMessage message="Loading spell..." />;
  }

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-3xl font-semibold">Delete Spell</h1>

        {error ? (
          <div
            className="mt-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {spell ? (
          <>
            <p className="mt-3 text-slate-300">
              Are you sure you want to delete this spell?
            </p>

            <dl className="mt-6 divide-y divide-slate-700 overflow-hidden rounded-lg border border-slate-700 bg-slate-950/40">
              <Detail label="Name" value={spell.name} />

              <Detail
                label="Description"
                value={spell.description}
                preserveWhitespace
              />

              <Detail label="Quality" value={spell.quality} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void remove()}
                disabled={deleting}
                className="rounded-md bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

              <Link
                to="/Admin/Database?entity=Spells"
                className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
              >
                Cancel
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <p className="text-slate-300">The spell was not found.</p>

            <Link
              to="/Admin/Database?entity=Spells"
              className="mt-5 inline-flex rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
            >
              Back
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function Detail({
  label,
  value,
  preserveWhitespace = false,
}: {
  label: string;
  value?: string | null;
  preserveWhitespace?: boolean;
}) {
  return (
    <div className="grid gap-2 px-4 py-4 sm:grid-cols-[12rem_1fr]">
      <dt className="font-medium text-slate-300">{label}</dt>

      <dd
        className={
          preserveWhitespace
            ? "whitespace-pre-wrap text-slate-100"
            : "text-slate-100"
        }
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function PageMessage({ message }: { message: ReactNode }) {
  return (
    <main className="px-4 py-12 text-center text-slate-300">
      {message}
    </main>
  );
}