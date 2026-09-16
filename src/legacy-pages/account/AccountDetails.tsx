"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import AccountLayout from "@/components/account/AccountLayout";
import {
  accountGet,
  accountPost,
  type Profile,
} from "@/components/account/accountApi";
import s from "@/components/account/account.module.css";
export default function AccountDetails() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void accountGet<Profile>("/api/account/manage", controller.signal)
      .then((p) => {
        setProfile(p);
        setName(p.fullName);
        setPhone(p.phoneNumber || "");
        setEmail(p.email);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [user]);
  async function save(path: string, body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await accountPost(`/api/account/manage/${path}`, body);
      setNotice(result.message);
      setPassword("");
      if (path === "profile") await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AccountLayout active="Details">
      <h1>Account Details</h1>
      {error && (
        <div role="alert" className={s.error}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className={s.notice}>
          {notice}
        </div>
      )}
      {!profile ? (
        <p>Loading profile...</p>
      ) : (
        <div className={s.grid}>
          <article className={s.card}>
            <h2>Personal information</h2>
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void save("profile", {
                  fullName: name,
                  phoneNumber: phone || null,
                });
              }}
            >
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Username
                <input value={profile.userName} readOnly />
              </label>
              <label>
                Phone number
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={32}
                  autoComplete="tel"
                />
              </label>
              <p className={s.muted}>
                Your phone number is a contact detail. SMS verification is not
                available.
              </p>
              <button className={s.primary} disabled={busy}>
                Save changes
              </button>
            </form>
          </article>
          <article className={s.card}>
            <h2>Email address</h2>
            <p>{profile.email}</p>
            <span
              className={`${s.badge} ${profile.emailConfirmed ? s.good : ""}`}
            >
              {profile.emailConfirmed ? "Verified" : "Not verified"}
            </span>
            {!profile.emailConfirmed && (
              <p>
                <button
                  disabled={busy}
                  onClick={() => void save("send-verification", {})}
                >
                  Send verification email
                </button>
              </p>
            )}
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                void save("email", { email, password });
              }}
            >
              <label>
                New email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Current password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <button disabled={busy}>Send confirmation link</button>
            </form>
          </article>
        </div>
      )}
    </AccountLayout>
  );
}
