"use client";

import { useEffect, useState } from "react";
import AccountLayout from "@/components/account/AccountLayout";
import s from "@/components/account/account.module.css";

type PreferenceValue = boolean | string;
type Preferences = Record<string, PreferenceValue>;
type Setting = {
  key: string;
  name: string;
  description: string;
  type: "toggle" | "select";
  options?: string[];
};
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
  {
    title: "Social Settings",
    settings: [
      {
        key: "textChat",
        name: "Text Chat",
        description:
          "Control who can message you in chat across the website, desktop, and mobile apps.",
        type: "toggle",
      },
      {
        key: "privateChatLevel",
        name: "Private Chat Level",
        description: "Who can start private chat conversations with you.",
        type: "select",
        options: ["Everybody", "Friends", "Nobody"],
      },
      {
        key: "voiceChat",
        name: "Voice Chat",
        description:
          "Manage who can hear you and speak with you in voice chat on desktop and mobile apps.",
        type: "select",
        options: ["Listening & Speaking", "Listening Only", "Disabled"],
      },
      {
        key: "friends",
        name: "Friends",
        description:
          "Accept and manage friend requests to grow your friends list.",
        type: "toggle",
      },
      {
        key: "friendSuggestions",
        name: "Friends of Friends Suggestions",
        description: "Allow the service to suggest friends-of-friends.",
        type: "toggle",
      },
      {
        key: "realId",
        name: "Real ID",
        description: "Show your real name to your friends across the platform.",
        type: "toggle",
      },
      {
        key: "groups",
        name: "Community Groups",
        description:
          "Join and participate in groups with friends and communities.",
        type: "toggle",
      },
    ],
  },
  {
    title: "Game Data and Profile Privacy",
    settings: [
      {
        key: "shareGameData",
        name: "Share Game Data",
        description:
          "Allow sharing of your game data with external developers for features like leaderboards and stat trackers.",
        type: "toggle",
      },
    ],
  },
  {
    title: "Personalized Recommendations",
    settings: [
      {
        key: "recommendations",
        name: "PaladinHub Recommendations",
        description:
          "Use play patterns and interactions to personalize recommendations across games and services.",
        type: "toggle",
      },
      {
        key: "targetedAds",
        name: "Targeted Ads",
        description:
          "Allow ads to be tailored based on data across PaladinHub.",
        type: "toggle",
      },
    ],
  },
  {
    title: "Communication Preferences",
    settings: [
      {
        key: "language",
        name: "Language",
        description: "Communications will be sent in this language.",
        type: "select",
        options: [
          "English (US)",
          "English (UK)",
          "Bulgarian",
          "German",
          "French",
        ],
      },
      {
        key: "smsAlerts",
        name: "SMS Account Alerts",
        description:
          "Security notifications like password changes and suspicious activity.",
        type: "toggle",
      },
      {
        key: "pushNotifications",
        name: "Mobile Push Notifications",
        description:
          "Push notifications for friend requests, chat, and group invitations.",
        type: "toggle",
      },
      {
        key: "newsOffers",
        name: "News, Offers, & More",
        description: "Email updates about new features, promotions and events.",
        type: "select",
        options: ["All", "Some", "None"],
      },
    ],
  },
  {
    title: "Profile Settings",
    settings: [
      {
        key: "profileVisibility",
        name: "Profile Visibility",
        description:
          "Allow others to view your public profile on web, desktop, and mobile.",
        type: "select",
        options: ["Public", "Friends", "Private"],
      },
    ],
  },
];

export default function Privacy() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Preferences>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(storageKey) || "null",
      ) as unknown;
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

  const update = (key: string, value: PreferenceValue) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <AccountLayout active="Privacy">
      <h1>Privacy &amp; Communication</h1>
      {saved ? (
        <div
          className="mb-5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          Preferences saved on this device.
        </div>
      ) : null}
      <div className={s.stack}>
        {sections.map((section) => {
          const editing = editingSection === section.title;
          return (
            <article key={section.title} className={s.panel}>
              <header className={s.panelHeader}>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => beginEdit(section.title)}
                    className={s.textButton}
                  >
                    Update
                  </button>
                ) : (
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={saveSection}
                      className="text-emerald-300 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-[#a8b0bd] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </header>

              <div className={s.panelBody}>
                {section.settings.map((setting) => {
                  const value = editing
                    ? draft[setting.key]
                    : preferences[setting.key];
                  return (
                    <div key={setting.key} className={s.preferenceRow}>
                      <div className={s.preferenceDescription}>
                        <h3 className="font-semibold">{setting.name}</h3>
                        <p className="mt-1 text-sm text-[#a8b0bd]">
                          {setting.description}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {editing ? (
                          <PreferenceEditor
                            setting={setting}
                            value={value}
                            onChange={(next) => update(setting.key, next)}
                          />
                        ) : (
                          <PreferenceBadge value={value} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </AccountLayout>
  );
}

function PreferenceEditor({
  setting,
  value,
  onChange,
}: {
  setting: Setting;
  value: PreferenceValue;
  onChange: (value: PreferenceValue) => void;
}) {
  if (setting.type === "toggle") {
    const checked = Boolean(value);
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full border transition ${checked ? "border-emerald-500 bg-emerald-600" : "border-slate-500 bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    );
  }
  return (
    <select
      value={String(value)}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-40 rounded-md border border-[#46515e] bg-[#0f1216] px-3 py-2 text-sm outline-none focus:border-blue-500"
    >
      {setting.options?.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function PreferenceBadge({ value }: { value: PreferenceValue }) {
  return (
    <span
      className={typeof value === "boolean" && value ? s.positive : s.muted}
    >
      {typeof value === "boolean" ? (value ? "✓ Enabled" : "Off") : value}
    </span>
  );
}
