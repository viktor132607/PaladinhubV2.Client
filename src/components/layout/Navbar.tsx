"use client";

import {
  BuildingStorefrontIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/solid";

import { useAuth } from "@/auth/AuthContext";
import { Link } from "@/router/nextCompat";
import AuthMenu from "./AuthMenu";

const guidePages = [
  "Gear",
  "Talents",
  "Consumables",
  "Rotation",
  "Stats",
];

function GuideMenu({
  label,
  section,
}: {
  label: string;
  section: string;
}) {
  return (
    <li className="nav-item dropdown">
      <Link
        to={`/${section}/Overview`}
        className="nav-link dropdown-toggle"
      >
        {label}
      </Link>

      <ul className="dropdown-menu">
        {guidePages.map((page) => (
          <li key={page}>
            <Link
              to={`/${section}/${page}`}
              className="dropdown-item"
            >
              {page}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Navbar() {
  const { hasRole } = useAuth();

  return (
    <header>
      <nav className="navbar navbar-expand-sm navbar-toggleable-sm navbar-custom border-bottom box-shadow mb-3 ph-v1-navbar">
        <div className="container-fluid">
          <div className="navbar-collapse collapse d-sm-inline-flex justify-content-between">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  Home
                </Link>
              </li>

              <GuideMenu
                label="Holy Paladin"
                section="Holy"
              />

              <GuideMenu
                label="Protection Paladin"
                section="Protection"
              />

              <GuideMenu
                label="Retribution Paladin"
                section="Retribution"
              />

              <li className="nav-item">
                <Link
                  to="/Discussions/Index"
                  className="nav-link"
                >
                  Discussion
                </Link>
              </li>

              {hasRole("Admin") && (
                <li className="nav-item">
                  <Link
                    to="/Admin/Database"
                    className="nav-link"
                  >
                    Database
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <Link
                  to="/Home/Privacy"
                  className="nav-link"
                >
                  Privacy
                </Link>
              </li>
            </ul>

            <div className="navbar-nav ms-auto">
              <div className="nav-item">
                <Link
                  to="/Merchandise/Merchandise"
                  className="nav-link"
                >
                  <BuildingStorefrontIcon
                    aria-hidden="true"
                    className="ph-v1-nav-icon"
                  />{" "}
                  Merchandise
                </Link>
              </div>

              <div className="nav-item position-relative">
                <Link
                  to="/Cart/MyCart"
                  title="My Cart"
                  aria-label="My Cart"
                  className="nav-link position-relative"
                >
                  <ShoppingCartIcon
                    aria-hidden="true"
                    className="ph-v1-nav-icon"
                  />
                </Link>
              </div>

              <AuthMenu />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}