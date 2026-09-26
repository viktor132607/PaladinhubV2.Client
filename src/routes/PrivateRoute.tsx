"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Navigate, useLocation } from "@/router/nextCompat";
import AuthShell from "@/components/auth/AuthShell";

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <AuthShell><p>Checking session...</p></AuthShell>
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

  return <>{children}</>;
}
