"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { Link, Outlet, useLocation } from "@/router/nextCompat";
import Navbar from "@/components/layout/Navbar";

type AdminLink = {
  label: string;
  to: string;
  permissions: readonly string[];
};

const secondaryLinks: readonly AdminLink[] = [
  { label: "Pages", to: "/Admin/PageBuilder", permissions: [adminPermissions.pages.read] },
  { label: "Talent Trees", to: "/Admin/PageBuilder/TalentTrees", permissions: [adminPermissions.talentTrees.read] },
  { label: "SEO", to: "/Admin/Seo", permissions: [adminPermissions.seo.read] },
  { label: "Database", to: "/Admin/Database", permissions: [adminPermissions.database.read] },
  { label: "Products", to: "/Merchandise/Merchandise", permissions: [adminPermissions.products.read] },
  { label: "Roles", to: "/Admin/Roles", permissions: [adminPermissions.roles.read] },
  { label: "Users", to: "/Admin/Users", permissions: [adminPermissions.users.read] },
];

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

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const { hasAnyPermission } = useAuth();
  const [promoOpen, setPromoOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const { pathname } = useLocation();
  const promoRef = useRef<HTMLDivElement>(null);

  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const fullWidthWorkspace = normalizedPath === "/admin/pagebuilder/talenttrees";
  const canSeePromo = hasAnyPermission([
    adminPermissions.promoCodes.read,
    adminPermissions.promoCodes.create,
  ]);

  useEffect(() => {
    setPromoOpen(false);
    setSectionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!promoRef.current?.contains(event.target as Node)) setPromoOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

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

  const visibleSecondary = secondaryLinks.filter((link) => hasAnyPermission(link.permissions));
  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => hasAnyPermission(link.permissions)),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <div className="ph-admin min-vh-100">
      <Navbar forceVisible />

      <header className="admin-secondary-nav">
        <nav className="admin-secondary-nav-inner" aria-label="Admin navigation">
          {visibleSecondary.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`admin-secondary-link${isActive(link.to) ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          {canSeePromo ? (
            <div className="admin-secondary-dropdown" ref={promoRef}>
              <button
                type="button"
                className={`admin-secondary-link admin-secondary-button${
                  normalizedPath.startsWith("/admin/promocodes") ? " active" : ""
                }`}
                aria-expanded={promoOpen}
                onClick={() => setPromoOpen((current) => !current)}
              >
                Promo Codes <span aria-hidden="true">▾</span>
              </button>
              {promoOpen ? (
                <div className="admin-secondary-dropdown-menu">
                  {hasAnyPermission([adminPermissions.promoCodes.read]) ? <Link to="/Admin/PromoCodes">All</Link> : null}
                  {hasAnyPermission([adminPermissions.promoCodes.create]) ? <Link to="/Admin/PromoCodes/Create">Create</Link> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
      </header>

      <button type="button" className="admin-sections-toggle" aria-controls="admin-sections" aria-expanded={sectionsOpen} onClick={() => setSectionsOpen((value) => !value)}>
        Admin sections <span aria-hidden="true">{sectionsOpen ? "−" : "+"}</span>
      </button>
      <div className="admin-shell">
        <aside id="admin-sections" className={`admin-shell-sidebar${sectionsOpen ? " is-open" : ""}`} aria-label="Admin sections">
          <div className="admin-shell-sidebar-title">Admin</div>
          {visibleSections.map((section) => (
            <section className="admin-sidebar-section" key={section.title}>
              <h2>{section.title}</h2>
              <nav aria-label={`${section.title} admin links`}>
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`admin-sidebar-link${isActive(link.to) ? " active" : ""}`}
                  >
                    {link.label}
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
          {children ?? <Outlet />}
        </div>
      </div>

      {!fullWidthWorkspace ? (
        <footer className="footer bg-dark text-light text-center py-2">
          Admin Panel © {new Date().getFullYear()}
        </footer>
      ) : null}
    </div>
  );
}
