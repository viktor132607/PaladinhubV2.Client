"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { backendUrl } from "@/config/api";
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
type Overview = {
  balance: number;
  currency: string;
  securityScore: number;
  securityTips: string[];
  uploads: string[];
  recentPurchases: {
    id: string;
    createdAtUtc: string;
    purchaseTitle: string;
    amount: number;
    currency: string;
  }[];
};
export default function MyAccount() {
  const { user, refresh, logout } = useAuth();
  const [data, setData] = useState<Overview | null>(null),
    [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [code, setCode] = useState(""),
    [amount, setAmount] = useState("10");
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      accountGet<Overview>("/api/account/MyAccount"),
      accountGet<Profile>("/api/account/manage"),
    ]);
    setData(a);
    setProfile(b);
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    void load().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [user, load]);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
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
  };
  const [paymentSession, setPaymentSession] = useState<string | null>(null);
  useEffect(() => {
    setPaymentSession(
      new URLSearchParams(window.location.search).get("walletSession"),
    );
    if (new URLSearchParams(window.location.search).has("walletCancelled"))
      setNotice("Payment cancelled. Your balance has not changed.");
  }, []);
  const confirm = () =>
    run(async () => {
      const result = await accountPost("/api/account/wallet/confirm", {
        sessionId: paymentSession,
      });
      await load();
      setNotice(result.message);
      setPaymentSession(null);
      window.history.replaceState(null, "", window.location.pathname);
    });
  useEffect(() => {
    if (!user?.id || !paymentSession) return;
    let active = true;
    setBusy(true);
    void accountPost("/api/account/wallet/confirm", {
      sessionId: paymentSession,
    })
      .then(async (result) => {
        await load();
        if (!active) return;
        setNotice(result.message);
        setPaymentSession(null);
        window.history.replaceState(null, "", window.location.pathname);
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "Payment confirmation failed.",
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, paymentSession, load]);
  const money = (n: number, currency = "USD") =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  const upload = (file: File) =>
    run(async () => {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Maximum upload size is 5 MB.");
      const form = new FormData();
      form.append("file", file);
      const result = await accountForm("/api/account/UploadAvatar", form);
      if (result.path)
        await accountForm("/api/account/SetUploadedAvatar", {
          path: result.path,
        });
      await Promise.all([load(), refresh()]);
      setNotice("Avatar uploaded.");
    });
  return (
    <AccountLayout active="Overview">
      <h1>Account Overview</h1>
      {error && (
        <div className={s.error} role="alert">
          {error} <button onClick={() => void run(load)}>Retry</button>
        </div>
      )}
      {notice && (
        <div className={s.notice} role="status">
          {notice}
        </div>
      )}
      {paymentSession && (
        <div className={s.card}>
          <p>Complete your balance update after payment.</p>
          <button disabled={busy} onClick={() => void confirm()}>
            Check payment and update balance
          </button>
        </div>
      )}
      {!data || !profile ? (
        <p role="status">Loading account overview...</p>
      ) : (
        <div className={s.grid}>
          <article className={s.card}>
            <h2>Redeem a code</h2>
            <form
              className={s.inline}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void run(async () => {
                  const r = await accountForm("/api/account/RedeemCode", {
                    code,
                  });
                  await load();
                  setCode("");
                  setNotice(r.message);
                });
              }}
            >
              <label>
                <span className={s.muted}>Gift or promotional code</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                  maxLength={128}
                />
              </label>
              <button className={s.primary} disabled={busy}>
                Redeem
              </button>
            </form>
          </article>
          <article className={s.card}>
            <div className={s.row}>
              <h2>Balance</h2>
              <Link to="/Account/PaymentMethods">Payment methods</Link>
            </div>
            <div className={s.balance}>
              {money(data.balance, data.currency)}
            </div>
            <form
              className={s.inline}
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const r = await accountPost<{ url: string }>(
                    "/api/account/wallet/checkout",
                    { amount: Number(amount) },
                  );
                  const url = new URL(r.url);
                  if (
                    url.protocol !== "https:" ||
                    url.hostname !== "checkout.stripe.com"
                  )
                    throw new Error("Invalid payment destination.");
                  window.location.assign(url.href);
                });
              }}
            >
              <label>
                <span>Amount (USD)</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
              <button className={s.primary} disabled={busy}>
                Add balance
              </button>
            </form>
          </article>
          <article className={s.card}>
            <h2>Your Information</h2>
            <dl className={s.info}>
              <dt>Name</dt>
              <dd>{profile.fullName}</dd>
              <dt>Username</dt>
              <dd>{profile.userName}</dd>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
              <dt>Phone</dt>
              <dd>{profile.phoneNumber || "Not set"}</dd>
            </dl>
            <Link to="/Account/AccountDetails">Edit account details</Link>
          </article>
          <article className={s.card}>
            <h2>Security Checkup</h2>
            <div className={s.row}>
              <div className={s.badges}>
                <span
                  className={`${s.badge} ${profile.emailConfirmed ? s.good : ""}`}
                >
                  {profile.emailConfirmed
                    ? "Email verified"
                    : "Email not verified"}
                </span>
                <span
                  className={`${s.badge} ${profile.authenticatorEnabled ? s.good : ""}`}
                >
                  {profile.authenticatorEnabled
                    ? "Authenticator attached"
                    : "Authenticator not attached"}
                </span>
                <span
                  className={`${s.badge} ${profile.emailTwoFactorEnabled ? s.good : ""}`}
                >
                  {profile.emailTwoFactorEnabled
                    ? "Email 2FA enabled"
                    : "Email 2FA disabled"}
                </span>
              </div>
              <SecurityRing score={data.securityScore} />
            </div>
            <Link to="/Account/Security">Manage security</Link>
            <ul>
              {data.securityTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </article>
          <article className={s.card}>
            <h2>Your avatar</h2>
            <div
              className={s.upload}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy && e.dataTransfer.files[0])
                  void upload(e.dataTransfer.files[0]);
              }}
            >
              <p>Drag & drop an image here</p>
              <label>
                Choose an image (PNG, JPG, WEBP; up to 5 MB)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    if (e.target.files?.[0]) void upload(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {data.uploads.length > 0 && (
              <>
                <h2>Your uploads</h2>
                <div className={s.avatars}>
                  {data.uploads.map((path) => (
                    <div key={path}>
                      <button
                        aria-label="Use uploaded avatar"
                        aria-pressed={profile.avatarPath === path}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await accountForm(
                              "/api/account/SetUploadedAvatar",
                              { path },
                            );
                            await Promise.all([load(), refresh()]);
                          })
                        }
                      >
                        <img src={backendUrl(path)} alt="Uploaded avatar" />
                      </button>
                      <button
                        aria-label="Delete uploaded avatar"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await accountForm("/api/account/DeleteUpload", {
                              path,
                            });
                            await Promise.all([load(), refresh()]);
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h2>Choose a default avatar</h2>
            <div className={s.avatars}>
              {Array.from(
                { length: 39 },
                (_, i) => `default${String(i + 1).padStart(2, "0")}.png`,
              ).map((file) => (
                <button
                  key={file}
                  aria-label={`Choose avatar ${file}`}
                  aria-pressed={
                    profile.avatarPath === `/images/avatars/${file}`
                  }
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await accountForm("/api/account/SetDefaultAvatar", {
                        file,
                      });
                      await Promise.all([load(), refresh()]);
                    })
                  }
                >
                  <img src={`/images/avatars/${file}`} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </article>
          <article className={s.card}>
            <h2>Actions</h2>
            <div className={s.stack}>
              <Link className={s.button} to="/Account/ChangePassword">
                Change password
              </Link>
              <Link className={s.button} to="/Account/TransactionHistory">
                Transaction history
              </Link>
              <Link className={s.button} to="/Account/Settings">
                Settings
              </Link>
              <button disabled={busy} onClick={() => void run(logout)}>
                Logout
              </button>
            </div>
          </article>
          <article className={`${s.card} ${s.wide}`}>
            <div className={s.row}>
              <h2>Recent activity</h2>
              <Link to="/Account/TransactionHistory">
                View all transactions
              </Link>
            </div>
            {data.recentPurchases.length === 0 ? (
              <p className={s.muted}>No transactions yet.</p>
            ) : (
              <div className={s.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPurchases.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.createdAtUtc).toLocaleDateString()}</td>
                        <td>{t.purchaseTitle}</td>
                        <td>{money(t.amount, t.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      )}
    </AccountLayout>
  );
}
