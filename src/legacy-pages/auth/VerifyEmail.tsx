"use client";

import { FormEvent, useEffect, useState } from "react";
import { backendEndpoints, fetchBackend } from "@/config/api";
import { Link } from "@/router/nextCompat";

type CsrfResponse = { token?: string };

type ApiMessage = { message?: string; title?: string; error?: string };

async function readResponseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null) as ApiMessage | null;
    return payload?.message || payload?.title || payload?.error || "";
  }
  return (await response.text().catch(() => "")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("email");
    if (initial) setEmail(initial);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const csrfResponse = await fetchBackend(backendEndpoints.auth.csrf);
      const csrf = await csrfResponse.json() as CsrfResponse;
      if (!csrf.token) throw new Error("CSRF token is missing.");

      const response = await fetchBackend("/Account/VerifyEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-CSRF-TOKEN": csrf.token,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json, text/html;q=0.9",
        },
        body: new URLSearchParams({ Email: normalizedEmail }),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) throw new Error("The backend VerifyEmail POST action is not implemented yet.");
        throw new Error((await readResponseMessage(response)) || `Verification request failed with status ${response.status}.`);
      }

      const responseMessage = await readResponseMessage(response);
      setMessage(responseMessage || "Verification request accepted. Check your email for the next step.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Email verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#0f1216] px-4 py-10 text-[#e9ecef]">
      <section className="w-full max-w-md rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-2xl">
        <h1 className="text-center text-3xl font-semibold">Verify Email</h1>
        <p className="mt-2 text-center text-sm text-[#a8b0bd]">Enter the email address attached to your PaladinHub account.</p>

        {error ? <div className="mt-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">{error}</div> : null}
        {message ? <div className="mt-5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200" role="status">{message}</div> : null}

        <form onSubmit={(event) => void submit(event)} className="mt-6">
          <label htmlFor="verifyEmail" className="block text-sm font-medium">Email</label>
          <input id="verifyEmail" name="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} className="mt-2 w-full rounded-md border border-[#46515e] bg-[#0f1216] px-3 py-2.5 text-white outline-none focus:border-blue-500" />
          <button type="submit" disabled={submitting} className="mt-5 w-full rounded-md bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Submitting..." : "Verify"}
          </button>
        </form>

        <div className="mt-4 text-center"><Link to="/" className="text-blue-400 hover:underline">Back</Link></div>
      </section>
    </main>
  );
}
