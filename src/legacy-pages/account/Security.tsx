"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link } from "@/router/nextCompat";
import AccountLayout from "@/components/account/AccountLayout";
import SecurityRing from "@/components/account/SecurityRing";
import {
  accountGet,
  accountPost,
  accountForm,
  type Profile,
} from "@/components/account/accountApi";
import s from "@/components/account/account.module.css";
type SecurityState = {
  securityScore: number;
  securityTips: string[];
  recoveryCodesLeft: number;
};
export default function Security() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null),
    [security, setSecurity] = useState<SecurityState | null>(null),
    [password, setPassword] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [codes, setCodes] = useState<string[]>([]);
  const load = useCallback(async () => {
    const [p, q] = await Promise.all([
      accountGet<Profile>("/api/account/manage"),
      accountGet<SecurityState>("/api/account/Security"),
    ]);
    setProfile(p);
    setSecurity(q);
  }, []);
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
      <h1>Security</h1>
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
      {!profile || !security ? (
        <p>Loading security settings...</p>
      ) : (
        <div className={s.stack}>
          <article className={`${s.card} ${s.wide}`}>
            <div className={s.row}>
              <div>
                <h2>Security Checkup</h2>
                <ul>
                  {security.securityTips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <SecurityRing score={security.securityScore} />
            </div>
          </article>
          <article className={s.card}>
            <h2>Password</h2>
            <p className={s.muted}>
              Use a unique password to protect your account.
            </p>
            <Link className={s.textButton} to="/Account/ChangePassword">
              Change password
            </Link>
          </article>
          <article className={s.card}>
            <h2>Verified email</h2>
            <p>{profile.email}</p>
            <p>
              <span
                className={`${s.badge} ${profile.emailConfirmed ? s.good : ""}`}
              >
                {profile.emailConfirmed ? "Verified" : "Not verified"}
              </span>
            </p>
            {!profile.emailConfirmed && (
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const r = await accountPost(
                      "/api/account/manage/send-verification",
                    );
                    setNotice(r.message);
                  })
                }
              >
                Send verification email
              </button>
            )}
          </article>
          <article className={s.card}>
            <h2>Authenticator app</h2>
            <p className={s.muted}>
              Use Google Authenticator, Microsoft Authenticator or another TOTP
              app.
            </p>
            <p>
              <span
                className={`${s.badge} ${profile.authenticatorEnabled ? s.good : ""}`}
              >
                {profile.authenticatorEnabled ? "Attached" : "Not attached"}
              </span>
            </p>
            <Link className={s.textButton} to="/Account/Enable2FA">
              {profile.authenticatorEnabled
                ? "Manage authenticator"
                : "Set up authenticator"}
            </Link>
          </article>
          <article className={s.card}>
            <div className={s.row}>
              <h2>Email two-step verification</h2>
              <button
                className={s.textButton}
                onClick={() => setEditingEmail(!editingEmail)}
                aria-expanded={editingEmail}
              >
                ✎ Update
              </button>
            </div>
            <p className={s.muted}>
              Receive a login code at your verified email address after entering
              your password.
            </p>
            <p
              className={`${s.badge} ${profile.emailTwoFactorEnabled ? s.good : ""}`}
            >
              {profile.emailTwoFactorEnabled ? "Enabled" : "Disabled"}
            </p>
            {editingEmail && (
              <form
                className={s.editForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    const r = await accountPost(
                      "/api/account/manage/email-2fa",
                      {
                        enabled: !profile.emailTwoFactorEnabled,
                        password,
                      },
                    );
                    setPassword("");
                    setCodes(r.recoveryCodes || []);
                    await load();
                    setNotice(r.message);
                  });
                }}
              >
                <p>
                  <span
                    className={`${s.badge} ${profile.emailTwoFactorEnabled ? s.good : ""}`}
                  >
                    {profile.emailTwoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </p>
                <label>
                  Current password
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
                <button
                  disabled={
                    busy ||
                    (!profile.emailConfirmed && !profile.emailTwoFactorEnabled)
                  }
                >
                  {profile.emailTwoFactorEnabled
                    ? "Disable email 2FA"
                    : "Enable email 2FA"}
                </button>
                {!profile.emailConfirmed && <p>Verify your email first.</p>}
              </form>
            )}
          </article>
          <article className={s.card}>
            <h2>Recovery codes</h2>
            <p>{security.recoveryCodesLeft} unused recovery codes remaining.</p>
            <p className={s.muted}>
              Generating new codes replaces your previous codes. Save them
              somewhere safe.
            </p>
            <button
              disabled={busy || !profile.twoFactorEnabled}
              onClick={() =>
                void run(async () => {
                  const r = await accountPost<{ recoveryCodes: string[] }>(
                    "/api/account/GenerateRecoveryCode",
                  );
                  setCodes(r.recoveryCodes);
                  await load();
                })
              }
            >
              Generate new recovery codes
            </button>
            {codes.length > 0 && (
              <>
                <p>These codes are shown only here. Each works once.</p>
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
                  Copy codes
                </button>
                <button onClick={() => setCodes([])}>Hide codes</button>
              </>
            )}
          </article>
          <article className={s.card}>
            <h2>Login sessions</h2>
            <p className={s.muted}>
              Sign out from all devices, including this one.
            </p>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await accountForm("/api/account/LogoutAllDevices", {});
                  await refresh();
                })
              }
            >
              Logout all devices
            </button>
          </article>
        </div>
      )}
    </AccountLayout>
  );
}
