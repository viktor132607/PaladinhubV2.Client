"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { Link, useSearchParams } from "@/router/nextCompat";

type EntityKind = "Spells" | "Items";

type ItemRow = {
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

type SpellRow = {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality?: string | null;
};

type DatabaseResponse = {
  entity?: number | EntityKind;
  search?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  pages?: number;
  items?: ItemRow[] | null;
  spells?: SpellRow[] | null;
};

const databaseEndpoint = "/Admin/api/database";

function normalizeEntity(value: string | null): EntityKind {
  return value?.toLowerCase() === "items" ? "Items" : "Spells";
}

function iconPath(entity: EntityKind, icon: string): string {
  const folder = entity === "Items" ? "itemIcons" : "SpellIcons";
  return `/images/${folder}/${encodeURIComponent(icon)}`;
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default function Database() {
  const [searchParams, setSearchParams] = useSearchParams();
  const entity = normalizeEntity(searchParams.get("entity"));
  const search = searchParams.get("search")?.trim() ?? "";
  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(
    100,
    positiveInteger(searchParams.get("pageSize"), 20),
  );

  const [searchInput, setSearchInput] = useState(search);
  const [data, setData] = useState<DatabaseResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({
          entity,
          search,
          page: String(page),
          pageSize: String(pageSize),
        });

        const response = await fetchBackend(
          `${databaseEndpoint}?${query.toString()}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await readApiJson<DatabaseResponse>(response);

        if (!controller.signal.aborted) {
          setData(result ?? {});
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setData({});
        setError(
          caught instanceof Error
            ? caught.message
            : "The database records could not be loaded.",
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
  }, [entity, page, pageSize, search]);

  const records = useMemo<ItemRow[] | SpellRow[]>(() => {
    return entity === "Items" ? data.items ?? [] : data.spells ?? [];
  }, [data.items, data.spells, entity]);

  const total = Math.max(0, Number(data.total) || 0);
  const currentPageSize = Math.min(
    100,
    positiveInteger(data.pageSize, pageSize),
  );
  const pages = Math.max(
    1,
    positiveInteger(data.pages, Math.ceil(total / currentPageSize) || 1),
  );
  const currentPage = Math.min(pages, positiveInteger(data.page, page));

  const visiblePages = useMemo(() => {
    const first = Math.max(1, Math.min(currentPage - 3, pages - 6));
    const last = Math.min(pages, first + 6);

    return Array.from(
      { length: last - first + 1 },
      (_, index) => first + index,
    );
  }, [currentPage, pages]);

  const changeQuery = (
    changes: Record<string, string | number | null>,
  ) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    changeQuery({ search: searchInput.trim() || null, page: 1 });
  };

  return (
    <main
      id="admin-db-bleed"
      className="relative left-1/2 w-screen -translate-x-1/2 px-4 py-8 text-slate-100"
    >
      <section id="admin-db-inner" className="mx-auto max-w-[1920px]">
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Database entity"
        >
          {(["Spells", "Items"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={entity === kind}
              onClick={() => changeQuery({ entity: kind, page: 1 })}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                entity === kind
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {kind}
            </button>
          ))}
        </div>

        <form
          onSubmit={submitSearch}
          className="mb-5 flex flex-wrap items-center gap-2"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search..."
            aria-label="Search database records"
            className="min-w-64 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              changeQuery({ search: null, page: 1 });
            }}
            disabled={loading && !search}
            className="rounded-md bg-slate-700 px-4 py-2 font-medium hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>

          <Link
            to={
              entity === "Items"
                ? "/Admin/Items/Create"
                : "/Admin/Spells/Create"
            }
            className="ml-auto rounded-md bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500"
          >
            Create
          </Link>
        </form>

        {error ? (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900">
          {entity === "Items" ? (
            <ItemsTable rows={records as ItemRow[]} loading={loading} />
          ) : (
            <SpellsTable rows={records as SpellRow[]} loading={loading} />
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300">
          <span>
            {total} record{total === 1 ? "" : "s"}
          </span>

          {pages > 1 ? (
            <nav
              className="flex flex-wrap gap-1"
              aria-label="Database pagination"
            >
              <PageButton
                disabled={currentPage <= 1 || loading}
                label="«"
                onClick={() => changeQuery({ page: currentPage - 1 })}
              />

              {visiblePages.map((number) => (
                <PageButton
                  key={number}
                  active={number === currentPage}
                  disabled={loading}
                  label={String(number)}
                  onClick={() => changeQuery({ page: number })}
                />
              ))}

              <PageButton
                disabled={currentPage >= pages || loading}
                label="»"
                onClick={() => changeQuery({ page: currentPage + 1 })}
              />
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ItemsTable({
  rows,
  loading,
}: {
  rows: ItemRow[];
  loading: boolean;
}) {
  return (
    <table className="w-full min-w-[1500px] text-left text-sm">
      <thead className="bg-slate-800 text-slate-200">
        <tr>
          <Th>Id</Th>
          <Th>Icon</Th>
          <Th>SecondIcon</Th>
          <Th>Name</Th>
          <Th>Description</Th>
          <Th>Url</Th>
          <Th>ItemLevel</Th>
          <Th>RequiredLevel</Th>
          <Th>Quality</Th>
          <Th>Actions</Th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-700">
        {loading ? (
          <LoadingRow columns={10} />
        ) : rows.length ? (
          rows.map((item) => (
            <tr
              key={item.id}
              className="odd:bg-slate-900 even:bg-slate-800/40"
            >
              <Td>{item.id}</Td>
              <Td>
                <Icon entity="Items" name={item.icon} alt={item.name} />
              </Td>
              <Td>
                <Icon
                  entity="Items"
                  name={item.secondIcon}
                  alt={item.name}
                />
              </Td>
              <Td>{item.name}</Td>
              <Td>
                <Trimmed value={item.description} />
              </Td>
              <Td>
                <ExternalUrl value={item.url} />
              </Td>
              <Td>{item.itemLevel ?? "—"}</Td>
              <Td>{item.requiredLevel ?? "—"}</Td>
              <Td>{item.quality || "—"}</Td>
              <Td>
                <Actions entity="Items" id={item.id} />
              </Td>
            </tr>
          ))
        ) : (
          <EmptyRow columns={10} />
        )}
      </tbody>
    </table>
  );
}

function SpellsTable({
  rows,
  loading,
}: {
  rows: SpellRow[];
  loading: boolean;
}) {
  return (
    <table className="w-full min-w-[1100px] text-left text-sm">
      <thead className="bg-slate-800 text-slate-200">
        <tr>
          <Th>Id</Th>
          <Th>Icon</Th>
          <Th>Name</Th>
          <Th>Description</Th>
          <Th>Url</Th>
          <Th>Quality</Th>
          <Th>Actions</Th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-700">
        {loading ? (
          <LoadingRow columns={7} />
        ) : rows.length ? (
          rows.map((spell) => (
            <tr
              key={spell.id}
              className="odd:bg-slate-900 even:bg-slate-800/40"
            >
              <Td>{spell.id}</Td>
              <Td>
                <Icon entity="Spells" name={spell.icon} alt={spell.name} />
              </Td>
              <Td>{spell.name}</Td>
              <Td>
                <Trimmed value={spell.description} />
              </Td>
              <Td>
                <ExternalUrl value={spell.url} />
              </Td>
              <Td>{spell.quality || "—"}</Td>
              <Td>
                <Actions entity="Spells" id={spell.id} />
              </Td>
            </tr>
          ))
        ) : (
          <EmptyRow columns={7} />
        )}
      </tbody>
    </table>
  );
}

function Actions({
  entity,
  id,
}: {
  entity: EntityKind;
  id: number;
}) {
  const segment = entity === "Items" ? "Items" : "Spells";

  return (
    <div className="flex whitespace-nowrap">
      <Link
        to={`/Admin/${segment}/Details/${id}`}
        className="rounded-l border border-cyan-500/70 px-3 py-1.5 text-cyan-300 hover:bg-cyan-950/50"
      >
        Detail
      </Link>

      <Link
        to={`/Admin/${segment}/Edit/${id}`}
        className="border-y border-slate-500 px-3 py-1.5 text-slate-100 hover:bg-slate-700"
      >
        Edit
      </Link>

      <Link
        to={`/Admin/${segment}/Delete/${id}`}
        className="rounded-r border border-amber-500/70 px-3 py-1.5 text-amber-300 hover:bg-amber-950/50"
      >
        Delete
      </Link>
    </div>
  );
}

function Icon({
  entity,
  name,
  alt,
}: {
  entity: EntityKind;
  name?: string | null;
  alt: string;
}) {
  if (!name) {
    return <>—</>;
  }

  return (
    <div className="w-32">
      <img
        src={iconPath(entity, name)}
        alt={alt}
        title={name}
        loading="lazy"
        className="h-7 w-7 rounded object-cover"
      />

      <div className="mt-1 truncate text-xs text-slate-400" title={name}>
        {name}
      </div>
    </div>
  );
}

function ExternalUrl({ value }: { value?: string | null }) {
  return value ? (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="block max-w-72 break-all text-blue-400 hover:underline"
    >
      {value}
    </a>
  ) : (
    <>—</>
  );
}

function Trimmed({ value }: { value?: string | null }) {
  return (
    <div className="max-w-lg truncate" title={value ?? ""}>
      {value || "—"}
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 font-semibold">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-3 align-middle text-slate-300">
      {children}
    </td>
  );
}

function LoadingRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="px-4 py-12 text-center text-slate-400"
      >
        Loading records...
      </td>
    </tr>
  );
}

function EmptyRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="px-4 py-12 text-center text-slate-400"
      >
        No records found.
      </td>
    </tr>
  );
}

function PageButton({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={`min-w-9 rounded border px-3 py-1.5 ${
        active
          ? "border-blue-500 bg-blue-600 text-white"
          : "border-slate-600 bg-slate-900 hover:bg-slate-800"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}