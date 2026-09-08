"use client";

import { useEffect, useState } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link } from "@/router/nextCompat";

type SuccessResponse = {
  orderId?: string;
  status?: string;
  message?: string;
};

function getOrderId(): string {
  return new URLSearchParams(window.location.search).get("orderId")?.trim() ?? "";
}

export default function Success() {
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("Thank you! Your payment was successful.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const suppliedOrderId = getOrderId();
      setOrderId(suppliedOrderId);

      try {
        const query = suppliedOrderId
          ? `?orderId=${encodeURIComponent(suppliedOrderId)}`
          : "";

        const response = await fetchBackend(
          `${backendEndpoints.checkout.success}${query}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await readApiJson<SuccessResponse>(response);

        if (controller.signal.aborted) {
          return;
        }

        if (result?.orderId?.trim()) {
          setOrderId(result.orderId.trim());
        }

        if (result?.message?.trim()) {
          setMessage(result.message.trim());
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "The payment confirmation could not be loaded.",
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
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#0f1216] px-4 py-10 text-[#e9ecef]">
      <section className="w-full max-w-xl rounded-xl border border-emerald-500/35 bg-[#1a1f24] p-8 text-center shadow-2xl">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-950/40 text-3xl text-emerald-300"
          aria-hidden="true"
        >
          ✓
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#ff5fb3]">
          Checkout
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Payment Successful</h1>

        <p className="mx-auto mt-4 max-w-md text-[#c9d1db]">{message}</p>

        {loading ? (
          <p className="mt-4 text-sm text-[#9aa5b1]">
            Loading payment confirmation...
          </p>
        ) : null}

        {error ? (
          <div
            className="mt-4 rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {orderId ? (
          <p className="mt-4 rounded-lg border border-[#313a45] bg-[#0f1216] px-4 py-3">
            <strong>Order #:</strong> {orderId}
          </p>
        ) : null}

        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
}