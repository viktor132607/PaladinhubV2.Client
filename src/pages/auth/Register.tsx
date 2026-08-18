"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Registration failed.";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register({ name, username, email, password, confirmPassword });
      navigate("/Account/MyAccount", { replace: true });
    } catch (registrationError) {
      setError(getErrorMessage(registrationError));
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
        <h1>Create account</h1>
        <p>Your account is stored through ASP.NET Core Identity.</p>

        <form onSubmit={handleSubmit} className="ph-auth-form">
          {error ? <div className="ph-auth-error">{error}</div> : null}

          <label>
            <span>Full name</span>
            <input
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              required
            />
          </label>

          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9._-]+"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={40}
              required
            />
            <small>
              At least 8 characters with uppercase, lowercase, number and symbol.
            </small>
          </label>

          <label>
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={submitting} className="ph-auth-submit">
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="ph-auth-switch">
          Already registered? <Link to="/Account/Login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
