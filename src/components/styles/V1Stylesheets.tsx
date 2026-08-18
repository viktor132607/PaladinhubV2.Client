"use client";

import { useEffect } from "react";
import { useLocation } from "@/router/nextCompat";

const STYLE_MARKER = "data-paladinhub-v1-route-style";
const STYLE_ROOT = "/styles/v1";

const guideStyles: Record<string, Record<string, string>> = {
  holy: {
    overview: "holy/holyOverview.css",
    talents: "holy/holyTalents.css",
    rotation: "holy/holyRotation.css",
    gear: "holy/holyGear.css",
    stats: "holy/holyStats.css",
    consumables: "holy/holyConsumables.css",
  },
  protection: {
    overview: "protection/protectionOverview.css",
    talents: "protection/protectionTalents.css",
    rotation: "protection/protectionRotation.css",
    gear: "protection/protectionGear.css",
    stats: "protection/protectionStats.css",
    consumables: "protection/protectionConsumables.css",
  },
  retribution: {
    overview: "retribution/retributionOverview.css",
    talents: "retribution/retributionTalents.css",
    rotation: "retribution/retributionRotation.css",
    gear: "retribution/retributionGear.css",
    stats: "retribution/retributionStats.css",
    consumables: "retribution/retributionConsumables.css",
  },
};

const normalizePath = (pathname: string) => {
  const normalized = pathname.toLowerCase().replace(/\/+$/, "");
  return normalized || "/";
};

const isAccountPath = (pathname: string) =>
  pathname === "/profile" ||
  pathname === "/login" ||
  pathname === "/register" ||
  pathname === "/forgot-password" ||
  pathname === "/reset-password" ||
  pathname === "/login-with-2fa" ||
  pathname === "/recovery-code-login" ||
  pathname === "/verify-email" ||
  pathname === "/recovery-codes" ||
  pathname.startsWith("/account");

const getRouteStyles = (pathname: string): string[] => {
  const normalized = normalizePath(pathname);

  if (normalized === "/" || normalized === "/home/home") {
    return [`${STYLE_ROOT}/home.css`];
  }

  if (isAccountPath(normalized)) {
    return [`${STYLE_ROOT}/account.css`];
  }

  const [section, page = "overview"] = normalized.split("/").filter(Boolean);
  const sectionStyles = guideStyles[section];

  if (!sectionStyles) {
    return [];
  }

  const stylesheet = sectionStyles[page] ?? sectionStyles.overview;
  return [`${STYLE_ROOT}/${stylesheet}`];
};

export default function V1Stylesheets() {
  const { pathname } = useLocation();

  useEffect(() => {
    const requiredStyles = new Set(getRouteStyles(pathname));
    const activeLinks = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>(`link[${STYLE_MARKER}]`),
    );

    for (const link of activeLinks) {
      const href = link.getAttribute("href");
      if (!href || !requiredStyles.has(href)) {
        link.remove();
      } else {
        requiredStyles.delete(href);
      }
    }

    for (const href of requiredStyles) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute(STYLE_MARKER, "true");
      document.head.appendChild(link);
    }
  }, [pathname]);

  return null;
}
