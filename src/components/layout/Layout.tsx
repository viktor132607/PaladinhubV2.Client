"use client";

import { Outlet, useLocation } from "@/router/nextCompat";
import { GuidePageHeader } from "@/components/migration/MigratedView";
import Navbar from "./Navbar";
import Footer from "./Footer";

function usesAccountLayout(pathname: string) {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return path === "/account/login" || path === "/login" || path === "/account/register" || path === "/register" || path === "/account/verifyemail" || path === "/verify-email";
}

export default function Layout() {
  const { pathname } = useLocation();

  if (usesAccountLayout(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="ph-v1-layout">
      <Navbar />
      <div className="ph-v1-layout-content">
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
