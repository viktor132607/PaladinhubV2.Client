"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useLocation, useNavigate } from "@/router/nextCompat";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Login failed.";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const returnUrl =
    new URLSearchParams(location.search).get("returnUrl") || "/Account/MyAccount";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await login({ identifier, password, rememberMe });

      if (result.requiresTwoFactor) {
        window.sessionStorage.setItem(
          "paladinhub.auth.rememberMe",
          String(rememberMe),
        );
        window.sessionStorage.setItem(
          "paladinhub.auth.returnUrl",
          returnUrl,
        );
        navigate("/Account/LoginWith2fa");
        return;
      }

      navigate(returnUrl, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <main className="ph-auth-page">
        <section className="ph-auth-card">
          <h1>Already signed in</h1>
          <Link to="/Account/MyAccount" className="ph-auth-submit">
            Open account
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="ph-auth-page">
      <section className="ph-auth-card">
        <h1>Sign in</h1>
        <p>Use your PaladinHub username or email.</p>

        <form onSubmit={handleSubmit} className="ph-auth-form">
          {error ? <div className="ph-auth-error">{error}</div> : null}

          <label>
            <span>Email or username</span>
            <input
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="ph-auth-checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <button type="submit" disabled={submitting} className="ph-auth-submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="ph-auth-switch">
          No account? <Link to="/Account/Register">Register</Link>
        </p>
      </section>
    </main>
  );
}
