"use client";
import { useCallback, useEffect, useState } from "react";
import AuthenticatorQr from "@/components/account/AuthenticatorQr";
import AccountLayout from "@/components/account/AccountLayout";
import { useAuth } from "@/auth/AuthContext";
import { Link } from "@/router/nextCompat";
import { accountGet, accountForm } from "@/components/account/accountApi";
import s from "@/components/account/account.module.css";
type Setup = {
  twoFactorEnabled: boolean;
  sharedKey: string | null;
  authenticatorUri: string | null;
};
export default function Enable2FA() {
  const { user } = useAuth();
  const [setup, setSetup] = useState<Setup | null>(null),
    [code, setCode] = useState(""),
    [password, setPassword] = useState(""),
    [codes, setCodes] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(
    async () => setSetup(await accountGet<Setup>("/api/account/Enable2FA")),
    [],
  );
  useEffect(() => {
    if (user) void load().catch((e) => setError(e.message));
  }, [user, load]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountLayout active="Security">
      <h1>Authenticator app</h1>
      {error && (
        <div className={s.error} role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className={s.notice} role="status">
          {notice}
        </div>
      )}
      <article className={s.card}>
        {!setup ? (
          <p>Loading authenticator...</p>
        ) : setup.twoFactorEnabled ? (
          <>
            <h2>Authenticator attached</h2>
            <p>Your account is protected with app-generated codes.</p>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await accountForm("/api/account/Disable2FA", { password });
                  setPassword("");
                  setCodes([]);
                  await load();
                  setNotice(
                    "Authenticator disabled. Any enabled email verification remains active.",
                  );
                });
              }}
            >
              <label>
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button disabled={busy}>Disable authenticator</button>
            </form>
          </>
        ) : (
          <>
            <h2>Connect your authenticator</h2>
            {setup.authenticatorUri && (
              <AuthenticatorQr uri={setup.authenticatorUri} />
            )}
            <p>Scan the QR code, or enter the setup key manually.</p>
            <ol>
              <li>
                Open Google Authenticator or your preferred authenticator app.
              </li>
              <li>
                Choose “Enter a setup key”, use your email as the account name
                and select “Time based”.
              </li>
              <li>Enter this key, then confirm the six-digit code below.</li>
            </ol>
            <p className={s.key}>{setup.sharedKey}</p>
            <div className={s.row}>
              <button
                disabled={busy || !setup.sharedKey}
                onClick={() =>
                  void run(async () => {
                    await navigator.clipboard.writeText(
                      setup.sharedKey!.replaceAll(" ", ""),
                    );
                    setNotice("Setup key copied.");
                  })
                }
              >
                Copy setup key
              </button>
              {setup.authenticatorUri?.startsWith("otpauth://totp/") && (
                <a href={setup.authenticatorUri}>Open authenticator app</a>
              )}
            </div>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const r = await accountForm<{ recoveryCodes: string[] }>(
                    "/api/account/Enable2FA",
                    { code },
                  );
                  setCodes(r.recoveryCodes);
                  setCode("");
                  await load();
                  setNotice(
                    "Authenticator enabled. Save your recovery codes below.",
                  );
                });
              }}
            >
              <label>
                Six-digit code
                <input
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  required
                />
              </label>
              <button className={s.primary} disabled={busy}>
                Verify and enable
              </button>
            </form>
          </>
        )}
        {codes.length > 0 && (
          <>
            <h2>Recovery codes</h2>
            <p>Save these codes now. Each code can be used once.</p>
            <div className={s.codes}>
              {codes.map((c) => (
                <code key={c}>{c}</code>
              ))}
            </div>
            <button
              onClick={() =>
                void run(async () => {
                  await navigator.clipboard.writeText(codes.join("\n"));
                  setNotice("Recovery codes copied.");
                })
              }
            >
              Copy recovery codes
            </button>
            <button onClick={() => setCodes([])}>Hide codes</button>
          </>
        )}
        <p>
          <Link to="/Account/Security">Back to security</Link>
        </p>
      </article>
    </AccountLayout>
  );
}
