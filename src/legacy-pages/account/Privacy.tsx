"use client";

import { useEffect, useState } from "react";
import { Link } from "@/router/nextCompat";

type PreferenceValue = boolean | string;
type Preferences = Record<string, PreferenceValue>;
type Setting = { key: string; name: string; description: string; type: "toggle" | "select"; options?: string[] };
type Section = { title: string; settings: Setting[] };

const storageKey = "paladinhub.account.privacy";
const defaults: Preferences = {
  textChat: true,
  privateChatLevel: "Everybody",
  voiceChat: "Listening & Speaking",
  friends: true,
  friendSuggestions: true,
  realId: false,
  groups: true,
  shareGameData: true,
  recommendations: true,
  targetedAds: true,
  language: "English (US)",
  smsAlerts: true,
  pushNotifications: true,
  newsOffers: "Some",
  profileVisibility: "Public",
};

const sections: Section[] = [
  { title: "Social Settings", settings: [
    { key: "textChat", name: "Text Chat", description: "Control who can message you in chat across the website, desktop, and mobile apps.", type: "toggle" },
    { key: "privateChatLevel", name: "Private Chat Level", description: "Who can start private chat conversations with you.", type: "select", options: ["Everybody", "Friends", "Nobody"] },
    { key: "voiceChat", name: "Voice Chat", description: "Manage who can hear you and speak with you in voice chat on desktop and mobile apps.", type: "select", options: ["Listening & Speaking", "Listening Only", "Disabled"] },
    { key: "friends", name: "Friends", description: "Accept and manage friend requests to grow your friends list.", type: "toggle" },
    { key: "friendSuggestions", name: "Friends of Friends Suggestions", description: "Allow the service to suggest friends-of-friends.", type: "toggle" },
    { key: "realId", name: "Real ID", description: "Show your real name to Real ID friends across the platform.", type: "toggle" },
    { key: "groups", name: "Battle.net Groups", description: "Join and participate in groups with friends and communities.", type: "toggle" },
  ] },
  { title: "Game Data and Profile Privacy", settings: [
    { key: "shareGameData", name: "Share Game Data", description: "Allow sharing of your game data with external developers for features like leaderboards and stat trackers.", type: "toggle" },
  ] },
  { title: "Personalized Recommendations", settings: [
    { key: "recommendations", name: "Battle.net & In-Game Recommendations", description: "Use play patterns and interactions to personalize recommendations across games and services.", type: "toggle" },
    { key: "targetedAds", name: "Targeted Ads", description: "Allow ads to be tailored based on data across Blizzard titles.", type: "toggle" },
  ] },
  { title: "Communication Preferences", settings: [
    { key: "language", name: "Language", description: "Communications will be sent in this language.", type: "select", options: ["English (US)", "English (UK)", "Bulgarian", "German", "French"] },
    { key: "smsAlerts", name: "SMS Account Alerts", description: "Security notifications like password changes and suspicious activity.", type: "toggle" },
    { key: "pushNotifications", name: "Mobile Push Notifications", description: "Push notifications for friend requests, chat, and group invitations.", type: "toggle" },
    { key: "newsOffers", name: "News, Offers, & More", description: "Email updates about new features, promotions and events.", type: "select", options: ["All", "Some", "None"] },
  ] },
  { title: "Profile Settings", settings: [
    { key: "profileVisibility", name: "Profile Visibility", description: "Allow others to view your public profile on web, desktop, and mobile.", type: "select", options: ["Public", "Friends", "Private"] },
  ] },
];

export default function Privacy() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "null") as unknown;
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const merged = { ...defaults, ...(stored as Preferences) };
        setPreferences(merged);
        setDraft(merged);
      }
    } catch {
      setPreferences(defaults);
      setDraft(defaults);
    }
  }, []);

  const beginEdit = (title: string) => {
    setDraft(preferences);
    setEditingSection(title);
    setSaved(false);
  };

  const saveSection = () => {
    setPreferences(draft);
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setEditingSection(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const cancelEdit = () => {
    setDraft(preferences);
    setEditingSection(null);
  };

  const update = (key: string, value: PreferenceValue) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <AccountPage active="privacy" title="Privacy & Communication">
      {saved ? <div className="mb-5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200" role="status">Privacy preferences saved.</div> : null}
      <div className="space-y-4">
        {sections.map((section) => {
          const editing = editingSection === section.title;
          return (
            <article key={section.title} className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
              <header className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {!editing ? <button type="button" onClick={() => beginEdit(section.title)} className="text-sm text-blue-400 hover:underline">Update</button> : <div className="flex gap-3 text-sm"><button type="button" onClick={saveSection} className="text-emerald-300 hover:underline">Save</button><button type="button" onClick={cancelEdit} className="text-[#a8b0bd] hover:underline">Cancel</button></div>}
              </header>

              <div className="divide-y divide-[#26303a]">
                {section.settings.map((setting) => {
                  const value = editing ? draft[setting.key] : preferences[setting.key];
                  return (
                    <div key={setting.key} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-start">
                      <div className="max-w-3xl"><h3 className="font-semibold">{setting.name}</h3><p className="mt-1 text-sm text-[#a8b0bd]">{setting.description}</p></div>
                      <div className="shrink-0">
                        {editing ? <PreferenceEditor setting={setting} value={value} onChange={(next) => update(setting.key, next)} /> : <PreferenceBadge value={value} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </AccountPage>
  );
}

function PreferenceEditor({ setting, value, onChange }: { setting: Setting; value: PreferenceValue; onChange: (value: PreferenceValue) => void }) {
  if (setting.type === "toggle") {
    const checked = Boolean(value);
    return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-7 w-12 rounded-full border transition ${checked ? "border-emerald-500 bg-emerald-600" : "border-slate-500 bg-slate-700"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} /></button>;
  }
  return <select value={String(value)} onChange={(event) => onChange(event.target.value)} className="min-w-40 rounded-md border border-[#46515e] bg-[#0f1216] px-3 py-2 text-sm outline-none focus:border-blue-500">{setting.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function PreferenceBadge({ value }: { value: PreferenceValue }) {
  if (typeof value === "boolean") {
    const classes = value ? "border-emerald-600 bg-emerald-950 text-emerald-200" : "border-amber-600 bg-amber-950 text-amber-200";
    return <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}>{value ? "Enabled" : "Off"}</span>;
  }
  return <span className="inline-block rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">{value}</span>;
}

function AccountPage({ active, title, children }: { active: string; title: string; children: React.ReactNode }) { return <main className="min-h-[calc(100vh-56px)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]"><div className="mx-auto max-w-6xl"><h1 className="mb-6 text-3xl font-semibold">{title}</h1><div className="flex flex-col gap-6 lg:flex-row"><AccountNavigation active={active} /><div className="min-w-0 flex-1">{children}</div></div></div></main>; }
function AccountNavigation({ active }: { active: string }) { const links = [["overview", "/Account/MyAccount", "Account Overview"], ["details", "/Account/AccountDetails", "Account Details"], ["security", "/Account/Security", "Security"], ["privacy", "/Account/Privacy", "Privacy & Communication"], ["connections", "/Account/Connections", "Connections"], ["payments", "/Account/PaymentMethods", "Payment Methods"], ["transactions", "/Account/TransactionHistory", "Transaction History"]] as const; return <aside className="w-full shrink-0 lg:w-[260px]"><nav className="flex flex-col gap-1 rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl" aria-label="Account navigation">{links.map(([key, to, label]) => <Link key={key} to={to} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-[#20262d] ${active === key ? "bg-[#20262d]" : ""}`}>{label}</Link>)}</nav></aside>; }
