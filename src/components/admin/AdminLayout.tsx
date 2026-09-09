"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "@/router/nextCompat";

const sectionPages = ["Overview", "Gear", "Talents", "Consumables", "Rotation", "Stats"] as const;

function usesPublicLayout(pathname: string) {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return (
    path === "/admin/pagebuilder" ||
    path.startsWith("/admin/pagebuilder/") ||
    path === "/admin/products" ||
    path.startsWith("/admin/products/")
  );
}

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [dropdown, setDropdown] = useState("");
  const { pathname } = useLocation();
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    setExpanded(false);
    setDropdown("");
  }, [pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!header.current?.contains(event.target as Node)) setDropdown("");
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (usesPublicLayout(pathname)) {
    return <>{children ?? <Outlet />}</>;
  }

  const navLink = (label: string, to: string) => (
    <li className="nav-item" key={label}>
      <Link className="nav-link" to={to}>{label}</Link>
    </li>
  );

  const menu = (label: string, entries: readonly (readonly [string, string])[]) => (
    <li className="nav-item dropdown" key={label} onKeyDown={(event) => { if (event.key === "Escape") setDropdown(""); }}>
      <a
        href="#"
        role="button"
        className={`nav-link dropdown-toggle${label === "Promo Codes" && pathname.toLowerCase().includes("promocodes") ? " active" : ""}`}
        aria-expanded={dropdown === label}
        onClick={(event) => {
          event.preventDefault();
          setDropdown((current) => current === label ? "" : label);
        }}
      >
        {label}
      </a>
      <ul className={`dropdown-menu dropdown-menu-dark${dropdown === label ? " show" : ""}`}>
        {entries.map(([text, to]) => (
          <li key={text}><Link className="dropdown-item" to={to}>{text}</Link></li>
        ))}
      </ul>
    </li>
  );

  return (
    <div className="ph-admin">
      <header ref={header}>
        <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/Admin/Database">Admin</Link>
            <button
              className="navbar-toggler"
              type="button"
              aria-controls="adminNavbar"
              aria-expanded={expanded}
              aria-label="Toggle navigation"
              onClick={() => setExpanded((current) => !current)}
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div className={`collapse navbar-collapse${expanded ? " show" : ""}`} id="adminNavbar">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                {navLink("Home", "/Home/Home")}
                {(["Holy", "Protection", "Retribution"] as const).map((section) =>
                  menu(`${section} Paladin`, sectionPages.map((page) => [page, `/${section}/${page}`] as const)),
                )}
                {navLink("Discussion", "/Discussion/Index")}
                {navLink("Privacy", "/Account/Privacy")}
              </ul>
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {navLink("Merchandise", "/Merchandise/Merchandise")}
                {navLink("Pages", "/Admin/PageBuilder/Create")}
                {navLink("Database", "/Admin/Database")}
                {navLink("Products", "/Merchandise/Merchandise")}
                {menu("Promo Codes", [["All", "/Admin/PromoCodes"], ["Create", "/Admin/PromoCodes/Create"]])}
                {navLink("Back to Site", "/Home/Home")}
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <div className="container mt-4">{children ?? <Outlet />}</div>

      <footer className="footer bg-dark text-light text-center py-2 mt-5">
        Admin Panel © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
