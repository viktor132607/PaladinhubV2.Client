"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";
import { backendEndpoints, fetchBackend } from "@/config/api";
import PasswordField from "./PasswordField";
import styles from "./authFields.module.css";

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Registration failed.";

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
  const [availability, setAvailability] = useState<{
    username: string; state: "checking" | "available" | "taken" | "unavailable";
  } | null>(null);

  useEffect(() => {
    const candidate = username.trim();
    if (!candidate || candidate.length > 100) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAvailability({ username: candidate, state: "checking" });
      try {
        const response = await fetchBackend(backendEndpoints.auth.usernameAvailability(candidate), {
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Availability check failed.");
        const result: { available: boolean } = await response.json();
        if (!controller.signal.aborted)
          setAvailability({ username: candidate, state: result.available ? "available" : "taken" });
      } catch {
        if (!controller.signal.aborted)
          setAvailability({ username: candidate, state: "unavailable" });
      }
    }, 450);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [username]);

  const usernameStatus = availability?.username === username.trim() ? availability.state : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (usernameStatus === "taken") {
      setError("Username is already taken.");
      return;
    }
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
    navigate("/Account/MyAccount", { replace: true });
    return null;
  }

  return (
    <div className="account-container">
      <div className="account-box">
        <h2 className="text-center mb-4">Register</h2>
        <form onSubmit={handleSubmit}>
          {error ? <div className="text-danger">{error}</div> : null}
          <div className="mb-3">
            <label className="form-label" htmlFor="Name">Name</label>
            <input id="Name" className="form-control" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="Username">Username</label>
            <input id="Username" className="form-control" autoComplete="username"
              value={username} onChange={(event) => setUsername(event.target.value)}
              aria-invalid={usernameStatus === "taken"} aria-describedby={usernameStatus ? "username-status" : undefined}
              required />
            {usernameStatus && <p id="username-status" role="status" aria-live="polite"
              className={`${styles.availability} ${styles[usernameStatus === "checking" || usernameStatus === "unavailable" ? "pending" : usernameStatus]}`}>
              {usernameStatus === "checking" ? "Checking username…" :
                usernameStatus === "taken" ? "That username is taken. Try another." :
                  usernameStatus === "available" ? "Username is available." :
                    "Could not check now; availability will be verified on registration."}
            </p>}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="Email">Email</label>
            <input id="Email" type="email" className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="Password">Password</label>
            <PasswordField id="Password" autoComplete="new-password" value={password} onChange={setPassword} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="ConfirmPassword">Confirm password</label>
            <PasswordField id="ConfirmPassword" autoComplete="new-password"
              value={confirmPassword} onChange={setConfirmPassword} required />
          </div>
          <input type="submit" value="Register" className="btn btn-success w-100 p-2"
            disabled={submitting || usernameStatus === "taken"} />
          <p className="text-center mt-2">
            Already have an account? <Link to="/Account/Login" className="text-decoration-none">Login</Link>
          </p>
          <div className="text-center">
            <Link to="/" className="text-decoration-none mt-3">Back</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
