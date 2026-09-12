"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useLocation } from "@/router/nextCompat";
import { fetchBackend, readApiJson } from "@/config/api";
import ManagedNavigation, { type NavigationEntry } from "./ManagedNavigation";
import { useLocalization, LanguagePicker } from "@/localization/LocalizationContext";
import AuthMenu from "./AuthMenu";

const guidePages = [
  ["Gear", "gear"],
  ["Talents", "talents"],
  ["Consumables", "consumables"],
  ["Rotation", "rotation"],
  ["Stats", "stats"],
] as const;

function GuideMenu({
  label,
  section,
  isAdmin,
}: {
  label: string;
  section: "Holy" | "Protection" | "Retribution";
  isAdmin: boolean;
}) {
  const { t } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setExpanded(false), [pathname]);
  return (
    <li className="nav-item dropdown">
      <Link
        to={`/${section}/Overview`}
        className="nav-link dropdown-toggle"
        id={`${section.toLowerCase()}Dropdown`}
        role="button"
        aria-expanded={expanded}
        onClick={(event) => {
          if (event.currentTarget.closest(".ph-admin") && window.matchMedia("(max-width: 1199.98px)").matches) {
            event.preventDefault();
            setExpanded((value) => !value);
          }
        }}
      >
        {t(label)}{" "}
      </Link>

      <ul
        className={`dropdown-menu${expanded ? " show" : ""}`}
        aria-labelledby={`${section.toLowerCase()}Dropdown`}
      >
        <li className="guide-mobile-overview"><Link to={`/${section}/Overview`} className="dropdown-item">{t("Overview")}</Link></li>
        {guidePages.map(([title, slug]) => (
          <li className="position-relative" key={slug}>
            <Link
              to={`/${section}/${title}`}
              className="dropdown-item pe-5"
            >
              {t(title)}
            </Link>

            {isAdmin ? (
              <Link
                className="text-danger position-absolute top-50 translate-middle-y"
                style={{ right: 12, textDecoration: "none" }}
                title="Delete page"
                aria-label={`Delete ${title}`}
                to={`/Admin/PageBuilder/DeleteConfirm?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(slug)}`}
              >
                ✕
              </Link>
            ) : null}
          </li>
        ))}

        {isAdmin ? (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <Link
                className="dropdown-item"
                to={`/Admin/PageBuilder/Create?section=${encodeURIComponent(section)}`}
              >
                <i className="fa-solid fa-plus" aria-hidden="true" /> Add page
              </Link>
            </li>
          </>
        ) : null}
      </ul>
    </li>
  );
}

export default function Navbar({ forceVisible = false }: { forceVisible?: boolean } = {}) {
  const { t } = useLocalization();
  const { hasRole } = useAuth();
  const [navigation, setNavigation] = useState<NavigationEntry[] | null>(null);
  useEffect(() => {
    let controller: AbortController | undefined;
    const refreshNavigation = () => {
      controller?.abort();
      const request = new AbortController(); controller = request;
      void fetchBackend("/api/navigation", { signal: request.signal, cache: "no-store" })
        .then(readApiJson<NavigationEntry[]>).then(entries => { if (!request.signal.aborted && Array.isArray(entries)) setNavigation(entries); }).catch(() => {});
    };
    refreshNavigation();
    window.addEventListener("navigation-updated", refreshNavigation);
    return () => { controller?.abort(); window.removeEventListener("navigation-updated", refreshNavigation); };
  }, []);
  const [open, setOpen] = useState(false);
  const isAdmin = hasRole("Admin");
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (forceVisible) return;

    const navbar = document.querySelector<HTMLElement>(".navbar-custom");
    if (!navbar) return;

    const updateNavbarVisibility = (mouseY: number) => {
      if (window.scrollY === 0 || mouseY <= 600) {
        navbar.style.setProperty("top", "0", "important");
      } else {
        navbar.style.setProperty("top", "-100px", "important");
      }
    };

    const onMouseMove = (event: MouseEvent) => updateNavbarVisibility(event.clientY);
    const onScroll = () => updateNavbarVisibility(999);

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);
    updateNavbarVisibility(999);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [forceVisible]);

  return (
    <header>
      <nav
        className={`navbar navbar-expand-sm navbar-toggleable-sm navbar-custom border-bottom box-shadow ph-v1-navbar ${forceVisible ? "mb-0" : "mb-3"}`}
        style={forceVisible ? { position: "relative", top: 0, left: 0, right: 0 } : undefined}
      >
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            aria-label={t("Toggle navigation")}
            aria-controls="primary-navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="navbar-toggler-icon" aria-hidden="true" />
          </button>

          <div id="primary-navigation" className={`navbar-collapse collapse d-sm-inline-flex justify-content-between${open ? " show" : ""}`}>
            <ul className="navbar-nav">
              {navigation !== null ? <ManagedNavigation isAdmin={isAdmin} entries={navigation} location="primary" /> : <>
              <li className="nav-item">
                <Link to="/Home/Home" className="nav-link">{t("Home")}</Link>
              </li>

              <GuideMenu label="Holy Paladin" section="Holy" isAdmin={isAdmin} />
              <GuideMenu label="Protection Paladin" section="Protection" isAdmin={isAdmin} />
              <GuideMenu label="Retribution Paladin" section="Retribution" isAdmin={isAdmin} />

              <li className="nav-item">
                <Link to="/Discussions/Index" className="nav-link">{t("Discussion")}</Link>
              </li>

              <li className="nav-item">
                <Link to="/Home/Privacy" className="nav-link">{t("Privacy")}</Link>
              </li>

              </>}
              {isAdmin ? (
                <li className="nav-item">
                  <Link to="/Admin/Database" className="nav-link">{t("Admin")}</Link>
                </li>
              ) : null}
            </ul>

            <ul className="navbar-nav ms-auto">
              {navigation !== null ? <ManagedNavigation isAdmin={isAdmin} entries={navigation} location="utility" /> : <>
              <li className="nav-item">
                <Link to="/Merchandise/Merchandise" className="nav-link">
                  <i className="fa-solid fa-store" aria-hidden="true" /> {t("Merchandise")}
                </Link>
              </li>

              </>}
              <li id="nav-cart" className="nav-item position-relative">
                <Link
                  to="/Cart/MyCart"
                  title={t("My Cart")}
                  aria-label={t("My Cart")}
                  className="nav-link position-relative"
                >
                  <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                </Link>
              </li>

              <LanguagePicker />
              <AuthMenu />
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
