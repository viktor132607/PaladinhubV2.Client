"use client";

import { useEffect, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { Link, useParams } from "@/router/nextCompat";

type SpellDto = {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality?: string | null;
};

const spellsApiEndpoint = "/Admin/api/spells";

export default function SpellDetails() {
  const { id } = useParams<{ id?: string }>();

  const [spell, setSpell] = useState<SpellDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [iconFailed, setIconFailed] = useState(false);

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
      setIconFailed(false);

      try {
        const response = await fetchBackend(
          `${spellsApiEndpoint}/${spellId}`,
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

  if (loading) {
    return <PageMessage message="Loading spell..." />;
  }

  if (error || !spell) {
    return (
      <main className="px-4 py-8 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-red-950/30 p-6">
          <h1 className="text-2xl font-semibold">Spell Details</h1>

          <p className="mt-4 text-red-200" role="alert">
            {error || "Spell not found."}
          </p>

          <Link
            to="/Admin/Database?entity=Spells"
            className="mt-6 inline-block rounded-md bg-slate-700 px-5 py-2.5 font-medium hover:bg-slate-600"
          >
            Back
          </Link>
        </section>
      </main>
    );
  }

  const iconSource = spell.icon
    ? `/images/SpellIcons/${encodeURIComponent(spell.icon)}`
    : "";

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Spell Details</h1>
            <p className="mt-1 text-sm text-slate-400">
              Spell ID: {spell.id}
            </p>
          </div>

          <Link
            to={`/Admin/Spells/Edit/${spell.id}`}
            className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
          >
            Edit
          </Link>
        </div>

        <dl className="mt-6 divide-y divide-slate-700 overflow-hidden rounded-lg border border-slate-700 bg-slate-950/40">
          <Detail label="Name" value={spell.name} />

          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[12rem_1fr]">
            <dt className="font-medium text-slate-300">Icon</dt>

            <dd>
              {iconSource ? (
                <div className="flex items-center gap-3">
                  {!iconFailed ? (
                    <img
                      src={iconSource}
                      alt={spell.name}
                      onError={() => setIconFailed(true)}
                      className="h-16 w-16 rounded-md border border-slate-600 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-red-500/60 text-xs text-red-300">
                      Missing
                    </div>
                  )}

                  <span className="break-all text-sm text-slate-300">
                    {spell.icon}
                  </span>
                </div>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <Detail
            label="Description"
            value={spell.description}
            preserveWhitespace
          />

          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[12rem_1fr]">
            <dt className="font-medium text-slate-300">URL</dt>

            <dd>
              {spell.url ? (
                <a
                  href={spell.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-400 hover:underline"
                >
                  {spell.url}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <Detail label="Quality" value={spell.quality} />
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/Admin/Database?entity=Spells"
            className="rounded-md bg-slate-700 px-5 py-2.5 font-medium hover:bg-slate-600"
          >
            Back
          </Link>

          <Link
            to={`/Admin/Spells/Delete/${spell.id}`}
            className="rounded-md border border-red-500/70 px-5 py-2.5 font-medium text-red-300 hover:bg-red-950/50"
          >
            Delete
          </Link>
        </div>
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

function PageMessage({ message }: { message: string }) {
  return (
    <main className="px-4 py-12 text-center text-slate-300">
      {message}
    </main>
  );
}