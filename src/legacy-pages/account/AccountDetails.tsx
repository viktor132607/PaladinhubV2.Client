"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { backendUrl } from "@/config/api";
import { Link } from "@/router/nextCompat";

type AccountSection =
  | "overview"
  | "details"
  | "security"
  | "privacy"
  | "connections"
  | "payments"
  | "transactions";

type AccountNavigationProps = {
  active: AccountSection;
};

type InfoCardProps = {
  title: string;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
};

type InfoRowProps = {
  label: string;
  value: ReactNode;
};

const accountLinks: ReadonlyArray<{
  key: AccountSection;
  to: string;
  label: string;
}> = [
  {
    key: "overview",
    to: "/Account/MyAccount",
    label: "Account Overview",
  },
  {
    key: "details",
    to: "/Account/AccountDetails",
    label: "Account Details",
  },
  {
    key: "security",
    to: "/Account/Security",
    label: "Security",
  },
  {
    key: "privacy",
    to: "/Account/Privacy",
    label: "Privacy & Communication",
  },
  {
    key: "connections",
    to: "/Account/Connections",
    label: "Connections",
  },
  {
    key: "payments",
    to: "/Account/PaymentMethods",
    label: "Payment Methods",
  },
  {
    key: "transactions",
    to: "/Account/TransactionHistory",
    label: "Transaction History",
  },
];

function resolveAvatarUrl(
  avatarPath: string | null | undefined,
): string {
  const normalized =
    avatarPath?.trim() ?? "";

  if (!normalized) {
    return "/images/avatars/default01.png";
  }

  if (
    /^(https?:)?\/\//i.test(normalized) ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  return backendUrl(normalized);
}

export default function AccountDetails() {
  const {
    user,
    isAuthenticated,
    loading,
    refresh,
  } = useAuth();

  if (loading) {
    return (
      <AccountPageShell>
        <AccountNavigation active="details" />

        <section className="min-w-0 flex-1">
          <h1 className="mb-5 text-3xl font-semibold">
            Account Details
          </h1>

          <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 text-[#a8b0bd]">
            Loading account details...
          </div>
        </section>
      </AccountPageShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AccountPageShell>
        <AccountNavigation active="details" />

        <section className="min-w-0 flex-1">
          <h1 className="mb-5 text-3xl font-semibold">
            Account Details
          </h1>

          <div
            className="rounded-xl border border-amber-500/50 bg-amber-950/40 p-5 text-amber-200"
            role="alert"
          >
            <p>
              Your session has expired. Sign in again to
              view your account.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-md bg-amber-400 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-300"
              >
                Sign in
              </Link>

              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="rounded-md border border-amber-300/50 px-4 py-2 font-semibold hover:bg-amber-900/30"
              >
                Check session again
              </button>
            </div>
          </div>
        </section>
      </AccountPageShell>
    );
  }

  const avatarUrl =
    resolveAvatarUrl(user.avatarPath);

  return (
    <AccountPageShell>
      <AccountNavigation active="details" />

      <section className="min-w-0 flex-1">
        <h1 className="mb-5 text-3xl font-semibold">
          Account Details
        </h1>

        <div className="space-y-4">
          <InfoCard title="Profile">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <img
                src={avatarUrl}
                alt={`${user.fullName || user.username} avatar`}
                className="h-24 w-24 shrink-0 rounded-full border border-[#46515e] bg-[#11151a] object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/images/avatars/default01.png";
                }}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-semibold">
                  {user.fullName || user.username}
                </p>

                <p className="mt-1 truncate text-sm text-[#a8b0bd]">
                  @{user.username}
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Personal Information">
            <InfoRow
              label="Full name"
              value={user.fullName || "Not provided"}
            />

            <InfoRow
              label="Username"
              value={user.username || "Not provided"}
            />

            <InfoRow
              label="Account ID"
              value={
                <code className="break-all rounded bg-[#11151a] px-2 py-1 text-xs text-[#cfd6df]">
                  {user.id}
                </code>
              }
            />
          </InfoCard>

          <InfoCard title="Email">
            <InfoRow
              label="Email address"
              value={user.email || "Not provided"}
            />
          </InfoCard>

          <InfoCard
            title="Security"
            actionHref="/Account/Security"
            actionLabel="Manage security"
          >
            <InfoRow
              label="Password and 2FA"
              value="Manage your password, authenticator and recovery options from the Security page."
            />
          </InfoCard>

          <InfoCard title="Account Roles">
            {user.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-blue-400/40 bg-blue-950/40 px-3 py-1 text-sm text-blue-200"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#a8b0bd]">
                No roles are assigned to this account.
              </p>
            )}
          </InfoCard>
        </div>
      </section>
    </AccountPageShell>
  );
}

function AccountPageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        {children}
      </div>
    </main>
  );
}

function AccountNavigation({
  active,
}: AccountNavigationProps) {
  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <nav
        className="flex flex-col gap-1 rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl"
        aria-label="Account navigation"
      >
        {accountLinks.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            aria-current={
              active === link.key
                ? "page"
                : undefined
            }
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-[#20262d] ${
              active === link.key
                ? "bg-[#20262d] text-white"
                : "text-[#cfd6df]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function InfoCard({
  title,
  children,
  actionHref,
  actionLabel,
}: InfoCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-[#313a45] bg-[#1a1f24] shadow-lg">
      <header className="flex items-center justify-between gap-4 border-b border-[#313a45] px-5 py-4">
        <h2 className="font-semibold">
          {title}
        </h2>

        {actionHref && actionLabel ? (
          <Link
            to={actionHref}
            className="text-sm text-blue-400 hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </header>

      <div className="px-5 py-4">
        {children}
      </div>
    </article>
  );
}

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="grid gap-2 border-b border-[#2a3139] py-3 text-sm last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="text-[#a8b0bd]">
        {label}
      </span>

      <span className="min-w-0 break-words">
        {value}
      </span>
    </div>
  );
}