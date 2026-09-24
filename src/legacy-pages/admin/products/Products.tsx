"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { backendEndpoints, backendUrl, fetchBackend, readApiJson } from "@/config/api";
import { normalizeJson, type Product } from "@/pages/Products";
import { Link } from "@/router/nextCompat";
import { useCurrency } from "@/currency/CurrencyContext";

type ProductPage = ReturnType<typeof normalizeJson>;

function imageSource(url: string | null): string {
  if (!url) return "/images/placeholder.png";
  if (/^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url)) return url;
  return backendUrl(url);
}

export default function AdminProducts() {
  const { formatMoney } = useCurrency();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ Page: String(page), PageSize: "20", SortBy: "0", Desc: "false" });
      if (submittedSearch) query.set("Search", submittedSearch);
      if (category) query.append("Categories", category);
      const response = await fetchBackend(`${backendEndpoints.merchandise.list}?${query}`, { cache: "no-store", signal });
      const result = normalizeJson(await readApiJson<unknown>(response));
      if (!signal?.aborted) setData(result);
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Could not load products.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, submittedSearch, category]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setDeletingId(product.id);
    setError("");
    setNotice("");
    try {
      const response = await fetchBackend(backendEndpoints.product.delete(product.id), { method: "DELETE", cache: "no-store" });
      await readApiJson<unknown>(response);
      setNotice(`${product.name} was deleted.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The product could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  return (
    <div className="container-fluid admin-products-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div><h1 className="h3 mb-1">Products</h1><p className="text-muted mb-0">Manage the products shown in the merchandise shop.</p></div>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-secondary" to="/Merchandise/Merchandise">View shop</Link>
          {hasPermission(adminPermissions.products.create) && <Link className="btn btn-primary" to="/Admin/Products/Create?returnTo=admin">Create product</Link>}
        </div>
      </div>

      <form className="admin-products-filters d-flex flex-wrap gap-2 mb-3" onSubmit={submitSearch} role="search">
        <label className="visually-hidden" htmlFor="admin-product-search">Search products</label>
        <input id="admin-product-search" className="form-control" type="search" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
        <label className="visually-hidden" htmlFor="admin-product-category">Category</label>
        <select id="admin-product-category" className="form-select" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {data?.allCategories.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Search</button>
        {(submittedSearch || category) && <button className="btn btn-outline-secondary" type="button" onClick={() => { setSearch(""); setSubmittedSearch(""); setCategory(""); setPage(1); }}>Clear</button>}
      </form>

      <div aria-live="polite">
        {error && <div className="alert alert-danger">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
      </div>
      {loading ? <p>Loading products…</p> : !data?.products.length ? <p>No products found.</p> : <>
        <div className="table-responsive">
          <table className="table table-striped align-middle admin-record-table">
            <thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price</th><th scope="col">Reviews</th><th scope="col">Actions</th></tr></thead>
            <tbody>{data.products.map((product) => <tr key={product.id}>
              <td data-label="Product"><div className="d-flex align-items-center gap-2"><img className="admin-product-thumb" src={imageSource(product.imageUrl)} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/placeholder.png"; }} /><strong>{product.name}</strong></div></td>
              <td data-label="Category">{product.category}</td>
              <td data-label="Price">{formatMoney(product.price)}</td>
              <td data-label="Reviews">{product.reviewsCount}</td>
              <td data-label="Actions"><div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-sm btn-outline-secondary" to={`/Products/Details/${encodeURIComponent(product.id)}`}>View</Link>
                {hasPermission(adminPermissions.products.update) && <Link className="btn btn-sm btn-primary" to={`/Admin/Products/Edit/${encodeURIComponent(product.id)}?returnTo=admin`}>Edit</Link>}
                {hasPermission(adminPermissions.products.delete) && <button className="btn btn-sm btn-outline-danger" type="button" disabled={deletingId !== null} onClick={() => void deleteProduct(product)}>{deletingId === product.id ? "Deleting…" : "Delete"}</button>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="text-muted">{data.totalItems} products · Page {data.page} of {data.totalPages}</span>
          <div className="d-flex gap-2"><button className="btn btn-outline-secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn btn-outline-secondary" type="button" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>
        </div>
      </>}
    </div>
  );
}
