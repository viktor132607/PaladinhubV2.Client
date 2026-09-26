"use client";
import { useState } from "react";
import { Link } from "@/router/nextCompat";
import { accountPost } from "@/components/account/accountApi";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
export default function ForgotPassword() {
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  return (
    <AuthShell>
        <h1>Reset your password</h1>
        {error && (
          <div className={authStyles.error} role="alert">
            {error}
          </div>
        )}
        {notice && <p role="status">{notice}</p>}
        <form
          className={authStyles.form}
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            void accountPost("/api/account/manage/forgot-password", { email })
              .then((r) => setNotice(r.message))
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className={authStyles.submit} disabled={busy}>
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p>
          <Link to="/Account/Login">Back to sign in</Link>
        </p>
    </AuthShell>
  );
}
