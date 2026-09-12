"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { spellIconSource } from "@/lib/spell-icons";
import { adminRequest, categoryPath, type Category } from "@/lib/admin-categories";
import { Link, useSearchParams } from "@/router/nextCompat";

type EntityKind = "Spells" | "Items";

type ItemRow = {
  categoryId?: number | null;
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
  categoryId?: number | null;
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
  return entity === "Spells" ? spellIconSource(icon) : `/images/ItemIcons/${encodeURIComponent(icon)}`;
}

export default function Database() {
  const [searchParams, setSearchParams] = useSearchParams();
  const entity = normalizeEntity(searchParams.get("entity"));
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void adminRequest<Category[]>("/Admin/api/categories", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCategories(result); })
      .catch(error => { if (!controller.signal.aborted) setCategoryError(error.message); });
    return () => controller.abort();
  }, []);
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
        if (categoryId !== "") query.set("categoryId", categoryId);
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
  }, [entity, page, pageSize, search, categoryId]);

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
    if (categoryId !== "") query.set("categoryId", categoryId);
    Object.entries(changes).forEach(([key, value]) => query.set(key, String(value)));
    return `/Admin/Database?${query.toString()}`;
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams({ entity });
    if (categoryId !== "") next.set("categoryId", categoryId);
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
          <div className="col-12 col-md-auto">
            <select className="form-select" aria-label="Filter by category" value={categoryId} onChange={event => changeQuery({ categoryId: event.target.value, page: 1 })}>
              <option value="">All categories</option><option value="0">Uncategorized</option>
              {categories.filter(category => !category.isDeleted).map(category => <option key={category.id} value={category.id}>{categoryPath(category.id, categories)}{category.isArchived ? " (archived)" : ""}</option>)}
            </select>
          </div>
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
        {categoryError && <div className="alert alert-danger" role="alert">Categories: {categoryError}</div>}

        <div className="table-responsive">
          <table className="admin-record-table table table-dark table-striped align-middle table-wide">
            <thead>
              <tr>
                <th className="w-id">Id</th>
                <th className="w-icon">Icon</th>
                {entity === "Items" && <th className="w-icon">SecondIcon</th>}
                <th>Name</th>
                <th>Description</th>
                <th>Url</th>
                {entity === "Items" && <><th>ItemLevel</th><th>RequiredLevel</th></>}
                <th>Type</th>
                <th>Category</th>
                <th className="w-actions text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={entity === "Items" ? 11 : 8}>Loading records...</td></tr>
              ) : records.map((record) => (
                <tr key={record.id}>
                  <td data-label="Id">{record.id}</td>
                  <td data-label="Icon" className="icon-cell"><Icon entity={entity} name={record.icon} alt={record.name} /></td>
                  {entity === "Items" && <td data-label="Second icon" className="icon-cell"><Icon entity={entity} name={(record as ItemRow).secondIcon} alt={record.name} /></td>}
                  <td data-label="Name">{record.name}</td>
                  <td data-label="Description" className="text-trim" title={record.description ?? ""}>{record.description}</td>
                  <td data-label="Url" className="url-cell">{record.url && <a href={record.url} target="_blank" rel="noopener noreferrer">{record.url}</a>}</td>
                  {entity === "Items" && <><td data-label="Item level">{(record as ItemRow).itemLevel}</td><td data-label="Required level">{(record as ItemRow).requiredLevel}</td></>}
                  <td data-label="Type">{record.quality}</td>
                  <td data-label="Category">{record.categoryId ? categoryPath(record.categoryId, categories) : "Uncategorized"}</td>
                  <td data-label="Actions" className="text-end">
                    <div className="btn-group btn-group-sm" role="group" aria-label={`Actions for ${record.name}`}>
                      <Link className="btn btn-outline-info px-2" to={`/Admin/${entity}/Details/${record.id}`} title="Details" aria-label={`Details for ${record.name}`}><DetailIcon /></Link>
                      <Link className="btn btn-outline-light px-2" to={`/Admin/${entity}/Edit/${record.id}`} title="Edit" aria-label={`Edit ${record.name}`}><EditIcon /></Link>
                      <Link className="btn btn-outline-warning px-2" to={`/Admin/${entity}/Delete/${record.id}`} title="Delete" aria-label={`Delete ${record.name}`}><TrashIcon /></Link>
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

function DetailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2Z" />
      <path d="M7.25 6.75h1.5v4.5h-1.5zM8 4.25a.875.875 0 1 1 0 1.75.875.875 0 0 1 0-1.75Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.854.146a.5.5 0 0 1 .707 0l2.293 2.293a.5.5 0 0 1 0 .707L6.207 12.793l-3.182.795a.5.5 0 0 1-.606-.606l.795-3.182L12.854.146Zm.353 1.061L4.146 10.268l-.53 2.121 2.121-.53 9.061-9.061-1.591-1.591Z" />
      <path d="M11.5 2.5 13.5 4.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1 0-2H5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2h2.5a1 1 0 0 1 1 1ZM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4Zm2-2h4a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1Z" />
    </svg>
  );
}
