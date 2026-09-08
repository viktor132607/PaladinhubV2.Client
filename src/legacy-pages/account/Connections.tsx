"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/router/nextCompat";

type Provider = { key: string; name: string };
type AuthorizedApplication = { id: string; name: string; permissions: string[] };

const providers: Provider[] = [
  { key: "apple", name: "Apple" },
  { key: "facebook", name: "Facebook" },
  { key: "google", name: "Google" },
  { key: "xbox", name: "Xbox Network" },
  { key: "nintendo", name: "Nintendo" },
  { key: "psn", name: "PlayStation™Network" },
  { key: "steam", name: "Steam" },
  { key: "twitch", name: "Twitch" },
  { key: "uplay", name: "Ubisoft" },
];

const initialApps: AuthorizedApplication[] = [
  { id: "raider-io", name: "Raider.IO Raids & Mythic Plus", permissions: ["Your account ID and BattleTag", "Your World of Warcraft profile"] },
  { id: "warcraft-logs", name: "Warcraft Logs", permissions: ["Your account ID and BattleTag", "Your World of Warcraft profile"] },
];

const connectedStorageKey = "paladinhub.account.connections";
const appsStorageKey = "paladinhub.account.authorized-apps";

export default function Connections() {
  const [connected, setConnected] = useState<string[]>([]);
  const [applications, setApplications] = useState<AuthorizedApplication[]>(initialApps);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedConnected = JSON.parse(localStorage.getItem(connectedStorageKey) || "[]") as unknown;
      const savedApps = JSON.parse(localStorage.getItem(appsStorageKey) || "null") as unknown;
      if (Array.isArray(savedConnected)) setConnected(savedConnected.filter((item): item is string => typeof item === "string"));
      if (Array.isArray(savedApps)) setApplications(savedApps.filter(isAuthorizedApplication));
    } catch {
      setConnected([]);
      setApplications(initialApps);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(connectedStorageKey, JSON.stringify(connected));
    localStorage.setItem(appsStorageKey, JSON.stringify(applications));
  }, [applications, connected, ready]);

  const connectedSet = useMemo(() => new Set(connected), [connected]);

  const toggleProvider = (key: string) => {
    setConnected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const removeApplication = (id: string) => {
    if (!window.confirm("Remove access for this application?")) return;
    setApplications((current) => current.filter((application) => application.id !== id));
  };

  return (
    <AccountPage active="connections" title="Connections">
      <section className="space-y-4">
        <article className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
          <h2 className="mb-3 text-lg font-semibold">Connected Accounts</h2>
          <div className="divide-y divide-[#26303a]">
            {providers.map((provider) => {
              const isConnected = connectedSet.has(provider.key);
              return (
                <div key={provider.key} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold">{provider.name}</span>
                    <StatusBadge tone={isConnected ? "ok" : "warn"}>{isConnected ? "Connected" : "Not Connected"}</StatusBadge>
                  </div>
                  <button type="button" onClick={() => toggleProvider(provider.key)} className={`text-left text-sm hover:underline sm:text-right ${isConnected ? "text-red-300" : "text-blue-400"}`}>
                    {isConnected ? "× Disconnect" : "+ Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
          <h2 className="mb-3 text-lg font-semibold">Authorized Applications</h2>
          <p className="mb-3 text-sm text-[#a8b0bd]">When you log in to certain applications or third-party sites with your account, you can choose what profile and gameplay data to share. You can revoke access at any time.</p>

          {applications.length === 0 ? <p className="border-t border-[#26303a] py-5 text-sm text-[#a8b0bd]">No applications currently have access to your account.</p> : (
            <div className="divide-y divide-[#26303a]">
              {applications.map((application) => (
                <div key={application.id} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-start">
                  <div className="max-w-xl">
                    <h3 className="font-semibold">{application.name}</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#d4dae2]">{application.permissions.map((permission) => <li key={permission}>{permission}</li>)}</ul>
                  </div>
                  <button type="button" onClick={() => removeApplication(application.id)} className="text-left text-sm text-red-300 hover:underline sm:text-right">× Remove</button>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </AccountPage>
  );
}

function isAuthorizedApplication(value: unknown): value is AuthorizedApplication {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthorizedApplication>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && Array.isArray(candidate.permissions) && candidate.permissions.every((permission) => typeof permission === "string");
}

function StatusBadge({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) {
  const classes = tone === "ok" ? "border-emerald-600 bg-emerald-950 text-emerald-200" : "border-amber-600 bg-amber-950 text-amber-200";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}>{children}</span>;
}

function AccountPage({ active, title, children }: { active: string; title: string; children: React.ReactNode }) {
  return <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]"><div className="mx-auto max-w-6xl"><h1 className="mb-6 text-3xl font-semibold">{title}</h1><div className="flex flex-col gap-6 lg:flex-row"><AccountNavigation active={active} /><div className="min-w-0 flex-1">{children}</div></div></div></main>;
}

function AccountNavigation({ active }: { active: string }) {
  const links = [["overview", "/Account/MyAccount", "Account Overview"], ["details", "/Account/AccountDetails", "Account Details"], ["security", "/Account/Security", "Security"], ["privacy", "/Account/Privacy", "Privacy & Communication"], ["connections", "/Account/Connections", "Connections"], ["payments", "/Account/PaymentMethods", "Payment Methods"], ["transactions", "/Account/TransactionHistory", "Transaction History"]] as const;
  return <aside className="w-full shrink-0 lg:w-[260px]"><nav className="flex flex-col gap-1 rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl" aria-label="Account navigation">{links.map(([key, to, label]) => <Link key={key} to={to} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-[#20262d] ${active === key ? "bg-[#20262d]" : ""}`}>{label}</Link>)}</nav></aside>;
}
