"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Navigate, useLocation } from "@/router/nextCompat";

export default function RoleRoute({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="ph-auth-page">
        <section className="ph-auth-card">
          <p>Checking permissions...</p>
        </section>
      </main>
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

  if (!hasRole(role)) {
    return <Navigate to="/Error/404" replace />;
  }

  return <>{children}</>;
}
