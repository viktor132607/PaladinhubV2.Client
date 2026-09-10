"use client";

import { useEffect } from "react";
import { Outlet, useLocation } from "@/router/nextCompat";
import { GuidePageHeader } from "@/components/migration/MigratedView";
import Navbar from "./Navbar";
import Footer from "./Footer";

function normalizePath(pathname: string) {
  return pathname.toLowerCase().replace(/\/+$/, "") || "/";
}

function usesAccountLayout(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/account/login" || path === "/login" || path === "/account/register" || path === "/register" || path === "/account/verifyemail" || path === "/verify-email";
}

function usesPublicLayoutInsideAdmin(pathname: string) {
  const path = normalizePath(pathname);
  return path === "/admin/pagebuilder" || path.startsWith("/admin/pagebuilder/") || path === "/admin/products" || path.startsWith("/admin/products/");
}

function usesStandaloneAdminLayout(pathname: string) {
  const path = normalizePath(pathname);
  return (path === "/admin" || path.startsWith("/admin/")) && !usesPublicLayoutInsideAdmin(path);
}

function usesFullWidthAdminWorkspace(pathname: string) {
  return normalizePath(pathname) === "/admin/pagebuilder/talenttrees";
}

export default function Layout() {
  const { pathname } = useLocation();
  const accountLayout = usesAccountLayout(pathname);
  const standaloneAdminLayout = usesStandaloneAdminLayout(pathname);
  const fullWidthAdminWorkspace = usesFullWidthAdminWorkspace(pathname);

  useEffect(() => {
    if (accountLayout || standaloneAdminLayout) return;

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
  }, [pathname, accountLayout, standaloneAdminLayout]);

  if (accountLayout || standaloneAdminLayout) {
    return <Outlet />;
  }

  return (
    <div className="ph-v1-layout">
      <Navbar />
      <div className="ph-v1-layout-content">
        {!fullWidthAdminWorkspace ? <GuidePageHeader /> : null}
        <main
          role="main"
          className={
            fullWidthAdminWorkspace
              ? "w-full max-w-none p-0"
              : "pb-5 container ph-v1-main-container"
          }
        >
          <Outlet />
        </main>
      </div>
      {!fullWidthAdminWorkspace ? <br /> : null}
      <Footer />
    </div>
  );
}
