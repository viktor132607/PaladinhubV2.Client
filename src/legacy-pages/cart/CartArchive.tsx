"use client";

import { useCallback, useEffect, useState } from "react";
import { backendEndpoints, fetchBackend } from "@/config/api";
import { Link } from "@/router/nextCompat";

type ArchivedCart = {
  id: string;
  username: string;
  orderDate: string;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function normalizeArchive(payload: unknown): ArchivedCart[] {
  const root = asRecord(payload);
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.carts)
        ? root.carts
        : Array.isArray(root.data)
          ? root.data
          : [];

  return source
    .map((entry) => {
      const cart = asRecord(entry);
      const user = asRecord(cart.user ?? cart.User);
      return {
        id: String(cart.id ?? cart.Id ?? ""),
        username: String(
          cart.username ??
            cart.userName ??
            user.userName ??
            user.UserName ??
            "Unknown",
        ),
        orderDate: String(cart.orderDate ?? cart.OrderDate ?? ""),
      };
    })
    .filter((cart) => cart.id);
}

function parseArchiveHtml(html: string): ArchivedCart[] {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  return Array.from(documentNode.querySelectorAll<HTMLTableRowElement>("tbody tr"))
    .map((row) => {
      const cells = row.querySelectorAll<HTMLTableCellElement>("td");
      const link = row.querySelector<HTMLAnchorElement>('a[href*="/Cart/Details"], a[href*="/Carts/Details"]');
      const hrefId = link?.getAttribute("href")?.split("/").filter(Boolean).at(-1) ?? "";
      return {
        id: cells[0]?.textContent?.trim() || hrefId,
        username: cells[1]?.textContent?.trim() || "Unknown",
        orderDate: cells[2]?.textContent?.trim() || "",
      };
    })
    .filter((cart) => cart.id);
}

async function loadArchive(): Promise<ArchivedCart[]> {
  const candidates = ["/api/cart/archive", backendEndpoints.cart.archive];
  let lastError = "Cart archive could not be loaded.";

  for (const path of candidates) {
    const response = await fetchBackend(path, {
      headers: { Accept: "application/json, text/html;q=0.8" },
    });

    if (response.status === 401) throw new Error("You must sign in to view the cart archive.");
    if (response.status === 403) throw new Error("Administrator access is required.");

    if (!response.ok) {
      lastError = `Cart archive request failed with status ${response.status}.`;
      continue;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return normalizeArchive(await response.json());
    }

    const html = await response.text();
    const rows = parseArchiveHtml(html);
    if (rows.length || html.includes("merch-table")) return rows;
    lastError = "The server returned a page without cart archive data.";
  }

  throw new Error(lastError);
}

export default function CartArchive() {
  const [carts, setCarts] = useState<ArchivedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCarts(await loadArchive());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cart archive could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">Administration</p>
            <h1 className="mt-1 text-3xl font-semibold">Cart Archive</h1>
          </div>
          <button type="button" onClick={() => void reload()} disabled={loading} className="rounded-md border border-[#46515e] bg-[#1a1f24] px-4 py-2 text-sm font-semibold hover:bg-[#242b33] disabled:opacity-50">
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? <div className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200" role="alert">{error}</div> : null}

        <div className="overflow-hidden rounded-xl border border-[#313a45] bg-[#1a1f24] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-[#313a45] bg-[#151a1f] text-sm uppercase tracking-wide text-[#a8b0bd]">
                <tr>
                  <th className="px-5 py-4">Cart Id</th>
                  <th className="px-5 py-4">Username</th>
                  <th className="px-5 py-4">Date Of Order</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#313a45]">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-[#20262d]">
                    <td className="px-5 py-4 font-mono text-sm text-[#cfd6df]">{cart.id}</td>
                    <td className="px-5 py-4 font-semibold text-[#ff5fb3]">{cart.username}</td>
                    <td className="px-5 py-4 text-[#cfd6df]">{formatDate(cart.orderDate)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/Cart/Details/${encodeURIComponent(cart.id)}`} className="inline-flex items-center gap-2 rounded-md border border-blue-400/60 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-950/40">
                        <span aria-hidden="true">◉</span> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !error && carts.length === 0 ? <div className="p-8 text-center text-[#a8b0bd]">No archived carts were found.</div> : null}
          {loading ? <div className="p-8 text-center text-[#a8b0bd]">Loading archived carts...</div> : null}
        </div>
      </section>
    </main>
  );
}

function formatDate(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
