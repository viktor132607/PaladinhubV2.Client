"use client";

import { useLocalization } from "@/localization/LocalizationContext";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useLocation, useNavigate } from "@/router/nextCompat";

export default function AuthMenu() {
  const { t } = useLocalization();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <>
        <li className="nav-item">
          <Link className="nav-link" to="/Account/Login">
            {t("auth.login", "Login")}
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/Account/Register">
            {t("auth.register", "Register")}
          </Link>
        </li>
      </>
    );
  }

  const displayName =
    user.fullName || user.email || user.username || t("auth.accountFallback", "Account");
  const avatarSrc = user.avatarPath?.trim() || "/images/avatars/default01.png";

  const handleLogout = async () => {
    const returnUrl = `${pathname}${search || ""}`;
    setLoggingOut(true);

    try {
      await logout();
      navigate(returnUrl || "/", { replace: true });
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <li className="nav-item dropdown">
      <a
        className="nav-link dropdown-toggle d-flex align-items-center gap-2"
        href="#"
        id="userMenu"
        role="button"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
      >
        <img
          src={avatarSrc}
          alt={t("auth.avatar", "Avatar")}
          className="rounded-circle border h-7 w-7 object-cover"
        />
        <span>{displayName}</span>
      </a>

      <ul
        className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}
        aria-labelledby="userMenu"
      >
        <li>
          <Link className="dropdown-item" to="/Account/MyAccount">
            {t("auth.account", "My Account")}
          </Link>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <Link className="dropdown-item" to="/Account/Settings">
            {t("auth.settings", "Settings")}
          </Link>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <Link className="dropdown-item" to="/Account/ChangePassword">
            {t("auth.password", "Change Password")}
          </Link>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li className="px-3">
          <button
            type="button"
            className="dropdown-item text-warning px-0"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {t(loggingOut ? "Logging out..." : "Logout")}
          </button>
        </li>
      </ul>
    </li>
  );
}
