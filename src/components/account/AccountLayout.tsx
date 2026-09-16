"use client";
import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link } from "@/router/nextCompat";
import AccountSideNav from "./AccountSideNav";
import s from "./account.module.css";
export type AccountLayoutProps = { children?: ReactNode; active?: string };
export default function AccountLayout({
  children,
  active,
}: AccountLayoutProps) {
  const { loading, isAuthenticated } = useAuth();
  return (
    <main className={s.page}>
      <div className={s.frame}>
        <AccountSideNav active={active} />
        <section className={s.content}>
          {loading ? (
            <p role="status">Loading account...</p>
          ) : !isAuthenticated ? (
            <div className={s.card}>
              <h1>Sign in to your account</h1>
              <Link to="/Account/Login">Sign in</Link>
            </div>
          ) : (
            children
          )}
        </section>
      </div>
    </main>
  );
}
