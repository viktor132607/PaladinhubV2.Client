"use client";

import {
  BuildingStorefrontIcon,
  ChevronDownIcon,
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

const navLinkClass =
  "flex items-center gap-1 px-2 py-2 text-[1.1rem] font-bold " +
  "text-[#FFD700] no-underline transition-[color,text-shadow] duration-300 " +
  "hover:text-[#FFC300] hover:[text-shadow:0_0_4px_#FFD700]";

const dropdownLinkClass =
  "block whitespace-nowrap px-4 py-1 font-bold text-[#FFD700] no-underline " +
  "transition-colors duration-300 hover:bg-[#FFD700] hover:text-[#1e1e1e] " +
  "hover:[text-shadow:none]";

function GuideMenu({
  label,
  section,
}: {
  label: string;
  section: string;
}) {
  return (
    <div className="group relative">
      <Link
        to={`/${section}/Overview`}
        className={navLinkClass}
      >
        <span>{label}</span>

        <ChevronDownIcon
          aria-hidden="true"
          className="h-3 w-3"
        />
      </Link>

      <div
        className="
          invisible absolute left-0 top-full z-50
          min-w-[160px]
          border border-[#FFD700]
          bg-[#2c2c2c]
          py-2
          opacity-0
          transition-opacity duration-150
          group-hover:visible group-hover:opacity-100
        "
      >
        {guidePages.map((page) => (
          <Link
            key={page}
            to={`/${section}/${page}`}
            className={dropdownLinkClass}
          >
            {page}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { hasRole } = useAuth();

  return (
    <header
      className="
        fixed inset-x-0 top-0 z-[1000]
        border-b-2 border-[#FFD700]
        bg-[#1e1e1e]
        px-4 py-2
      "
    >
      <nav
        aria-label="Main navigation"
        className="flex w-full items-center px-3"
      >
        <div className="flex items-center">
          <Link to="/" className={navLinkClass}>
            Home
          </Link>

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

          <Link
            to="/Discussions/Index"
            className={navLinkClass}
          >
            Discussion
          </Link>

          {hasRole("Admin") && (
            <Link
              to="/Admin/Database"
              className={navLinkClass}
            >
              Database
            </Link>
          )}

          <Link
            to="/Home/Privacy"
            className={navLinkClass}
          >
            Privacy
          </Link>
        </div>

        <div className="ml-auto flex items-center">
          <Link
            to="/Merchandise/Merchandise"
            className={navLinkClass}
          >
            <BuildingStorefrontIcon
              aria-hidden="true"
              className="h-4 w-4"
            />

            <span>Merchandise</span>
          </Link>

          <Link
            to="/Cart/MyCart"
            title="My Cart"
            aria-label="My Cart"
            className={`${navLinkClass} relative`}
          >
            <ShoppingCartIcon
              aria-hidden="true"
              className="h-5 w-5"
            />
          </Link>

          <AuthMenu />
        </div>
      </nav>
    </header>
  );
}