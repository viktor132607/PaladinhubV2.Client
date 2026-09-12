"use client";

import { useLocalization } from "@/localization/LocalizationContext";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Link, useNavigate } from "@/router/nextCompat";

export default function AuthMenu() {
  const { t } = useLocalization();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <li className="nav-item">
          <Link className="nav-link" to="/Account/Login">{t("Login")}</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link" to="/Account/Register">{t("Register")}</Link>
        </li>
      </>
    );
  }

  const displayName = user.fullName || user.email || user.username || "Account";
  const avatarSrc = user.avatarPath?.trim() || "/images/avatars/default01.png";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
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
          alt="Avatar"
          className="rounded-circle border"
          style={{ width: 28, height: 28, objectFit: "cover" }}
        />
        <span>{displayName}</span>
      </a>

      <ul
        className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}
        aria-labelledby="userMenu"
      >
        <li>
          <Link className="dropdown-item" to="/Account/MyAccount">{t("My Account")}</Link>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <Link className="dropdown-item" to="/Account/Settings">{t("Settings")}</Link>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <Link className="dropdown-item" to="/Account/ChangePassword">{t("Change Password")}</Link>
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
