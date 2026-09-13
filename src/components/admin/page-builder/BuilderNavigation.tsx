"use client";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { Link, useLocation } from "@/router/nextCompat";

export default function BuilderNavigation() {
  const { hasPermission } = useAuth();
  const { pathname } = useLocation();
  const links = [
    { label: "Page Builder", path: "/Admin/PageBuilder/Index", permission: adminPermissions.pages.read },
    { label: "Talent Tree Builder", path: "/Admin/PageBuilder/TalentTrees", permission: adminPermissions.talentTrees.read },
    { label: "History & recovery", path: "/Admin/PageBuilder/History", permission: adminPermissions.pages.read },
  ].filter((link) => hasPermission(link.permission));

  return (
    <nav aria-label="Page Builder tabs" className="mb-6 flex flex-wrap gap-2">
      {links.map(({ label, path }) => {
        const active = path.endsWith("/Index") ? pathname === "/Admin/PageBuilder" || pathname === path : pathname === path;
        return (
          <Link
            key={path}
            to={path}
            aria-current={active ? "page" : undefined}
            className={`rounded px-4 py-2 ${active ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-100"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
