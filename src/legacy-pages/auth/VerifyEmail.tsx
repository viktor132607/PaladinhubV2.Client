"use client";
import { useEffect, useState } from "react";
import { Link } from "@/router/nextCompat";
import { accountPost } from "@/components/account/accountApi";
export default function VerifyEmail() {
  const [params, setParams] = useState({ userId: "", token: "", email: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({
      userId: q.get("userId") || "",
      token: q.get("token") || "",
      email: q.get("newEmail") || "",
    });
  }, []);
  return (
    <main className="ph-auth-page">
      <section className="ph-auth-card">
        <h1>Verify your email</h1>
        {error && (
          <div className="ph-auth-error" role="alert">
            {error}
          </div>
        )}
        {notice ? (
          <p role="status">{notice}</p>
        ) : params.token && params.userId ? (
          <button
            className="ph-auth-submit"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError("");
              void accountPost(
                `/api/account/manage/${params.email ? "confirm-email-change" : "confirm-email"}`,
                params,
              )
                .then((r) => {
                  setNotice(r.message);
                  window.history.replaceState(
                    null,
                    "",
                    window.location.pathname,
                  );
                })
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            Confirm email address
          </button>
        ) : (
          <p>
            Open the verification link from your email, or request a new one in
            account settings.
          </p>
        )}
        <p>
          <Link to="/Account/AccountDetails">Account details</Link>
        </p>
        <p>
          <Link to="/Account/Login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
