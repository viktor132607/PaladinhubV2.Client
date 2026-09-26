"use client";

import { useEffect } from "react";
import { useLocation } from "@/router/nextCompat";

const STYLE_MARKER = "data-paladinhub-v1-route-style";
const STYLE_ROOT = "/styles/v1";
const BOOTSTRAP_STYLE = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css";
const SITE_STYLE = `${STYLE_ROOT}/site.css`;

const normalizePath = (pathname: string) => pathname.toLowerCase().replace(/\/+$/, "") || "/";

const usesAccountLayout = (pathname: string) =>
  pathname === "/account/login" ||
  pathname === "/login" ||
  pathname === "/account/register" ||
  pathname === "/register" ||
  pathname === "/account/verifyemail" ||
  pathname === "/verify-email";

const isMainAccountPath = (pathname: string) =>
  pathname === "/profile" ||
  pathname.startsWith("/account/") ||
  pathname === "/account";

const isMerchandisePath = (pathname: string) =>
  pathname === "/merchandise/merchandise" ||
  pathname === "/merchandise/list" ||
  pathname === "/products";

const isGuidePath = (pathname: string) => {
  const [section, page] = pathname.split("/").filter(Boolean);
  return (
    (section === "holy" || section === "protection" || section === "retribution") &&
    (page === "overview" ||
      page === "gear" ||
      page === "talents" ||
      page === "consumables" ||
      page === "rotation" ||
      page === "stats")
  );
};

const getRouteStyles = (pathname: string): string[] => {
  const normalized = normalizePath(pathname);

  if (normalized === "/admin" || normalized.startsWith("/admin/") || normalized === "/products/create" || normalized.startsWith("/products/edit/")) {
    return [BOOTSTRAP_STYLE, SITE_STYLE, `${STYLE_ROOT}/admin/admin.css`, `${STYLE_ROOT}/admin/admin-theme.css`];
  }

  if (normalized === "/" || normalized === "/home/home") {
    return [
      `${STYLE_ROOT}/home.css`,
      BOOTSTRAP_STYLE,
      SITE_STYLE,
    ];
  }

  if (usesAccountLayout(normalized)) {
    return [BOOTSTRAP_STYLE, `${STYLE_ROOT}/account.css`];
  }

  if (isMainAccountPath(normalized)) {
    return [BOOTSTRAP_STYLE, SITE_STYLE];
  }

  if (isMerchandisePath(normalized)) {
    return [
      BOOTSTRAP_STYLE,
      SITE_STYLE,
      `${STYLE_ROOT}/merchandise.css`,
      `${STYLE_ROOT}/merchandise-final.css`,
      `${STYLE_ROOT}/merchandise-filter-exact.css`,
    ];
  }

  if (isGuidePath(normalized)) {
    return [BOOTSTRAP_STYLE, SITE_STYLE];
  }

  return [BOOTSTRAP_STYLE, SITE_STYLE];
};

export default function V1Stylesheets() {
  const { pathname } = useLocation();

  useEffect(() => {
    const requiredStyles = getRouteStyles(pathname);
    const activeLinks = Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[${STYLE_MARKER}]`));
    let retained = 0;
    while (retained < activeLinks.length && retained < requiredStyles.length &&
      activeLinks[retained].getAttribute("href") === requiredStyles[retained]) {
      retained++;
    }

    // Retain the common prefix: product navigation keeps Bootstrap and site.css
    // in their original cascade positions instead of removing and reloading them.
    for (const link of activeLinks.slice(retained)) link.remove();

    for (const href of requiredStyles.slice(retained)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute(STYLE_MARKER, "true");
      document.head.appendChild(link);
    }
  }, [pathname]);

  return null;
}
