"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import {
  Link,
  useNavigate,
} from "@/router/nextCompat";

const RECOVERY_CODES_STORAGE_KEY =
  "paladinhub.recoveryCodes";

type AuthenticatorSetupResponse = {
  twoFactorEnabled: boolean;
  sharedKey: string | null;
  authenticatorUri: string | null;
  qrCodeUrl: string | null;
};

type EnableTwoFactorResponse = {
  ok: boolean;
  message?: string;
  twoFactorEnabled: boolean;
  recoveryCodes: string[];
};

type DisableTwoFactorResponse = {
  ok: boolean;
  message?: string;
  twoFactorEnabled: boolean;
  requireTwoFactor: boolean;
};

type AccountSection =
  | "overview"
  | "details"
  | "security"
  | "privacy"
  | "connections"
  | "payments"
  | "transactions";

function normalizeSetup(
  payload: AuthenticatorSetupResponse,
): AuthenticatorSetupResponse {
  return {
    twoFactorEnabled:
      payload.twoFactorEnabled === true,

    sharedKey:
      typeof payload.sharedKey === "string" &&
      payload.sharedKey.trim()
        ? payload.sharedKey.trim()
        : null,

    authenticatorUri:
      typeof payload.authenticatorUri ===
        "string" &&
      payload.authenticatorUri.trim()
        ? payload.authenticatorUri.trim()
        : null,

    qrCodeUrl:
      typeof payload.qrCodeUrl === "string" &&
      payload.qrCodeUrl.trim()
        ? payload.qrCodeUrl.trim()
        : null,
  };
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function Enable2FA() {
  const navigate = useNavigate();

  const [setup, setSetup] =
    useState<AuthenticatorSetupResponse | null>(
      null,
    );

  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<string | null>(null);

  const [copied, setCopied] =
    useState(false);

  const loadSetup = useCallback(
    async (
      reset = false,
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      setNotice(null);

      try {
        const endpoint = reset
          ? `${backendEndpoints.account.enable2fa}?reset=true`
          : backendEndpoints.account.enable2fa;

        const response = await fetchBackend(
          endpoint,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const payload =
          await readApiJson<AuthenticatorSetupResponse>(
            response,
          );

        if (signal?.aborted) {
          return;
        }

        const normalized =
          normalizeSetup(payload);

        setSetup(normalized);
        setCode("");

        if (
          !normalized.twoFactorEnabled &&
          (!normalized.sharedKey ||
            !normalized.qrCodeUrl)
        ) {
          throw new Error(
            "The server did not return complete authenticator setup data.",
          );
        }

        if (reset) {
          setNotice(
            "A new authenticator key was generated.",
          );
        }
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setSetup(null);

        setError(
          caught instanceof Error
            ? caught.message
            : "Authenticator setup could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadSetup(
      false,
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [loadSetup]);

  const verify = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      event.preventDefault();

      if (working) {
        return;
      }

      const sanitizedCode =
        code.replace(/\D/g, "");

      if (sanitizedCode.length !== 6) {
        setError(
          "Enter the 6-digit code from your authenticator app.",
        );
        return;
      }

      setWorking(true);
      setError(null);
      setNotice(null);

      try {
        const response = await fetchBackend(
          backendEndpoints.account.enable2fa,
          {
            method: "POST",
            cache: "no-store",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8",
            },

            body: new URLSearchParams({
              code: sanitizedCode,
            }),
          },
        );

        const result =
          await readApiJson<EnableTwoFactorResponse>(
            response,
          );

        if (result.ok === false) {
          throw new Error(
            result.message ||
              "Two-factor authentication could not be enabled.",
          );
        }

        const recoveryCodes =
          Array.isArray(result.recoveryCodes)
            ? Array.from(
                new Set(
                  result.recoveryCodes
                    .filter(
                      (
                        recoveryCode,
                      ): recoveryCode is string =>
                        typeof recoveryCode ===
                        "string",
                    )
                    .map((recoveryCode) =>
                      recoveryCode.trim(),
                    )
                    .filter(Boolean),
                ),
              )
            : [];

        if (recoveryCodes.length === 0) {
          throw new Error(
            "Two-factor authentication was enabled, but the server did not return recovery codes.",
          );
        }

        window.sessionStorage.setItem(
          RECOVERY_CODES_STORAGE_KEY,
          JSON.stringify(recoveryCodes),
        );

        navigate(
          "/Account/ShowRecoveryCodes",
          {
            replace: true,
          },
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Two-factor authentication could not be enabled.",
        );
      } finally {
        setWorking(false);
      }
    },
    [
      code,
      navigate,
      working,
    ],
  );

  const disable = useCallback(
    async (): Promise<void> => {
      if (working) {
        return;
      }

      const confirmed =
        window.confirm(
          "Disable two-factor authentication for this account?",
        );

      if (!confirmed) {
        return;
      }

      setWorking(true);
      setError(null);
      setNotice(null);

      try {
        const response = await fetchBackend(
          backendEndpoints.account.disable2fa,
          {
            method: "POST",
            cache: "no-store",
          },
        );

        const result =
          await readApiJson<DisableTwoFactorResponse>(
            response,
          );

        if (result.ok === false) {
          throw new Error(
            result.message ||
              "Two-factor authentication could not be disabled.",
          );
        }

        window.sessionStorage.removeItem(
          RECOVERY_CODES_STORAGE_KEY,
        );

        navigate(
          "/Account/Security",
          {
            replace: true,
          },
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Two-factor authentication could not be disabled.",
        );
      } finally {
        setWorking(false);
      }
    },
    [
      navigate,
      working,
    ],
  );

  const resetKey = useCallback(
    async (): Promise<void> => {
      if (
        working ||
        setup?.twoFactorEnabled
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Generate a new authenticator key? The current key will stop working.",
        );

      if (!confirmed) {
        return;
      }

      setWorking(true);

      try {
        await loadSetup(true);
      } finally {
        setWorking(false);
      }
    },
    [
      loadSetup,
      setup?.twoFactorEnabled,
      working,
    ],
  );

  const copyKey = useCallback(
    async (): Promise<void> => {
      if (!setup?.sharedKey) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          setup.sharedKey.replace(
            /\s/g,
            "",
          ),
        );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          1600,
        );
      } catch {
        setError(
          "The authenticator key could not be copied.",
        );
      }
    },
    [setup?.sharedKey],
  );

  return (
    <AccountPage
      active="security"
      title="Authenticator"
    >
      <div
        aria-live="polite"
        aria-atomic="true"
      >
        {notice ? (
          <div
            className="mb-5 rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {notice}
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            <p>{error}</p>

            {!setup ? (
              <button
                type="button"
                onClick={() => {
                  void loadSetup();
                }}
                disabled={
                  loading || working
                }
                className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40 disabled:opacity-50"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 text-[#a8b0bd]">
          Loading authenticator
          settings...
        </div>
      ) : null}

      {!loading &&
      setup?.twoFactorEnabled ? (
        <section className="rounded-xl border border-emerald-500/40 bg-[#1a1f24] p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-emerald-300">
            Two-factor authentication
            is enabled
          </h2>

          <p className="mt-3 text-[#cfd6df]">
            Your account is protected
            with an authenticator app.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/Account/ShowRecoveryCodes"
              className="rounded-md border border-[#46515e] px-4 py-2.5 font-medium hover:bg-[#252b33]"
            >
              Recovery codes
            </Link>

            <button
              type="button"
              onClick={() => {
                void disable();
              }}
              disabled={working}
              className="rounded-md border border-red-500/70 px-4 py-2.5 font-medium text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working
                ? "Disabling..."
                : "Disable 2FA"}
            </button>

            <Link
              to="/Account/Security"
              className="rounded-md bg-slate-700 px-4 py-2.5 font-medium hover:bg-slate-600"
            >
              Back to Security
            </Link>
          </div>
        </section>
      ) : null}

      {!loading &&
      setup &&
      !setup.twoFactorEnabled ? (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
              <h2 className="text-lg font-semibold">
                Secret key
              </h2>

              <button
                type="button"
                onClick={() => {
                  void copyKey();
                }}
                disabled={
                  !setup.sharedKey ||
                  working
                }
                className="mt-4 w-full break-all rounded-lg border border-[#46515e] bg-[#0f1216] px-4 py-3 text-left font-mono text-lg text-amber-300 hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                title="Copy secret key"
              >
                {setup.sharedKey}
              </button>

              <p className="mt-3 text-sm text-[#a8b0bd]">
                Enter this key in your
                authenticator app or
                scan the QR code.
              </p>

              {copied ? (
                <p
                  className="mt-2 text-sm text-emerald-300"
                  role="status"
                >
                  Key copied.
                </p>
              ) : null}
            </article>

            <article className="flex items-center justify-center rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
              {setup.qrCodeUrl ? (
                <img
                  src={setup.qrCodeUrl}
                  alt="Authenticator QR code"
                  width={180}
                  height={180}
                  className="h-[180px] w-[180px] rounded bg-white p-1"
                />
              ) : (
                <p className="text-sm text-red-300">
                  QR code is unavailable.
                </p>
              )}
            </article>
          </div>

          <article className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-6 shadow-xl">
            <form
              onSubmit={verify}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <label className="block flex-1 sm:max-w-sm">
                <span className="mb-2 block text-sm font-medium">
                  6-digit code
                </span>

                <input
                  value={code}
                  onChange={(event) => {
                    setCode(
                      event.target.value
                        .replace(
                          /\D/g,
                          "",
                        )
                        .slice(0, 6),
                    );
                  }}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  disabled={working}
                  className="w-full rounded-md border border-[#46515e] bg-[#0f1216] px-3 py-2.5 text-lg tracking-[0.35em] outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-60"
                />
              </label>

              <button
                type="submit"
                disabled={
                  working ||
                  code.length !== 6
                }
                className="rounded-md bg-amber-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {working
                  ? "Verifying..."
                  : "Verify & Enable"}
              </button>
            </form>
          </article>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void resetKey();
              }}
              disabled={working}
              className="rounded-md border border-slate-500 px-4 py-2.5 font-medium hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Generate New Key
            </button>

            <Link
              to="/Account/Security"
              className="rounded-md bg-slate-700 px-4 py-2.5 font-medium hover:bg-slate-600"
            >
              Back to Security
            </Link>
          </div>
        </div>
      ) : null}
    </AccountPage>
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