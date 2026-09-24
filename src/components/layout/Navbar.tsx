"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useLocation } from "@/router/nextCompat";
import { fetchBackend, readApiJson } from "@/config/api";
import ManagedNavigation, { type NavigationEntry } from "./ManagedNavigation";
import { useLocalization } from "@/localization/LocalizationContext";
import { useCurrency } from "@/currency/CurrencyContext";
import AuthMenu from "./AuthMenu";
import MiniCart, { type MiniCartData } from "@/components/cart/MiniCart";

const guidePages = [
  ["Gear", "gear"],
  ["Talents", "talents"],
  ["Consumables", "consumables"],
  ["Rotation", "rotation"],
  ["Stats", "stats"],
] as const;

const CART_UPDATED_EVENT = "paladinhub:cart-updated";

function normalizedLanguageCode(code: string) {
  return code.toLowerCase().split("-")[0];
}

function LanguageFlag({ code }: { code: string }) {
  const normalizedCode = normalizedLanguageCode(code);
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 28,
        height: 18,
        flex: "0 0 28px",
        borderRadius: 2,
        verticalAlign: "middle",
        backgroundColor: "#2c2c2c",
        backgroundImage: `url(/images/flags/${normalizedCode}.webp)`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}

function CurrencyMenu() {
  const { currency, usdPerEur, rateDate, setCurrency } = useCurrency();
  return <li className="nav-item d-flex align-items-center">
    <label className="visually-hidden" htmlFor="site-currency">Currency</label>
    <select id="site-currency" className="ph-currency-select" value={currency} title={usdPerEur ? `ECB exchange rate ${rateDate}: 1 EUR = ${usdPerEur} USD. Card charges use the selected currency.` : "USD is unavailable until the exchange rate loads."} onChange={(event) => setCurrency(event.target.value as "EUR" | "USD")}>
      <option value="EUR">€ EUR</option>
      <option value="USD" disabled={!usdPerEur}>$ USD</option>
    </select>
  </li>;
}

