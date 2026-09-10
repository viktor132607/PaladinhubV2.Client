"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "@/router/nextCompat";
import Navbar from "@/components/layout/Navbar";

export default function AdminLayout({ children }: { children?: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [dropdown, setDropdown] = useState("");
  const { pathname } = useLocation();
  const header = useRef<HTMLElement>(null);

  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const fullWidthWorkspace = normalizedPath === "/admin/pagebuilder/talenttrees";

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

  const navLink = (label: string, to: string) => (
    <li className="nav-item" key={label}>
      <Link className="nav-link" to={to}>{label}</Link>
    </li>
  );

  const promoMenu = (
    <li
      className="nav-item dropdown"
      onKeyDown={(event) => {
        if (event.key === "Escape") setDropdown("");
      }}
    >
      <a
        href="#"
        role="button"
        className={`nav-link dropdown-toggle${normalizedPath.includes("promocodes") ? " active" : ""}`}
        aria-expanded={dropdown === "Promo Codes"}
        onClick={(event) => {
          event.preventDefault();
          setDropdown((current) => current === "Promo Codes" ? "" : "Promo Codes");
        }}
      >
        Promo Codes
      </a>
      <ul className={`dropdown-menu dropdown-menu-dark${dropdown === "Promo Codes" ? " show" : ""}`}>
        <li><Link className="dropdown-item" to="/Admin/PromoCodes">All</Link></li>
        <li><Link className="dropdown-item" to="/Admin/PromoCodes/Create">Create</Link></li>
      </ul>
    </li>
  );

  return (
    <div className="ph-admin min-vh-100">
      <Navbar />

      <header ref={header} className="admin-secondary-nav">
        <nav className="navbar navbar-expand-sm navbar-dark bg-dark border-top border-secondary">
          <div className="container-fluid justify-content-center">
            <button
              className="navbar-toggler"
              type="button"
              aria-controls="adminSecondaryNavbar"
              aria-expanded={expanded}
              aria-label="Toggle admin navigation"
              onClick={() => setExpanded((current) => !current)}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div
              className={`collapse navbar-collapse justify-content-center flex-grow-0${expanded ? " show" : ""}`}
              id="adminSecondaryNavbar"
            >
              <ul className="navbar-nav align-items-sm-center justify-content-center gap-sm-2">
                {navLink("Pages", "/Admin/PageBuilder")}
                {navLink("Talent Trees", "/Admin/PageBuilder/TalentTrees")}
                {navLink("Database", "/Admin/Database")}
                {navLink("Products", "/Merchandise/Merchandise")}
                {promoMenu}
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {fullWidthWorkspace ? (
        <div className="w-100">{children ?? <Outlet />}</div>
      ) : (
        <div className="container mt-4">{children ?? <Outlet />}</div>
      )}

      {!fullWidthWorkspace ? (
        <footer className="footer bg-dark text-light text-center py-2 mt-5">
          Admin Panel © {new Date().getFullYear()}
        </footer>
      ) : null}
    </div>
  );
}
