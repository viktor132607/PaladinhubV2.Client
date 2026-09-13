"use client";

import { useEffect } from "react";
import { Outlet, useLocation } from "@/router/nextCompat";
import { GuidePageHeader } from "@/components/migration/MigratedView";
import BannerZone from "@/components/banners/BannerZone";
import Navbar from "./Navbar";
import Footer from "./Footer";

function normalizePath(pathname: string) {
  return pathname.toLowerCase().replace(/\/+$/, "") || "/";
}

function usesAccountLayout(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/account/login" || path === "/login" || path === "/account/register" || path === "/register" || path === "/account/verifyemail" || path === "/verify-email";
}

function usesAdminLayout(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/admin" || path.startsWith("/admin/") || path === "/products/create" || path.startsWith("/products/edit/");
}

export default function Layout() {
  const { pathname } = useLocation();
  const accountLayout = usesAccountLayout(pathname);
  const adminLayout = usesAdminLayout(pathname);

  useEffect(() => {
    if (accountLayout || adminLayout) return;

    const applyCurrentSection = () => {
      const currentHash = window.location.hash;

      document.querySelectorAll<HTMLElement>(".section-cell.active").forEach((el) => {
        el.classList.remove("active");
      });

      if (!currentHash) return;

      document.querySelectorAll<HTMLAnchorElement>(".section-cell").forEach((el) => {
        if (el.getAttribute("href") === currentHash) {
          el.classList.add("active");
        }
      });
    };

    applyCurrentSection();
    window.addEventListener("hashchange", applyCurrentSection);
    return () => window.removeEventListener("hashchange", applyCurrentSection);
  }, [pathname, accountLayout, adminLayout]);

  if (accountLayout || adminLayout) {
    return <Outlet />;
  }

  return (
    <div className="ph-v1-layout">
      <BannerZone position="above-navbar" />
      <Navbar />
      <BannerZone position="below-navbar" />
      <div className="ph-v1-layout-content">
        <BannerZone position="above-content" />
        <GuidePageHeader />
        <main role="main" className="pb-5 container ph-v1-main-container">
          <Outlet />
        </main>
      </div>
      <br />
      <Footer />
    </div>
  );
}
