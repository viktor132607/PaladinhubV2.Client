"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function iconPath(entity: EntityKind, icon: string): string {
  return `/images/${entity === "Items" ? "ItemIcons" : "SpellIcons"}/${encodeURIComponent(icon)}`;
}

export default function Database() {
  const [searchParams, setSearchParams] = useSearchParams();
  const entity = normalizeEntity(searchParams.get("entity"));
  const search = searchParams.get("search")?.trim() ?? "";
  const page = positiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(100, positiveInteger(searchParams.get("pageSize"), 20));

  const [searchInput, setSearchInput] = useState(search);
  const [data, setData] = useState<DatabaseResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ entity, search, page: String(page), pageSize: String(pageSize) });
        const response = await fetchBackend(`${databaseEndpoint}?${query.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await readApiJson<DatabaseResponse>(response);
        if (!controller.signal.aborted) setData(result ?? {});
      } catch (caught) {
        if (!controller.signal.aborted) {
          setData({});
          setError(caught instanceof Error ? caught.message : "The database records could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [entity, page, pageSize, search]);

  const records = useMemo<ItemRow[] | SpellRow[]>(
    () => entity === "Items" ? data.items ?? [] : data.spells ?? [],
    [data.items, data.spells, entity],
  );

  const total = Math.max(0, Number(data.total) || 0);
  const currentPageSize = Math.min(100, positiveInteger(data.pageSize, pageSize));
  const pages = Math.max(1, positiveInteger(data.pages, Math.ceil(total / currentPageSize) || 1));
  const currentPage = positiveInteger(data.page, page);

  const changeQuery = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next);
  };

  const queryUrl = (changes: Record<string, string | number>) => {
    const query = new URLSearchParams({ entity, search, page: String(page), pageSize: String(pageSize) });
    Object.entries(changes).forEach(([key, value]) => query.set(key, String(value)));
    return `/Admin/Database?${query.toString()}`;
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams({ entity });
    const nextSearch = searchInput.trim();
    if (nextSearch) next.set("search", nextSearch);
    setSearchParams(next);
  };

  return (
    <div id="admin-db-bleed">
      <div id="admin-db-inner">
        <ul className="nav nav-pills mb-3">
          {(["Spells", "Items"] as const).map((kind) => (
            <li className="nav-item" key={kind}>
              <Link className={`nav-link${entity === kind ? " active" : ""}`} to={queryUrl({ entity: kind, page: 1 })}>{kind}</Link>
            </li>
          ))}
        </ul>

        <form onSubmit={submitSearch} className="row g-2 mb-3">
          <div className="col-auto">
            <input className="form-control" type="text" name="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search..." aria-label="Search database records" />
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" type="submit">Search</button>{" "}
            <Link className="btn btn-secondary" to={`/Admin/Database?entity=${entity}`}>Clear</Link>
          </div>
          <div className="col ms-auto text-end">
            <Link className="btn btn-success" to={`/Admin/${entity}/Create`}>Create</Link>
          </div>
        </form>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        <div className="table-responsive">
          <table className="table table-dark table-striped align-middle table-wide">
            <thead>
              <tr>
                <th className="w-id">Id</th>
                <th className="w-icon">Icon</th>
                {entity === "Items" && <th className="w-icon">SecondIcon</th>}
                <th>Name</th>
                <th>Description</th>
                <th>Url</th>
                {entity === "Items" && <><th>ItemLevel</th><th>RequiredLevel</th></>}
                <th>Quality</th>
                <th className="w-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={entity === "Items" ? 10 : 7}>Loading records...</td></tr>
              ) : records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td className="icon-cell"><Icon entity={entity} name={record.icon} alt={record.name} /></td>
                  {entity === "Items" && <td className="icon-cell"><Icon entity={entity} name={(record as ItemRow).secondIcon} alt={record.name} /></td>}
                  <td>{record.name}</td>
                  <td className="text-trim" title={record.description ?? ""}>{record.description}</td>
                  <td className="url-cell">{record.url && <a href={record.url} target="_blank" rel="noopener noreferrer">{record.url}</a>}</td>
                  {entity === "Items" && <><td>{(record as ItemRow).itemLevel}</td><td>{(record as ItemRow).requiredLevel}</td></>}
                  <td>{record.quality}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link className="btn btn-outline-info" to={`/Admin/${entity}/Details/${record.id}`}>Detail</Link>
                      <Link className="btn btn-outline-light" to={`/Admin/${entity}/Edit/${record.id}`}>Edit</Link>
                      <Link className="btn btn-outline-warning" to={`/Admin/${entity}/Delete/${record.id}`}>Delete</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label="Database pagination">
            <ul className="pagination pagination-sm">
              <li className={`page-item${currentPage <= 1 ? " disabled" : ""}`}>
                <Link className="page-link" aria-disabled={currentPage <= 1} tabIndex={currentPage <= 1 ? -1 : undefined} to={queryUrl({ page: Math.max(1, currentPage - 1) })}>«</Link>
              </li>
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <li key={number} className={`page-item${number === currentPage ? " active" : ""}`}>
                  <Link className="page-link" aria-current={number === currentPage ? "page" : undefined} to={queryUrl({ page: number })}>{number}</Link>
                </li>
              ))}
              <li className={`page-item${currentPage >= pages ? " disabled" : ""}`}>
                <Link className="page-link" aria-disabled={currentPage >= pages} tabIndex={currentPage >= pages ? -1 : undefined} to={queryUrl({ page: Math.min(pages, currentPage + 1) })}>»</Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

function Icon({ entity, name, alt }: { entity: EntityKind; name?: string | null; alt: string }) {
  return name ? <><img src={iconPath(entity, name)} alt={alt} title={name} /><div className="icon-name">{name}</div></> : null;
}
