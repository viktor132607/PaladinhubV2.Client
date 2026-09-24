"use client";

import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { Link } from "@/router/nextCompat";
import { useLocalization } from "@/localization/LocalizationContext";
import { ArrowRightIcon, CircleStackIcon, DocumentTextIcon, PhotoIcon, ShieldCheckIcon, ShoppingBagIcon, Squares2X2Icon, TagIcon, UserGroupIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

const cards = [
  { label: "Page Builder", to: "/Admin/PageBuilder", permission: adminPermissions.pages.read, icon: DocumentTextIcon, group: "Content" },
  { label: "Talent Tree Builder", to: "/Admin/PageBuilder/TalentTrees", permission: adminPermissions.talentTrees.read, icon: Squares2X2Icon, group: "Content" },
  { label: "SEO", to: "/Admin/Seo", permission: adminPermissions.seo.read, icon: WrenchScrewdriverIcon, group: "Content" },
  { label: "Database", to: "/Admin/Database", permission: adminPermissions.database.read, icon: CircleStackIcon, group: "Data" },
  { label: "Categories", to: "/Admin/Categories", permission: adminPermissions.categories.read, icon: TagIcon, group: "Data" },
  { label: "Media library", to: "/Admin/Media", permission: adminPermissions.media.read, icon: PhotoIcon, group: "Data" },
  { label: "Products", to: "/Merchandise/Merchandise", permission: adminPermissions.products.read, icon: ShoppingBagIcon, group: "Commerce" },
  { label: "Promo Codes", to: "/Admin/PromoCodes", permission: adminPermissions.promoCodes.read, icon: TagIcon, group: "Commerce" },
  { label: "Roles & permissions", to: "/Admin/Roles", permission: adminPermissions.roles.read, icon: ShieldCheckIcon, group: "Access" },
  { label: "Users & role assignments", to: "/Admin/Users", permission: adminPermissions.users.read, icon: UserGroupIcon, group: "Access" },
] as const;

export default function AdminHome() {
  const { t } = useLocalization();
  const { hasPermission } = useAuth();
  const visible = cards.filter((card) => hasPermission(card.permission));

  return (
    <div className="admin-home">
      <div className="admin-home-heading">
        <span className="admin-home-eyebrow">PaladinHub / {t("admin.panel")}</span>
        <h1>{t("admin.overview")}</h1>
        <p>{t("admin.overviewDescription")}</p>
      </div>
      {(["Content", "Data", "Commerce", "Access"] as const).map((group) => {
        const groupCards = visible.filter((card) => card.group === group);
        return groupCards.length ? (
          <section className="admin-home-section" key={group}>
            <h2>{t(group)}</h2>
            <div className="admin-home-grid">
              {groupCards.map((card) => (
                <Link className="admin-home-card" to={card.to} key={card.to}>
                  <span className="admin-home-card-icon"><card.icon aria-hidden="true" /></span>
                  <span className="admin-home-card-copy"><strong>{t(card.label)}</strong><small>{t("admin.openSection")}</small></span>
                  <ArrowRightIcon className="admin-home-card-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        ) : null;
      })}
      {!visible.length ? <div className="alert alert-warning">{t("admin.noSections")}</div> : null}
    </div>
  );
}
