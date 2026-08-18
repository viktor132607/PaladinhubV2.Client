"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  Link,
  useNavigate,
} from "@/router/nextCompat";

const MINI_CART_KEY =
  "ph_enableMiniCartHover";

const STICKY_NAV_KEY =
  "ph_stickyNavbar";

const PREFERENCES_CHANGED_EVENT =
  "paladinhub:preferences-changed";

type UiPreferences = {
  miniCartHover: boolean;
  stickyNavbar: boolean;
};

type PreferenceSwitchProps = {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (
    checked: boolean,
  ) => void;
};

const defaultPreferences: UiPreferences = {
  miniCartHover: true,
  stickyNavbar: true,
};

function readStoredBoolean(
  key: string,
  fallback: boolean,
): boolean {
  try {
    const value =
      window.localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return value === "true";
  } catch {
    return fallback;
  }
}

function storePreference(
  key: string,
  value: boolean,
): void {
  try {
    window.localStorage.setItem(
      key,
      String(value),
    );
  } catch {
    // The preference still applies for the current session.
  }
}

function removeStoredPreference(
  key: string,
): void {
  try {
    window.localStorage.removeItem(
      key,
    );
  } catch {
    // The preference still resets for the current session.
  }
}

function applyPreferences(
  preferences: UiPreferences,
): void {
  const root =
    document.documentElement;

  root.dataset.miniCartHover =
    String(
      preferences.miniCartHover,
    );

  root.dataset.stickyNavbar =
    String(
      preferences.stickyNavbar,
    );

  window.dispatchEvent(
    new CustomEvent<UiPreferences>(
      PREFERENCES_CHANGED_EVENT,
      {
        detail: {
          ...preferences,
        },
      },
    ),
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { logout: logoutSession } =
    useAuth();

  const [
    preferences,
    setPreferences,
  ] = useState<UiPreferences>(
    defaultPreferences,
  );

  const [ready, setReady] =
    useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadedPreferences: UiPreferences =
      {
        miniCartHover:
          readStoredBoolean(
            MINI_CART_KEY,
            defaultPreferences
              .miniCartHover,
          ),

        stickyNavbar:
          readStoredBoolean(
            STICKY_NAV_KEY,
            defaultPreferences
              .stickyNavbar,
          ),
      };

    setPreferences(
      loadedPreferences,
    );

    applyPreferences(
      loadedPreferences,
    );

    setReady(true);
  }, []);

  const updatePreference =
    useCallback(
      (
        key: keyof UiPreferences,
        value: boolean,
      ): void => {
        setPreferences(
          (current) => {
            const next: UiPreferences = {
              ...current,
              [key]: value,
            };

            storePreference(
              key === "miniCartHover"
                ? MINI_CART_KEY
                : STICKY_NAV_KEY,
              value,
            );

            applyPreferences(next);

            return next;
          },
        );
      },
      [],
    );

  const resetPreferences =
    useCallback((): void => {
      removeStoredPreference(
        MINI_CART_KEY,
      );

      removeStoredPreference(
        STICKY_NAV_KEY,
      );

      const next = {
        ...defaultPreferences,
      };

      setPreferences(next);
      applyPreferences(next);
      setError(null);
    }, []);

  const logout =
    useCallback(
      async (): Promise<void> => {
        if (loggingOut) {
          return;
        }

        setLoggingOut(true);
        setError(null);

        try {
          await logoutSession();

          navigate("/", {
            replace: true,
          });
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Logout failed.",
          );

          setLoggingOut(false);
        }
      },
      [
        loggingOut,
        logoutSession,
        navigate,
      ],
    );

  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#1a1d20] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-semibold">
          Settings
        </h1>

        {error ? (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-[#3a4047] bg-[#23272b] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">
              UI Preferences
            </h2>

            <p className="mt-1 text-sm text-[#b8c0cc]">
              These preferences are
              stored only in this
              browser.
            </p>

            <div className="mt-6 space-y-5">
              <PreferenceSwitch
                id="prefMiniCartHover"
                label="Enable mini cart on hover"
                checked={
                  preferences.miniCartHover
                }
                disabled={!ready}
                onChange={(
                  checked,
                ) => {
                  updatePreference(
                    "miniCartHover",
                    checked,
                  );
                }}
              />

              <PreferenceSwitch
                id="prefStickyNavbar"
                label="Keep the navigation bar visible"
                checked={
                  preferences.stickyNavbar
                }
                disabled={!ready}
                onChange={(
                  checked,
                ) => {
                  updatePreference(
                    "stickyNavbar",
                    checked,
                  );
                }}
              />
            </div>

            <button
              type="button"
              onClick={
                resetPreferences
              }
              disabled={!ready}
              className="mt-6 rounded-md border border-[#4a525e] bg-[#2b3036] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f4650] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to defaults
            </button>
          </section>

          <section className="rounded-xl border border-[#3a4047] bg-[#23272b] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">
              Account
            </h2>

            <p className="mt-1 text-sm text-[#b8c0cc]">
              Manage your account or
              end the current session.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/Account/ChangePassword"
                className="inline-flex items-center gap-2 rounded-md bg-[#f6b21a] px-4 py-2.5 font-bold text-white hover:bg-[#e0a10f]"
              >
                <KeyIcon />
                Change Password
              </Link>

              <Link
                to="/Account/MyAccount"
                className="inline-flex items-center gap-2 rounded-md bg-[#3f4650] px-4 py-2.5 font-bold text-white hover:bg-[#4a525e]"
              >
                <UserIcon />
                My Account
              </Link>

              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-md bg-[#c0392b] px-4 py-2.5 font-bold text-white hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogoutIcon />

                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function PreferenceSwitch({
  id,
  label,
  checked,
  disabled,
  onChange,
}: PreferenceSwitchProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between gap-5 rounded-lg border border-[#3a4047] bg-[#2b3036] px-4 py-3 ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer"
      }`}
    >
      <span>{label}</span>

      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(
            event.target.checked,
          );
        }}
        className="h-5 w-5 accent-[#f6b21a]"
      />
    </label>
  );
}

function KeyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M3.5 8a2.5 2.5 0 1 1 4.95.5h3.05a1.5 1.5 0 1 1 0 3H8.45A2.5 2.5 0 1 1 3.5 11V8Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 1 1 10 0H3Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M6 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v4h4V3H8v4H6V2Z" />
      <path d="m1 8 4-4v3h6v2H5v3L1 8Z" />
    </svg>
  );
}