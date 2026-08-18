"use client";

import { useCallback, useEffect, useState } from "react";
import { backendEndpoints, fetchBackend } from "@/config/api";
import { Link, useParams } from "@/router/nextCompat";

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
};

type CartDetailsData = {
  items: CartItem[];
  totalPrice: number;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function normalizeCart(payload: unknown): CartDetailsData {
  const root = asRecord(payload);
  const source = (root.items ?? root.myProducts ?? root.MyProducts ?? []) as unknown;
  const items = Array.isArray(source)
    ? source
        .map((entry) => {
          const item = asRecord(entry);
          return {
            id: String(item.id ?? item.Id ?? ""),
            name: String(item.name ?? item.Name ?? "Product"),
            quantity: Math.max(0, Number(item.quantity ?? item.Quantity ?? 0) || 0),
            price: Number(item.price ?? item.Price ?? 0) || 0,
            imageUrl: String(item.imageUrl ?? item.ImageUrl ?? ""),
          };
        })
        .filter((item) => item.id || item.name)
    : [];

  const explicitTotal = Number(root.totalPrice ?? root.TotalPrice);
  return {
    items,
    totalPrice: Number.isFinite(explicitTotal)
      ? explicitTotal
      : items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

function parseMoney(value: string): number {
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function parseDetailsHtml(html: string): CartDetailsData {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const items = Array.from(documentNode.querySelectorAll<HTMLTableRowElement>("tbody tr"))
    .map((row, index) => {
      const cells = row.querySelectorAll<HTMLTableCellElement>("td");
      return {
        id: row.dataset.id || String(index),
        name: cells[0]?.textContent?.trim() || "Product",
        quantity: Number(cells[1]?.textContent?.trim()) || 0,
        price: parseMoney(cells[2]?.textContent || "0"),
        imageUrl: row.querySelector<HTMLImageElement>("img")?.getAttribute("src") || "",
      };
    })
    .filter((item) => item.name);

  const totalText = Array.from(documentNode.querySelectorAll<HTMLElement>("h3, h4"))
    .find((element) => element.textContent?.toLowerCase().includes("total"))?.textContent || "0";

  return {
    items,
    totalPrice: parseMoney(totalText) || items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

async function loadDetails(id: string): Promise<CartDetailsData> {
  const candidates = [`/api/cart/archive/${encodeURIComponent(id)}`, backendEndpoints.cart.details(id)];
  let lastError = "Cart details could not be loaded.";

  for (const path of candidates) {
    const response = await fetchBackend(path, {
      headers: { Accept: "application/json, text/html;q=0.8" },
    });

    if (response.status === 401) throw new Error("You must sign in to view this cart.");
    if (response.status === 403) throw new Error("Administrator access is required.");
    if (response.status === 404) throw new Error("The archived cart was not found.");

    if (!response.ok) {
      lastError = `Cart details request failed with status ${response.status}.`;
      continue;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return normalizeCart(await response.json());

    const html = await response.text();
    const parsed = parseDetailsHtml(html);
    if (parsed.items.length || html.toLowerCase().includes("your cart is empty")) return parsed;
    lastError = "The server returned a page without cart details.";
  }

  throw new Error(lastError);
}

export default function CartDetails() {
  const { id = "" } = useParams<{ id: string }>();
  const [cart, setCart] = useState<CartDetailsData>({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!id) {
      setError("Cart id is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      setCart(await loadDetails(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cart details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">Archived order</p>
          <h1 className="mt-2 text-3xl font-semibold">Cart Details</h1>
          {id ? <p className="mt-2 break-all font-mono text-sm text-[#8f99a6]">{id}</p> : null}
        </div>

        {error ? <div className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200" role="alert">{error}</div> : null}

        {!loading && !error && cart.items.length === 0 ? (
          <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-10 text-center shadow-xl">
            <div className="text-5xl" aria-hidden="true">🛒</div>
            <h2 className="mt-4 text-2xl font-semibold text-[#ff5fb3]">This cart is empty.</h2>
          </div>
        ) : null}

        {cart.items.length ? (
          <div className="overflow-hidden rounded-xl border border-[#313a45] bg-[#1a1f24] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] text-left">
                <thead className="border-b border-[#313a45] bg-[#151a1f] text-sm uppercase tracking-wide text-[#a8b0bd]">
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4 text-center">Quantity</th>
                    <th className="px-5 py-4 text-right">Price</th>
                    <th className="px-5 py-4 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#313a45]">
                  {cart.items.map((item, index) => (
                    <tr key={`${item.id}-${index}`} className="hover:bg-[#20262d]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-md border border-[#46515e] object-cover" /> : null}
                          <span className="font-semibold">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">{item.quantity}</td>
                      <td className="px-5 py-4 text-right">{formatMoney(item.price)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-[#ff5fb3]">{formatMoney(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#313a45] bg-[#151a1f] px-5 py-5">
              <Link to="/Cart/Archive" className="rounded-md border border-blue-400/60 px-4 py-2 font-semibold text-blue-200 hover:bg-blue-950/40">← Back</Link>
              <h2 className="text-xl font-semibold">Total Cost: <span className="text-[#ff5fb3]">{formatMoney(cart.totalPrice)}</span></h2>
            </div>
          </div>
        ) : null}

        {loading ? <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-8 text-center text-[#a8b0bd]">Loading cart details...</div> : null}
      </section>
    </main>
  );
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
