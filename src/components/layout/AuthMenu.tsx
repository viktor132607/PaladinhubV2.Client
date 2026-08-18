"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";

const navLinkClass =
  "flex items-center gap-2 px-2 py-2 text-[1.1rem] font-bold " +
  "text-[#FFD700] no-underline transition-[color,text-shadow] duration-300 " +
  "hover:text-[#FFC300] hover:[text-shadow:0_0_4px_#FFD700]";

const dropdownLinkClass =
  "block w-full whitespace-nowrap px-4 py-1 text-left font-bold " +
  "text-[#FFD700] no-underline transition-colors duration-300 " +
  "hover:bg-[#FFD700] hover:text-[#1e1e1e] hover:[text-shadow:none]";

export default function AuthMenu() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex items-center">
        <Link
          to="/Account/Login"
          className={navLinkClass}
        >
          Login
        </Link>

        <Link
          to="/Account/Register"
          className={navLinkClass}
        >
          Register
        </Link>
      </div>
    );
  }

  const displayName =
    user.fullName ||
    user.email ||
    user.username ||
    "Account";

  const avatarSrc =
    user.avatarPath?.trim() ||
    "/images/avatars/default01.png";

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <details className="group relative">
      <summary
        className={`
          ${navLinkClass}
          cursor-pointer list-none
          [&::-webkit-details-marker]:hidden
        `}
      >
        <img
          src={avatarSrc}
          alt="Avatar"
          className="
            h-7 w-7 rounded-full
            border border-[#dee2e6]
            object-cover
          "
        />

        <span>{displayName}</span>

        <ChevronDownIcon
          aria-hidden="true"
          className="h-3 w-3"
        />
      </summary>

      <div
        className="
          absolute right-0 top-full z-50
          min-w-[190px]
          border border-[#FFD700]
          bg-[#2c2c2c]
          py-2
        "
      >
        <Link
          to="/Account/MyAccount"
          className={dropdownLinkClass}
        >
          My Account
        </Link>

        <div className="my-2 border-t border-[#555]" />

        <Link
          to="/Account/Settings"
          className={dropdownLinkClass}
        >
          Settings
        </Link>

        <div className="my-2 border-t border-[#555]" />

        <Link
          to="/Account/ChangePassword"
          className={dropdownLinkClass}
        >
          Change Password
        </Link>

        <div className="my-2 border-t border-[#555]" />

        <div className="px-4">
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="
              w-full cursor-pointer border-0
              bg-transparent py-1 text-left
              font-bold text-[#FFD700]
              disabled:cursor-wait disabled:opacity-60
            "
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </details>
  );
}