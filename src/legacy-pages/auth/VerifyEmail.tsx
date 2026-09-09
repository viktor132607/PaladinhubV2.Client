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
      if (!response.ok) throw new Error((await readResponseMessage(response)) || `Verification request failed with status ${response.status}.`);
      setMessage((await readResponseMessage(response)) || "Verification request accepted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Email verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-container">
      <div className="account-box">
        <h2 className="text-center mb-4">Verify Email</h2>
        <form onSubmit={(event) => void submit(event)}>
          {error ? <div className="text-danger">{error}</div> : null}
          {message ? <div>{message}</div> : null}
          <div className="mb-3">
            <label htmlFor="Email" className="form-label">Email</label>
            <input id="Email" name="Email" type="email" className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} />
          </div>
          <input type="submit" value="Verify" className="btn btn-success w-100 p-2" disabled={submitting} />
          <div className="text-center mt-2">
            <Link to="/" className="text-decoration-none mt-3">Back</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
