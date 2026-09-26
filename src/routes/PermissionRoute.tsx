"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Navigate, useLocation } from "@/router/nextCompat";
import AuthShell from "@/components/auth/AuthShell";

export default function PermissionRoute({
  permission,
  anyOf,
  allowAnyAdminPermission = false,
  children,
}: {
  permission?: string;
  anyOf?: readonly string[];
  allowAnyAdminPermission?: boolean;
  children: ReactNode;
}) {
  const {
    isAuthenticated,
    loading,
    canAccessAdmin,
    hasPermission,
    hasAnyPermission,
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <AuthShell>
          <p>Checking permissions...</p>
      </AuthShell>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/Account/Login?returnUrl=${encodeURIComponent(returnUrl)}`}
        replace
      />
    );
  }

  const allowed = allowAnyAdminPermission
    ? canAccessAdmin
    : permission
      ? hasPermission(permission)
      : anyOf?.length
        ? hasAnyPermission(anyOf)
        : false;

  if (!allowed) {
    return <Navigate to="/Error/403" replace />;
  }

  return <>{children}</>;
}
