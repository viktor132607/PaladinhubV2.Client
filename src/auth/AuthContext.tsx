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
import {
  canEnterAdmin,
  hasAnyEffectivePermission,
  hasEffectivePermission,
} from "@/auth/adminPermissions";
import { ADMIN_PERMISSION_REFRESH_EVENT } from "@/lib/admin-categories";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarPath?: string | null;
  roles: string[];
  permissions: string[];
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
  permissions: string[];
  isAuthenticated: boolean;
  canAccessAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithTwoFactor: (input: TwoFactorInput) => Promise<void>;
  loginWithRecoveryCode: (recoveryCode: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: readonly string[]) => boolean;
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

function normalizeSessionUser(user: AuthUser | null): AuthUser | null {
  if (!user) return null;
  return {
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [],
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: AuthSession | null | undefined) => {
    setUser(
      session?.isAuthenticated
        ? normalizeSessionUser(session.user)
        : null,
    );
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetchBackend(backendEndpoints.auth.me, {
        cache: "no-store",
      });

      applySession(await readApiJson<AuthSession>(response));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handlePermissionRefresh = () => {
      void refresh();
    };

    window.addEventListener(
      ADMIN_PERMISSION_REFRESH_EVENT,
      handlePermissionRefresh,
    );

    return () => {
      window.removeEventListener(
        ADMIN_PERMISSION_REFRESH_EVENT,
        handlePermissionRefresh,
      );
    };
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

      applySession(await readApiJson<AuthSession>(response));

      return {
        requiresTwoFactor: false,
      };
    },
    [applySession],
  );

  const register = useCallback(async (input: RegisterInput) => {
    applySession(await postAuth<AuthSession>(
      backendEndpoints.auth.register,
      input,
    ));
  }, [applySession]);

  const loginWithTwoFactor = useCallback(async (input: TwoFactorInput) => {
    applySession(await postAuth<AuthSession>(
      backendEndpoints.auth.loginWithTwoFactor,
      input,
    ));
  }, [applySession]);

  const loginWithRecoveryCode = useCallback(
    async (recoveryCode: string) => {
      applySession(await postAuth<AuthSession>(
        backendEndpoints.auth.loginWithRecoveryCode,
        { recoveryCode },
      ));
    },
    [applySession],
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

  const permissions = useMemo(
    () => user?.permissions ?? [],
    [user],
  );

  const hasPermission = useCallback(
    (permission: string): boolean =>
      hasEffectivePermission(permissions, permission),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (required: readonly string[]): boolean =>
      hasAnyEffectivePermission(permissions, required),
    [permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      isAuthenticated: Boolean(user),
      canAccessAdmin: canEnterAdmin(permissions),
      loading,
      refresh,
      login,
      register,
      loginWithTwoFactor,
      loginWithRecoveryCode,
      logout,
      hasRole,
      hasPermission,
      hasAnyPermission,
    }),
    [
      user,
      permissions,
      loading,
      refresh,
      login,
      register,
      loginWithTwoFactor,
      loginWithRecoveryCode,
      logout,
      hasRole,
      hasPermission,
      hasAnyPermission,
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
