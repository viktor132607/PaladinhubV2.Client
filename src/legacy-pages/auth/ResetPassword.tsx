"use client";
import { useEffect, useState } from "react";
import { Link } from "@/router/nextCompat";
import { accountPost } from "@/components/account/accountApi";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
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
    <AuthShell>
        <h1>Choose a new password</h1>
        {error && (
          <div className={authStyles.error} role="alert">
            {error}
          </div>
        )}
        {notice ? (
          <p role="status">{notice}</p>
        ) : !params.token || !params.userId ? (
          <p>Open the reset link from your email.</p>
        ) : (
          <form
            className={authStyles.form}
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
            <button className={authStyles.submit} disabled={busy}>
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
    </AuthShell>
  );
}
