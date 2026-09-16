"use client";
import { useEffect, useState } from "react";
import { Link } from "@/router/nextCompat";
import { accountPost } from "@/components/account/accountApi";
export default function ResetPassword() {
  const [params, setParams] = useState({ userId: "", token: "" }),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ userId: q.get("userId") || "", token: q.get("token") || "" });
  }, []);
  return (
    <main className="ph-auth-page">
      <section className="ph-auth-card">
        <h1>Choose a new password</h1>
        {error && (
          <div className="ph-auth-error" role="alert">
            {error}
          </div>
        )}
        {notice ? (
          <p role="status">{notice}</p>
        ) : !params.token || !params.userId ? (
          <p>Open the reset link from your email.</p>
        ) : (
          <form
            className="ph-auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
              }
              setBusy(true);
              setError("");
              void accountPost("/api/account/manage/reset-password", {
                ...params,
                password,
                confirmPassword,
              })
                .then((r) => {
                  setNotice(r.message);
                  setPassword("");
                  setConfirmPassword("");
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
            <label>
              New password
              <input
                type="password"
                minLength={8}
                maxLength={40}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                minLength={8}
                maxLength={40}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            <button className="ph-auth-submit" disabled={busy}>
              Reset password
            </button>
          </form>
        )}
        <p>
          <Link to="/Account/Login">Sign in</Link>
        </p>
        <p>
          <Link to="/Account/ForgotPassword">Request a new reset link</Link>
        </p>
      </section>
    </main>
  );
}