function LanguageMenu() {
  const { t, language, languages, changeLanguage } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const currentCode = normalizedLanguageCode(language);
  const orderedLanguages = [...languages].sort((left, right) => {
    const leftCode = normalizedLanguageCode(left.code);
    const rightCode = normalizedLanguageCode(right.code);
    if (leftCode === "en" && rightCode !== "en") return -1;
    if (rightCode === "en" && leftCode !== "en") return 1;
    return left.name.localeCompare(right.name);
  });

  useEffect(() => {
    if (!expanded) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [expanded]);

  return (
    <li
      ref={rootRef}
      className="nav-item dropdown ms-2"
      style={{ position: "relative" }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button
        type="button"
        className="nav-link dropdown-toggle"
        aria-label={t("language.label", "Language")}
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
        style={{
          border: 0,
          outline: 0,
          boxShadow: "none",
          background: "transparent",
          cursor: "pointer",
          font: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <LanguageFlag code={currentCode} />
      </button>

      {expanded ? (
        <ul
          className="dropdown-menu dropdown-menu-end show"
          role="menu"
          style={{ minWidth: "100%", width: "100%" }}
        >
          {orderedLanguages.map(option => {
            const optionCode = normalizedLanguageCode(option.code);
            const selected = optionCode === currentCode;
            return (
              <li key={option.code}>
                <button
                  type="button"
                  role="menuitem"
                  aria-label={option.name}
                  aria-current={selected ? "true" : undefined}
                  title={option.name}
                  onClick={() => {
                    changeLanguage(option.code);
                    setExpanded(false);
                  }}
                  className="dropdown-item"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <LanguageFlag code={optionCode} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function GuideMenu({
  label,
  section,
}: {
  label: string;
  section: "Holy" | "Protection" | "Retribution";
}) {
  const { t } = useLocalization();
  const { hasPermission } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setExpanded(false), [pathname]);
  return (
    <li className="nav-item dropdown">
      <Link
        to={`/${section}/Overview`}
        className={`nav-link dropdown-toggle${pathname.toLowerCase().startsWith(`/${section.toLowerCase()}/`) ? " active" : ""}`}
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
        <li className="guide-mobile-overview"><Link to={`/${section}/Overview`} className="dropdown-item">{t("nav.overview", "Overview")}</Link></li>
        {guidePages.map(([title, slug]) => (
          <li className="position-relative" key={slug}>
            <Link
              to={`/${section}/${title}`}
              className="dropdown-item pe-5"
            >
              {t(title)}
            </Link>

            {hasPermission("pages.delete") ? (
              <Link
                className="text-danger position-absolute top-50 translate-middle-y"
                style={{ right: 12, textDecoration: "none" }}
                title={t("page.delete", "Delete page")}
                aria-label={t("page.deleteNamed", "Delete {name}").replace("{name}", t(title))}
                to={`/Admin/PageBuilder/DeleteConfirm?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(slug)}`}
              >
                ✕
              </Link>
            ) : null}
          </li>
        ))}

        {hasPermission("pages.create") ? (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <Link
                className="dropdown-item"
                to={`/Admin/PageBuilder/Create?section=${encodeURIComponent(section)}`}
              >
                <i className="fa-solid fa-plus" aria-hidden="true" /> {t("page.add", "Add page")}
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
  const { canAccessAdmin, loading: authLoading, user } = useAuth();
  const [navigation, setNavigation] = useState<NavigationEntry[] | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [miniCartActivated, setMiniCartActivated] = useState(false);
  const miniCartHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCartCount = useCallback(async () => {
    try {
      const response = await fetchBackend("/api/cart/CountJson", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await readApiJson<unknown>(response);
      const count = Number(payload);
      setCartCount(Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  const showMiniCart = useCallback(() => {
    if (miniCartHideTimerRef.current !== null) {
      clearTimeout(miniCartHideTimerRef.current);
      miniCartHideTimerRef.current = null;
    }

    setMiniCartActivated(true);
    setMiniCartOpen(true);
  }, []);

  const hideMiniCart = useCallback(() => {
    if (miniCartHideTimerRef.current !== null) {
      clearTimeout(miniCartHideTimerRef.current);
    }

    miniCartHideTimerRef.current = setTimeout(() => {
      setMiniCartOpen(false);
      miniCartHideTimerRef.current = null;
    }, 200);
  }, []);

  const handleMiniCartChanged = useCallback((data: MiniCartData) => {
    setCartCount(
      data.items.reduce(
        (sum, item) => sum + Math.max(0, Math.trunc(item.quantity)),
        0,
      ),
    );
  }, []);

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

  useEffect(() => {
    void refreshCartCount();

    const onCartUpdated = () => {
      void refreshCartCount();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        void refreshCartCount();
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshCartCount]);

  useEffect(() => {
    return () => {
      if (miniCartHideTimerRef.current !== null) {
        clearTimeout(miniCartHideTimerRef.current);
      }
    };
  }, []);

  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const normalizedPathname = (pathname || "/").toLowerCase().replace(/\/+$/, "") || "/";
  useEffect(() => {
    setOpen(false);
    setMiniCartOpen(false);
  }, [pathname]);

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
            aria-label={t("nav.toggle", "Toggle navigation")}
            aria-controls="primary-navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="navbar-toggler-icon" aria-hidden="true" />
          </button>

          <div id="primary-navigation" className={`navbar-collapse collapse d-sm-inline-flex justify-content-between${open ? " show" : ""}`}>
            <ul className="navbar-nav">
              {navigation !== null ? <ManagedNavigation entries={navigation.filter(item => !["/home/privacy", "/privacy"].includes(item.href.toLowerCase().replace(/\/+$/, "")))} location="primary" /> : <>
              <li className="nav-item">
                <Link to="/Home/Home" className={`nav-link${normalizedPathname === "/" || normalizedPathname === "/home/home" ? " active" : ""}`}>{t("nav.home", "Home")}</Link>
              </li>

              <GuideMenu label="Holy Paladin" section="Holy" />
              <GuideMenu label="Protection Paladin" section="Protection" />
              <GuideMenu label="Retribution Paladin" section="Retribution" />

              <li className="nav-item">
                <Link to="/Discussions/Index" className={`nav-link${normalizedPathname.startsWith("/discussions") ? " active" : ""}`}>{t("nav.discussion", "Discussion")}</Link>
              </li>

              </>}
              {canAccessAdmin ? (
                <li className="nav-item">
                  <Link to="/Admin" className={`nav-link${normalizedPathname.startsWith("/admin") ? " active" : ""}`}>{t("nav.admin", "Admin")}</Link>
                </li>
              ) : null}
            </ul>

            <ul className="navbar-nav ms-auto ph-collapsible-utility-nav">
              {navigation !== null ? <ManagedNavigation entries={navigation} location="utility" /> : <>
              <li className="nav-item">
                <Link to="/Merchandise/Merchandise" className={`nav-link${normalizedPathname.startsWith("/merchandise") ? " active" : ""}`}>
                  <i className="fa-solid fa-store" aria-hidden="true" /> {t("nav.merchandise", "Merchandise")}
                </Link>
              </li>

              </>}
            </ul>
          </div>

          <ul className="navbar-nav ph-navbar-actions">
              <CurrencyMenu />
              <li
                id="nav-cart"
                className="nav-item position-relative"
                onMouseEnter={showMiniCart}
                onMouseLeave={hideMiniCart}
              >
                <Link
                  to="/Cart/MyCart"
                  title={t("cart.mine", "My Cart")}
                  aria-label={t("cart.mine", "My Cart")}
                  className={`nav-link position-relative${normalizedPathname.startsWith("/cart") ? " active" : ""}`}
                >
                  <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                  <span
                    id="cart-badge"
                    className={`cart-badge${cartCount > 0 ? "" : " d-none"}`}
                  >
                    {cartCount}
                  </span>
                </Link>

                <div
                  id="mini-cart-panel"
                  className={`mini-cart-panel${miniCartOpen ? "" : " d-none"}`}
                  aria-hidden={!miniCartOpen}
                >
                  {miniCartActivated ? (
                    <MiniCart onChanged={handleMiniCartChanged} />
                  ) : (
                    <div className="p-3 text-center text-muted">Loading...</div>
                  )}
                </div>
              </li>

              {authLoading || !user ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/Account/Login">{t("auth.login", "Login")}</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/Account/Register">{t("auth.register", "Register")}</Link>
                  </li>
                </>
              ) : (
                <AuthMenu />
              )}

              <LanguageMenu />
            </ul>
        </div>
      </nav>
    </header>
  );
}
