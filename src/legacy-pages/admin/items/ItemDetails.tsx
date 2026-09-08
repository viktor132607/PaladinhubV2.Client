"use client";

import { useEffect, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { Link, useParams } from "@/router/nextCompat";

type ItemDto = {
  id: number;
  name: string;
  icon?: string | null;
  secondIcon?: string | null;
  description?: string | null;
  url?: string | null;
  itemLevel?: number | null;
  requiredLevel?: number | null;
  quality?: string | null;
};

const itemsApiEndpoint = "/Admin/api/items";

function itemIcon(name: string): string {
  return `/images/itemIcons/${encodeURIComponent(name)}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export default function ItemDetails() {
  const { id } = useParams<{ id?: string }>();

  const [item, setItem] = useState<ItemDto | null>(null);
  const [loading, setLoading] = useState(true);
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
      setItem(null);
      setError("");

      try {
        const response = await fetchBackend(`${itemsApiEndpoint}/${itemId}`, {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await readApiJson<ItemDto>(response);

        if (!controller.signal.aborted) {
          setItem(result);
        }
      } catch (caught) {
        if (controller.signal.aborted || isAbortError(caught)) {
          return;
        }

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

  if (loading) {
    return <PageMessage message="Loading item..." />;
  }

  if (error || !item) {
    return (
      <main className="px-4 py-8 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-red-950/30 p-6">
          <h2 className="text-2xl font-semibold">Item Details</h2>

          <p className="mt-4 text-red-200">
            {error || "Item not found."}
          </p>

          <Link
            to="/Admin/Database?entity=Items"
            className="mt-6 inline-flex rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600"
          >
            Back
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Item Details</h2>
            <p className="mt-1 text-sm text-slate-400">Record #{item.id}</p>
          </div>

          <Link
            to={`/Admin/Items/Edit/${item.id}`}
            className="rounded-md border border-slate-500 px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            Edit
          </Link>
        </div>

        <dl className="mt-7 divide-y divide-slate-700 overflow-hidden rounded-lg border border-slate-700">
          <Detail label="Name" value={item.name} />

          <IconDetail
            label="Icon"
            fileName={item.icon}
            itemName={item.name}
          />

          <IconDetail
            label="Second Icon"
            fileName={item.secondIcon}
            itemName={item.name}
          />

          <Detail
            label="Description"
            value={item.description}
            preserveWhitespace
          />

          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[12rem_1fr]">
            <dt className="font-medium text-slate-300">Url</dt>

            <dd className="min-w-0 text-slate-100">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-400 hover:underline"
                >
                  {item.url}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <Detail label="Item Level" value={item.itemLevel} />
          <Detail label="Required Level" value={item.requiredLevel} />
          <Detail label="Quality" value={item.quality} />
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/Admin/Database?entity=Items"
            className="rounded-md bg-slate-700 px-5 py-2.5 font-medium hover:bg-slate-600"
          >
            Back
          </Link>

          <Link
            to={`/Admin/Items/Delete/${item.id}`}
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
  value: string | number | null | undefined;
  preserveWhitespace?: boolean;
}) {
  const displayValue =
    value === null || value === undefined || value === "" ? "—" : value;

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
        {displayValue}
      </dd>
    </div>
  );
}

function IconDetail({
  label,
  fileName,
  itemName,
}: {
  label: string;
  fileName?: string | null;
  itemName: string;
}) {
  return (
    <div className="grid gap-2 px-4 py-4 sm:grid-cols-[12rem_1fr]">
      <dt className="font-medium text-slate-300">{label}</dt>

      <dd className="text-slate-100">
        {fileName ? (
          <div className="flex items-center gap-3">
            <img
              src={itemIcon(fileName)}
              alt={`${itemName} ${label}`}
              className="h-16 w-16 rounded-md border border-slate-600 object-cover"
              loading="lazy"
            />

            <span className="break-all text-sm text-slate-300">
              {fileName}
            </span>
          </div>
        ) : (
          "—"
        )}
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