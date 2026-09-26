"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";
import { accountGet, accountPost } from "@/components/account/accountApi";
import AuthShell, { authStyles } from "@/components/auth/AuthShell";
export default function LoginWith2FA() {
  const { loginWithTwoFactor } = useAuth();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<{
      authenticator: boolean;
      email: boolean;
    } | null>(null),
    [provider, setProvider] = useState<"Authenticator" | "Email">(
      "Authenticator",
    ),
    [code, setCode] = useState(""),
    [rememberMachine, setRememberMachine] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    void accountGet<{ authenticator: boolean; email: boolean }>(
      "/api/account/manage/2fa-methods",
      abort.signal,
    )
      .then((m) => {
        setMethods(m);
        setProvider(m.authenticator ? "Authenticator" : "Email");
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginWithTwoFactor({
        code,
        provider,
        rememberMachine,
        rememberMe:
          sessionStorage.getItem("paladinhub.auth.rememberMe") === "true",
      });
      const target =
        sessionStorage.getItem("paladinhub.auth.returnUrl") ||
        "/Account/MyAccount";
      sessionStorage.removeItem("paladinhub.auth.returnUrl");
      sessionStorage.removeItem("paladinhub.auth.rememberMe");
      navigate(
        target.startsWith("/") &&
          !target.startsWith("//") &&
          !target.includes("\\")
          ? target
          : "/Account/MyAccount",
        { replace: true },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    setBusy(true);
    setError("");
    try {
      const r = await accountPost("/api/account/manage/send-login-code");
      setNotice(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code could not be sent.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell>
        <h1>Two-factor authentication</h1>
        {error && (
          <div className={authStyles.error} role="alert">
            {error}
          </div>
        )}
        {notice && <p role="status">{notice}</p>}
        {methods && (
          <form className={authStyles.form} onSubmit={submit}>
            {methods.authenticator && methods.email && (
              <label>
                Verification method
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as "Authenticator" | "Email");
                    setCode("");
                    setNotice("");
                  }}
                >
                  <option value="Authenticator">Authenticator app</option>
                  <option value="Email">Email code</option>
                </select>
              </label>
            )}
            <p>
              {provider === "Email"
                ? "Request a code at your verified email address."
                : "Enter the six-digit code from your authenticator app."}
            </p>
            {provider === "Email" && (
              <button type="button" disabled={busy} onClick={() => void send()}>
                Send email code
              </button>
            )}
            <label>
              {provider === "Email" ? "Email code" : "Authenticator code"}
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </label>
            <label className={authStyles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMachine}
                onChange={(e) => setRememberMachine(e.target.checked)}
              />
              <span>Remember this device</span>
            </label>
            <button className={authStyles.submit} disabled={busy}>
              {busy ? "Verifying..." : "Verify"}
            </button>
          </form>
        )}
        <p className={authStyles.switch}>
          <Link to="/Account/RecoveryCodeLogin">Use a recovery code</Link>
        </p>
        <p className={authStyles.switch}>
          <Link to="/Account/Login">Sign in again</Link>
        </p>
    </AuthShell>
  );
}
