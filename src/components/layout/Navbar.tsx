"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link } from "@/router/nextCompat";
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
  return (
    <li className="nav-item dropdown">
      <Link
        to={`/${section}/Overview`}
        className="nav-link dropdown-toggle"
        id={`${section.toLowerCase()}Dropdown`}
        role="button"
      >
        {label}
      </Link>

      <ul
        className="dropdown-menu"
        aria-labelledby={`${section.toLowerCase()}Dropdown`}
      >
        {guidePages.map(([title, slug]) => (
          <li className="position-relative" key={slug}>
            <Link
              to={`/${section}/${title}`}
              className="dropdown-item pe-5"
            >
              {title}
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

export default function Navbar() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = hasRole("Admin");

  useEffect(() => {
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
  }, []);

  return (
    <header>
      <nav className="navbar navbar-expand-sm navbar-toggleable-sm navbar-custom border-bottom box-shadow mb-3 ph-v1-navbar">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`navbar-collapse collapse d-sm-inline-flex justify-content-between${open ? " show" : ""}`}>
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/Home/Home" className="nav-link">Home</Link>
              </li>

              <GuideMenu label="Holy Paladin" section="Holy" isAdmin={isAdmin} />
              <GuideMenu label="Protection Paladin" section="Protection" isAdmin={isAdmin} />
              <GuideMenu label="Retribution Paladin" section="Retribution" isAdmin={isAdmin} />

              <li className="nav-item">
                <Link to="/Discussions/Index" className="nav-link">Discussion</Link>
              </li>

              {isAdmin ? (
                <li className="nav-item">
                  <Link to="/Admin/Database" className="nav-link">Database</Link>
                </li>
              ) : null}

              <li className="nav-item">
                <Link to="/Home/Privacy" className="nav-link">Privacy</Link>
              </li>
            </ul>

            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link to="/Merchandise/Merchandise" className="nav-link">
                  <i className="fa-solid fa-store" aria-hidden="true" /> Merchandise
                </Link>
              </li>

              <li id="nav-cart" className="nav-item position-relative">
                <Link
                  to="/Cart/MyCart"
                  title="My Cart"
                  aria-label="My Cart"
                  className="nav-link position-relative"
                >
                  <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                </Link>
              </li>

              <AuthMenu />
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
