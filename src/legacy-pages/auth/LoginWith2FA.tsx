"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";

export default function LoginWith2FA() {
  const { loginWithTwoFactor } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [rememberMachine, setRememberMachine] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const rememberMe =
        window.sessionStorage.getItem("paladinhub.auth.rememberMe") === "true";
      const returnUrl =
        window.sessionStorage.getItem("paladinhub.auth.returnUrl") ||
        "/Account/MyAccount";

      await loginWithTwoFactor({ code, rememberMe, rememberMachine });
      window.sessionStorage.removeItem("paladinhub.auth.rememberMe");
      window.sessionStorage.removeItem("paladinhub.auth.returnUrl");
      navigate(returnUrl, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="ph-auth-page">
      <section className="ph-auth-card">
        <h1>Two-factor authentication</h1>
        <p>Enter the six-digit code from your authenticator app.</p>

        <form onSubmit={handleSubmit} className="ph-auth-form">
          {error ? <div className="ph-auth-error">{error}</div> : null}
          <label>
            <span>Authenticator code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
          <label className="ph-auth-checkbox">
            <input
              type="checkbox"
              checked={rememberMachine}
              onChange={(event) => setRememberMachine(event.target.checked)}
            />
            <span>Remember this device</span>
          </label>
          <button type="submit" disabled={submitting} className="ph-auth-submit">
            {submitting ? "Verifying..." : "Verify"}
          </button>
        </form>

        <p className="ph-auth-switch">
          Lost the authenticator? <Link to="/Account/RecoveryCodeLogin">Use a recovery code</Link>
        </p>
      </section>
    </main>
  );
}
