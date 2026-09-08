"use client";

import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link } from "@/router/nextCompat";

const CHANGE_PASSWORD_ENDPOINT =
  "/api/auth/change-password";

type ChangePasswordResponse = {
  message?: string;
};

type AccountSection =
  | "overview"
  | "details"
  | "security"
  | "privacy"
  | "connections"
  | "payments"
  | "transactions";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  autoComplete:
    | "current-password"
    | "new-password";
  disabled: boolean;
  onChange: (value: string) => void;
};

export default function ChangePassword() {
  const [
    oldPassword,
    setOldPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (!oldPassword) {
      setError(
        "Current password is required.",
      );
      return;
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 40
    ) {
      setError(
        "The new password must be between 8 and 40 characters.",
      );
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError(
        "The new password must contain an uppercase letter.",
      );
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError(
        "The new password must contain a lowercase letter.",
      );
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError(
        "The new password must contain a number.",
      );
      return;
    }

    if (
      !/[^a-zA-Z0-9]/.test(
        newPassword,
      )
    ) {
      setError(
        "The new password must contain a non-alphanumeric character.",
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetchBackend(
          CHANGE_PASSWORD_ENDPOINT,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              oldPassword,
              newPassword,
              confirmNewPassword,
            }),
          },
        );

      const result =
        await readApiJson<ChangePasswordResponse>(
          response,
        );

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setSuccess(
        result?.message ||
          "Your password has been updated.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The password could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountPage
      active="security"
      title="Change Password"
    >
      <section className="max-w-2xl rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
        <p className="mb-6 text-sm text-[#a8b0bd]">
          Use a unique password that you
          do not use on another website.
        </p>

        <div
          aria-live="polite"
          aria-atomic="true"
        >
          {error ? (
            <Message tone="error">
              {error}
            </Message>
          ) : null}

          {success ? (
            <Message tone="success">
              {success}
            </Message>
          ) : null}
        </div>

        <form
          onSubmit={submit}
          className="space-y-5"
          noValidate
        >
          <PasswordField
            id="currentPassword"
            label="Current Password"
            value={oldPassword}
            onChange={setOldPassword}
            autoComplete="current-password"
            disabled={saving}
          />

          <PasswordField
            id="newPassword"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            disabled={saving}
          />

          <p className="-mt-3 text-xs text-[#a8b0bd]">
            Use 8–40 characters,
            including uppercase,
            lowercase, a number and a
            non-alphanumeric character.
          </p>

          <PasswordField
            id="confirmNewPassword"
            label="Confirm New Password"
            value={confirmNewPassword}
            onChange={
              setConfirmNewPassword
            }
            autoComplete="new-password"
            disabled={saving}
          />

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-amber-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Updating..."
                : "Update Password"}
            </button>

            <Link
              to="/Account/Security"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </AccountPage>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
}: PasswordFieldProps) {
  return (
    <label
      htmlFor={id}
      className="block"
    >
      <span className="mb-2 block text-sm font-medium">
        {label}
      </span>

      <input
        id={id}
        name={id}
        type="password"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        autoComplete={autoComplete}
        minLength={8}
        maxLength={40}
        required
        disabled={disabled}
        className="w-full rounded-md border border-[#46515e] bg-[#0f1216] px-3 py-2.5 text-[#e9ecef] outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function Message({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const classes =
    tone === "error"
      ? "border-red-500/50 bg-red-950/40 text-red-200"
      : "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";

  return (
    <div
      className={`mb-5 rounded-lg border px-4 py-3 text-sm ${classes}`}
      role={
        tone === "error"
          ? "alert"
          : "status"
      }
    >
      {children}
    </div>
  );
}

function AccountPage({
  active,
  title,
  children,
}: {
  active: AccountSection;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-semibold">
          {title}
        </h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AccountNavigation
            active={active}
          />

          <div className="min-w-0 flex-1">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountNavigation({
  active,
}: {
  active: AccountSection;
}) {
  const links: ReadonlyArray<
    readonly [
      AccountSection,
      string,
      string,
    ]
  > = [
    [
      "overview",
      "/Account/MyAccount",
      "Account Overview",
    ],
    [
      "details",
      "/Account/AccountDetails",
      "Account Details",
    ],
    [
      "security",
      "/Account/Security",
      "Security",
    ],
    [
      "privacy",
      "/Account/Privacy",
      "Privacy & Communication",
    ],
    [
      "connections",
      "/Account/Connections",
      "Connections",
    ],
    [
      "payments",
      "/Account/PaymentMethods",
      "Payment Methods",
    ],
    [
      "transactions",
      "/Account/TransactionHistory",
      "Transaction History",
    ],
  ];

  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <nav
        className="flex flex-col gap-1 rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl"
        aria-label="Account navigation"
      >
        {links.map(
          ([key, to, label]) => (
            <Link
              key={key}
              to={to}
              aria-current={
                active === key
                  ? "page"
                  : undefined
              }
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-[#20262d] ${
                active === key
                  ? "bg-[#20262d] text-white"
                  : ""
              }`}
            >
              {label}
            </Link>
          ),
        )}
      </nav>
    </aside>
  );
}