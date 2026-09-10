"use client";
import { Link, useLocation } from "@/router/nextCompat";
export default function BuilderNavigation() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Page Builder tabs" className="mb-6 flex flex-wrap gap-2">
      {[
        ["Page Builder", "/Admin/PageBuilder/Index"],
        ["Talent Tree Builder", "/Admin/PageBuilder/TalentTrees"],
      ].map(([label, path]) => (
        <Link
          key={path}
          to={path}
          aria-current={pathname === path ? "page" : undefined}
          className={`rounded px-4 py-2 ${pathname === path ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-100"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
