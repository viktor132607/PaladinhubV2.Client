"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";

export default function RecoveryCodeLogin() {
  const { loginWithRecoveryCode } = useAuth();
  const navigate = useNavigate();
  const [recoveryCode, setRecoveryCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const returnUrl =
        window.sessionStorage.getItem("paladinhub.auth.returnUrl") ||
        "/Account/MyAccount";
      await loginWithRecoveryCode(recoveryCode);
      window.sessionStorage.removeItem("paladinhub.auth.rememberMe");
      window.sessionStorage.removeItem("paladinhub.auth.returnUrl");
      navigate(returnUrl, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Invalid recovery code.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="ph-auth-page">
      <section className="ph-auth-card">
        <h1>Recovery-code login</h1>
        <p>Enter one unused recovery code.</p>

        <form onSubmit={handleSubmit} className="ph-auth-form">
          {error ? <div className="ph-auth-error">{error}</div> : null}
          <label>
            <span>Recovery code</span>
            <input
              autoComplete="one-time-code"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={submitting} className="ph-auth-submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="ph-auth-switch">
          <Link to="/Account/Login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
