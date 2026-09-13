"use client";

import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { Link } from "@/router/nextCompat";

const cards = [
  { label: "Page Builder", to: "/Admin/PageBuilder", permission: adminPermissions.pages.read },
  { label: "Talent Trees", to: "/Admin/PageBuilder/TalentTrees", permission: adminPermissions.talentTrees.read },
  { label: "SEO", to: "/Admin/Seo", permission: adminPermissions.seo.read },
  { label: "Database", to: "/Admin/Database", permission: adminPermissions.database.read },
  { label: "Categories", to: "/Admin/Categories", permission: adminPermissions.categories.read },
  { label: "Media", to: "/Admin/Media", permission: adminPermissions.media.read },
  { label: "Products", to: "/Merchandise/Merchandise", permission: adminPermissions.products.read },
  { label: "Promo Codes", to: "/Admin/PromoCodes", permission: adminPermissions.promoCodes.read },
  { label: "Roles & permissions", to: "/Admin/Roles", permission: adminPermissions.roles.read },
  { label: "Users & role assignments", to: "/Admin/Users", permission: adminPermissions.users.read },
] as const;

export default function AdminHome() {
  const { hasPermission } = useAuth();
  const visible = cards.filter((card) => hasPermission(card.permission));

  return (
    <div className="container-fluid py-3">
      <h1 className="h3 mb-1">Administration</h1>
      <p className="text-muted mb-4">Only sections allowed by your current effective permissions are shown.</p>
      <div className="row g-3">
        {visible.map((card) => (
          <div className="col-12 col-sm-6 col-xl-4" key={card.to}>
            <Link className="card card-body h-100 text-decoration-none" to={card.to}>
              <strong>{card.label}</strong>
              <span className="text-muted small mt-1">Open administration section</span>
            </Link>
          </div>
        ))}
        {!visible.length ? <div className="col-12"><div className="alert alert-warning mb-0">Your account has administrative permissions, but none of the current dashboard sections are directly navigable.</div></div> : null}
      </div>
    </div>
  );
}
