"use client";
import { Link, useLocation } from "@/router/nextCompat";
export default function BuilderNavigation() {
  const { pathname } = useLocation();
  const talentBuilderActive = pathname === "/Admin/PageBuilder/TalentTrees";
  return (
    <nav aria-label="Page Builder tabs" className="mb-6 flex flex-wrap gap-2">
      {[
        ["Page Builder", "/Admin/PageBuilder/Index"],
        ["Talent Tree Builder", "/Admin/PageBuilder/TalentTrees"],
        ["History & recovery", "/Admin/PageBuilder/History"],
      ].map(([label, path]) => {
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
