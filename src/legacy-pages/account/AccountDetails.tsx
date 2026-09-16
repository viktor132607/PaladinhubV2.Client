"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import AccountLayout from "@/components/account/AccountLayout";
import {
  accountGet,
  accountPost,
  type Profile,
} from "@/components/account/accountApi";
import AccountPanel from "@/components/account/AccountPanel";
import s from "@/components/account/account.module.css";
export default function AccountDetails() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
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
      if (path === "profile") {
        setProfile((p) =>
          p ? { ...p, fullName: name, phoneNumber: phone || null } : p,
        );
        await refresh();
      }
      setEditing(null);
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
        <div className={s.stack}>
          <AccountPanel
            title="Personal Information"
            action={
              <button
                className={s.textButton}
                onClick={() => setEditing(editing === "name" ? null : "name")}
                aria-expanded={editing === "name"}
              >
                ✎ Update
              </button>
            }
          >
            {editing === "name" ? (
              <form
                className={s.editForm}
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
                    autoComplete="name"
                    required
                  />
                </label>
                <div className={s.inline}>
                  <button className={s.primary} disabled={busy}>
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName(profile.fullName);
                      setEditing(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className={s.info}>
                <dt>Name</dt>
                <dd>{profile.fullName}</dd>
              </dl>
            )}
          </AccountPanel>
          <AccountPanel
            title="Email"
            action={
              <button
                className={s.textButton}
                onClick={() => setEditing(editing === "email" ? null : "email")}
                aria-expanded={editing === "email"}
              >
                ✎ Update
              </button>
            }
          >
            <dl className={s.info}>
              <dt>Email</dt>
              <dd>
                {profile.email}{" "}
                <span
                  className={`${s.badge} ${profile.emailConfirmed ? s.good : ""}`}
                >
                  {profile.emailConfirmed ? "Verified" : "Not verified"}
                </span>
              </dd>
            </dl>
            {!profile.emailConfirmed && (
              <button
                className={s.textButton}
                disabled={busy}
                onClick={() => void save("send-verification", {})}
              >
                Send verification email
              </button>
            )}
            {editing === "email" && (
              <form
                className={s.editForm}
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
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Current password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <div className={s.inline}>
                  <button className={s.primary} disabled={busy}>
                    Send confirmation link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword("");
                      setEditing(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </AccountPanel>
          <AccountPanel
            title="Phone Number"
            description="Keep your contact phone number up to date."
            action={
              <button
                className={s.textButton}
                onClick={() => setEditing(editing === "phone" ? null : "phone")}
                aria-expanded={editing === "phone"}
              >
                ✎ Update
              </button>
            }
          >
            {editing === "phone" ? (
              <form
                className={s.editForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  void save("profile", {
                    fullName: name,
                    phoneNumber: phone || null,
                  });
                }}
              >
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
                <div className={s.inline}>
                  <button className={s.primary} disabled={busy}>
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhone(profile.phoneNumber || "");
                      setEditing(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className={s.info}>
                <dt>Phone number</dt>
                <dd>{profile.phoneNumber || "Not set"}</dd>
              </dl>
            )}
          </AccountPanel>
          <AccountPanel
            title="Username"
            description="Your public identity on PaladinHub."
          >
            <dl className={s.info}>
              <dt>Username</dt>
              <dd>{profile.userName}</dd>
            </dl>
          </AccountPanel>
        </div>
      )}
    </AccountLayout>
  );
}
