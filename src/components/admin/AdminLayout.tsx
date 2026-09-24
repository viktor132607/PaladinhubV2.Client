"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { Link, Outlet, useLocation } from "@/router/nextCompat";
import Navbar from "@/components/layout/Navbar";
import { useLocalization } from "@/localization/LocalizationContext";
import { formatMessage } from "@/localization/catalog";

type AdminLink = {
  label: string;
  to: string;
  permissions: readonly string[];
};

const sidebarSections: ReadonlyArray<{ title: string; links: readonly AdminLink[] }> = [
  {
    title: "Content",
    links: [
      { label: "Page Builder", to: "/Admin/PageBuilder", permissions: [adminPermissions.pages.read] },
      { label: "Talent Tree Builder", to: "/Admin/PageBuilder/TalentTrees", permissions: [adminPermissions.talentTrees.read] },
      { label: "Add Page", to: "/Admin/PageBuilder/Create", permissions: [adminPermissions.pages.create] },
      { label: "SEO", to: "/Admin/Seo", permissions: [adminPermissions.seo.read] },
      { label: "Banners & messages", to: "/Admin/Banners", permissions: [adminPermissions.banners.read] },
      { label: "Footer & contacts", to: "/Admin/Footer", permissions: [adminPermissions.footer.read] },
    ],
  },
  {
    title: "Data",
    links: [
      { label: "backup.title", to: "/Admin/Backup", permissions: [adminPermissions.databaseBackups.read, adminPermissions.databaseBackups.restore] },
      { label: "Database", to: "/Admin/Database", permissions: [adminPermissions.database.read] },
      { label: "Categories", to: "/Admin/Categories", permissions: [adminPermissions.categories.read] },
      { label: "Classes & specializations", to: "/Admin/Classes", permissions: [adminPermissions.classes.read] },
      { label: "Tags", to: "/Admin/Tags", permissions: [adminPermissions.tags.read] },
      { label: "Patches", to: "/Admin/Patches", permissions: [adminPermissions.patches.read] },
      { label: "Item rarities", to: "/Admin/Rarities", permissions: [adminPermissions.rarities.read] },
      { label: "Media library", to: "/Admin/Media", permissions: [adminPermissions.media.read] },
      { label: "Navigation", to: "/Admin/Navigation", permissions: [adminPermissions.navigation.read] },
      { label: "Languages & translations", to: "/Admin/Translations", permissions: [adminPermissions.localization.read] },
    ],
  },
  {
    title: "Commerce",
    links: [
      { label: "Products", to: "/Merchandise/Merchandise", permissions: [adminPermissions.products.read] },
      { label: "Promo Codes", to: "/Admin/PromoCodes", permissions: [adminPermissions.promoCodes.read] },
      { label: "Create Promo Code", to: "/Admin/PromoCodes/Create", permissions: [adminPermissions.promoCodes.create] },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Roles & permissions", to: "/Admin/Roles", permissions: [adminPermissions.roles.read] },
      { label: "Users & role assignments", to: "/Admin/Users", permissions: [adminPermissions.users.read] },
    ],
  },
];

const ADMIN_THEME_KEY = "paladinhub.admin.theme";

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const { t } = useLocalization();
  const { hasAnyPermission } = useAuth();
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [navigationQuery, setNavigationQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { pathname } = useLocation();

  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const fullWidthWorkspace = normalizedPath === "/admin/pagebuilder/talenttrees";
  useEffect(() => {
    setSectionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(ADMIN_THEME_KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    } catch {
      // Browser storage can be unavailable; the light theme stays usable.
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try { window.localStorage.setItem(ADMIN_THEME_KEY, next); } catch { /* private browsing */ }
  };

  const isActive = (to: string) => {
    const target = to.toLowerCase();
    if (target === "/admin/pagebuilder") {
      return normalizedPath.startsWith("/admin/pagebuilder") &&
        normalizedPath !== "/admin/pagebuilder/talenttrees";
    }
    if (target === "/admin/promocodes") {
      return normalizedPath.startsWith("/admin/promocodes");
    }
    return normalizedPath === target || normalizedPath.startsWith(`${target}/`);
  };

  const query = navigationQuery.trim().toLocaleLowerCase();
  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) =>
        hasAnyPermission(link.permissions) && (!query || t(link.label).toLocaleLowerCase().includes(query))
      ),
    }))
    .filter((section) => section.links.length > 0);
  const currentLink = sidebarSections.flatMap((section) => section.links)
    .filter((link) => hasAnyPermission(link.permissions) && isActive(link.to))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return (
    <div className="ph-admin min-vh-100" data-admin-theme={theme}>
      <Navbar forceVisible />

      <div className="admin-mobile-toolbar">
        <button type="button" className="admin-sections-toggle" aria-controls="admin-sections" aria-expanded={sectionsOpen} onClick={() => setSectionsOpen((value) => !value)}>
          {t("admin.sections")} <span aria-hidden="true">{sectionsOpen ? "−" : "+"}</span>
        </button>
        <button type="button" className="admin-mobile-theme-button" onClick={toggleTheme} aria-label={t(theme === "light" ? "admin.switchToDark" : "admin.switchToLight")}>
          <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
        </button>
      </div>
      <div className="admin-shell">
        <aside id="admin-sections" className={`admin-shell-sidebar${sectionsOpen ? " is-open" : ""}`} aria-label={t("admin.sections")}>
          <div className="admin-shell-sidebar-title">
            <span className="admin-brand-mark" aria-hidden="true">P</span>
            <span>PaladinHub <small>{t("admin.panel")}</small></span>
          </div>
          <label className="admin-navigation-search">
            <span className="visually-hidden">{t("admin.searchNavigation")}</span>
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder={t("admin.searchNavigation")} value={navigationQuery} onChange={(event) => setNavigationQuery(event.target.value)} />
          </label>
          <button type="button" className="admin-theme-toggle" onClick={toggleTheme} aria-label={t(theme === "light" ? "admin.switchToDark" : "admin.switchToLight")}>
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            {t(theme === "light" ? "admin.darkTheme" : "admin.lightTheme")}
          </button>
          {visibleSections.map((section) => (
            <section className="admin-sidebar-section" key={section.title}>
              <h2>{t(section.title)}</h2>
              <nav aria-label={formatMessage(t("admin.sectionLinks"), { name: t(section.title) })}>
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`admin-sidebar-link${isActive(link.to) ? " active" : ""}`}
                    aria-current={isActive(link.to) ? "page" : undefined}
                  >
                    {t(link.label)}
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </aside>

        <div
          className={`admin-shell-main${
            fullWidthWorkspace ? " admin-shell-main--full" : ""
          }`}
        >
          {!fullWidthWorkspace ? (
            <div className="admin-workspace-bar">
              <nav aria-label={t("admin.navigationLabel")}>
                {visibleSections.length ? <Link to="/Admin">{t("nav.admin")}</Link> : <span>{t("nav.admin")}</span>}
                {currentLink ? <><span aria-hidden="true">/</span><span aria-current="page">{t(currentLink.label)}</span></> : null}
              </nav>
            </div>
          ) : null}
          {children ?? <Outlet />}
        </div>
      </div>

      {!fullWidthWorkspace ? (
        <footer className="footer bg-dark text-light text-center py-2">
          {t("admin.panel")} © {new Date().getFullYear()}
        </footer>
      ) : null}
    </div>
  );
}
