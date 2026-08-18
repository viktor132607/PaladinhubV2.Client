"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarPath?: string | null;
  roles: string[];
};

type AuthSession = {
  isAuthenticated: boolean;
  user: AuthUser | null;
};

type LoginInput = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

type RegisterInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type TwoFactorInput = {
  code: string;
  rememberMe: boolean;
  rememberMachine: boolean;
};

type LoginResult = {
  requiresTwoFactor: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithTwoFactor: (input: TwoFactorInput) => Promise<void>;
  loginWithRecoveryCode: (recoveryCode: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  const data = await readApiJson<{ token?: string }>(response);

  if (!data?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return data.token;
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const csrfToken = await getCsrfToken();

  const response = await fetchBackend(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken,
    },
    body: JSON.stringify(body),
  });

  return readApiJson<T>(response);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetchBackend(backendEndpoints.auth.me, {
        cache: "no-store",
      });

      const session = await readApiJson<AuthSession>(response);

      setUser(session?.isAuthenticated ? session.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (input: LoginInput): Promise<LoginResult> => {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(backendEndpoints.auth.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify(input),
      });

      if (response.status === 202) {
        const result = await readApiJson<{
          requiresTwoFactor?: boolean;
        }>(response);

        return {
          requiresTwoFactor: Boolean(result?.requiresTwoFactor),
        };
      }

      const session = await readApiJson<AuthSession>(response);

      setUser(session.user);

      return {
        requiresTwoFactor: false,
      };
    },
    [],
  );

  const register = useCallback(async (input: RegisterInput) => {
    const session = await postAuth<AuthSession>(
      backendEndpoints.auth.register,
      input,
    );

    setUser(session.user);
  }, []);

  const loginWithTwoFactor = useCallback(async (input: TwoFactorInput) => {
    const session = await postAuth<AuthSession>(
      backendEndpoints.auth.loginWithTwoFactor,
      input,
    );

    setUser(session.user);
  }, []);

  const loginWithRecoveryCode = useCallback(
    async (recoveryCode: string) => {
      const session = await postAuth<AuthSession>(
        backendEndpoints.auth.loginWithRecoveryCode,
        { recoveryCode },
      );

      setUser(session.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await postAuth<unknown>(backendEndpoints.auth.logout, {});
    } finally {
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: string): boolean =>
      user?.roles.some(
        (currentRole: string) =>
          currentRole.toLowerCase() === role.toLowerCase(),
      ) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      refresh,
      login,
      register,
      loginWithTwoFactor,
      loginWithRecoveryCode,
      logout,
      hasRole,
    }),
    [
      user,
      loading,
      refresh,
      login,
      register,
      loginWithTwoFactor,
      loginWithRecoveryCode,
      logout,
      hasRole,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}