"use client";

import { useEffect, useState } from "react";
import { backendEndpoints, fetchBackend } from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type Product = { id: string; name: string; price: number; imageUrl?: string | null };

function pick(source: Record<string, unknown>, camel: string, pascal: string): unknown {
  return source[camel] ?? source[pascal];
}

async function readProduct(response: Response, id: string): Promise<Product> {
  if (!response.ok) throw new Error(`Product request failed with status ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await response.json() as Record<string, unknown>;
    return {
      id: String(pick(body, "id", "Id") ?? id),
      name: String(pick(body, "name", "Name") ?? "Unnamed product"),
      price: Number(pick(body, "price", "Price") ?? 0),
      imageUrl: pick(body, "imageUrl", "ImageUrl") as string | null | undefined,
    };
  }
  const document = new DOMParser().parseFromString(await response.text(), "text/html");
  const name = document.querySelector("h1, h2, .product-title, input[value]")?.textContent?.trim() || document.querySelector<HTMLInputElement>('input[type="text"]')?.value || "Unnamed product";
  const priceText = document.querySelector(".price")?.textContent || document.querySelectorAll<HTMLInputElement>('input[type="text"]')[1]?.value || "0";
  return {
    id,
    name,
    price: Number(priceText.replace(/[^0-9.-]/g, "")) || 0,
    imageUrl: document.querySelector<HTMLImageElement>(".product-image, .product-gallery img, img")?.getAttribute("src"),
  };
}

export default function AddProduct() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const candidates = [`/api/products/${encodeURIComponent(id)}`, backendEndpoints.product.details(id)];
      let lastError: unknown = null;
      for (const path of candidates) {
        try {
          const response = await fetchBackend(path, { headers: { Accept: "application/json, text/html" }, cache: "no-store" });
          const parsed = await readProduct(response, id);
          if (active) setProduct(parsed);
          if (active) setLoading(false);
          return;
        } catch (caught) {
          lastError = caught;
        }
      }
      if (active) {
        setError(lastError instanceof Error ? lastError.message : "Could not load the product.");
        setLoading(false);
      }
    };
    if (id) void load(); else { setError("Product ID is missing."); setLoading(false); }
    return () => { active = false; };
  }, [id]);

  const submit = async () => {
    if (!product) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetchBackend(backendEndpoints.cart.add(product.id), { method: "GET" });
      if (!response.ok) throw new Error("The product could not be added to your cart.");
      navigate("/cart");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be added to your cart.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-center text-3xl font-bold">Add Product to Cart</h1>
        <div className="my-6 h-px bg-amber-400/50" />
        {loading ? <p className="py-12 text-center text-slate-400">Loading product…</p> : error && !product ? <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-red-200">{error}</p> : product ? (
          <>
            <div className="mb-6 flex justify-center"><img src={product.imageUrl || "/images/placeholder.png"} alt={product.name} className="h-32 w-32 rounded-lg border border-slate-600 bg-white/5 object-contain" /></div>
            <label className="mb-4 block text-sm font-medium text-slate-300">Name<input value={product.name} disabled className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300" /></label>
            <label className="block text-sm font-medium text-slate-300">Price<input value={`$${product.price.toFixed(2)}`} disabled className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-300" /></label>
            {error ? <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-red-200">{error}</p> : null}
            <div className="my-6 h-px bg-amber-400/50" />
            <div className="flex justify-center gap-3">
              <button type="button" disabled={submitting} onClick={() => void submit()} className="rounded-lg bg-amber-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50">{submitting ? "Adding…" : "Add to Cart"}</button>
              <Link to="/products" className="rounded-lg border border-slate-600 px-5 py-3 font-semibold">Cancel</Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
