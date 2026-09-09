"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";

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
            <input id="Username" className="form-control" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="Email">Email</label>
            <input id="Email" type="email" className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="Password">Password</label>
            <input id="Password" type="password" className="form-control" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="ConfirmPassword">Confirm password</label>
            <input id="ConfirmPassword" type="password" className="form-control" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </div>
          <input type="submit" value="Register" className="btn btn-success w-100 p-2" disabled={submitting} />
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
