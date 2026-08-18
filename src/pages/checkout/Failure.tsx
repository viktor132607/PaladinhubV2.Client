"use client";

import { useEffect, useState } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link } from "@/router/nextCompat";

type FailureResponse = {
  status?: string;
  message?: string;
};

const defaultMessage =
  "Something went wrong while processing your card. Please try again or choose another payment method.";

function getSuppliedMessage(): string {
  const params = new URLSearchParams(window.location.search);
  return (params.get("message") || params.get("error") || "").trim();
}

export default function Failure() {
  const [message, setMessage] = useState(defaultMessage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const suppliedMessage = getSuppliedMessage();

      if (suppliedMessage) {
        setMessage(suppliedMessage);
      }

      try {
        const query = suppliedMessage
          ? `?message=${encodeURIComponent(suppliedMessage)}`
          : "";

        const response = await fetchBackend(
          `${backendEndpoints.checkout.failure}${query}`,
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await readApiJson<FailureResponse>(response);

        if (!controller.signal.aborted && result?.message?.trim()) {
          setMessage(result.message.trim());
        }
      } catch {
        // Keep the supplied or default message when the confirmation endpoint is unavailable.
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
      <section className="w-full max-w-xl rounded-xl border border-red-500/35 bg-[#1a1f24] p-8 text-center shadow-2xl">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-400/50 bg-red-950/40 text-3xl text-red-300"
          aria-hidden="true"
        >
          !
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-red-300">
          Checkout
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Payment Failed</h1>

        <p className="mx-auto mt-4 max-w-md leading-7 text-[#b8c0ca]">
          {loading ? "Loading payment status..." : message}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/Checkout/Review"
            className="rounded-md border border-[#46515e] px-5 py-2.5 font-semibold text-[#e9ecef] hover:bg-[#252b33]"
          >
            Back to Overview
          </Link>

          <Link
            to="/Checkout/Card"
            className="rounded-md bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500"
          >
            Try Card Again
          </Link>
        </div>
      </section>
    </main>
  );
}