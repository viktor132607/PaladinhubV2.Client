"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useLocation, useNavigate } from "@/router/nextCompat";

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Login failed.";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const returnUrl = new URLSearchParams(location.search).get("returnUrl") || "/Account/MyAccount";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await login({ identifier, password, rememberMe });
      if (result.requiresTwoFactor) {
        window.sessionStorage.setItem("paladinhub.auth.rememberMe", String(rememberMe));
        window.sessionStorage.setItem("paladinhub.auth.returnUrl", returnUrl);
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
    navigate("/Account/MyAccount", { replace: true });
    return null;
  }

  return (
    <div className="account-container">
      <div className="account-box">
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          {error ? <div className="text-danger">{error}</div> : null}
          <div className="mb-3">
            <label className="form-label" htmlFor="EmailOrUsername">Email or username</label>
            <input id="EmailOrUsername" className="form-control" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="Password">Password</label>
            <input id="Password" type="password" className="form-control" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="form-check mb-3">
            <input id="RememberMe" type="checkbox" className="form-check-input" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
            <label className="form-check-label" htmlFor="RememberMe">Remember me</label>
          </div>
          <button type="submit" className="btn btn-primary w-100 p-2" disabled={submitting}>Login</button>
          <p className="text-center mt-2">
            Don&apos;t have an account? <Link to="/Account/Register" className="text-decoration-none">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
