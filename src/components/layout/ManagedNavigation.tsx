"use client";
import { useAuth } from "@/auth/AuthContext";
import { useEffect, useState } from "react";
import { useLocalization } from "@/localization/LocalizationContext";
import { Link, useLocation } from "@/router/nextCompat";
export type NavigationEntry = { id: number; name: string; href: string; location: string; openNewTab: boolean; parentId: number | null; sortOrder: number };
function NavAnchor({ item, className }: { item: NavigationEntry; className: string }) {
  const { t } = useLocalization();
  const props = { className, target: item.openNewTab ? "_blank" : undefined, rel: item.openNewTab ? "noopener noreferrer" : undefined, style: { overflowWrap: "anywhere" as const } };
  return /^https?:\/\//i.test(item.href) ? <a href={item.href} {...props}>{t(`navigation.${item.id}`, t(item.name))}</a> : <Link to={item.href} {...props}>{t(`navigation.${item.id}`, t(item.name))}</Link>;
}
function Menu({ item, children }: { item: NavigationEntry; children: NavigationEntry[] }) {
  const { t } = useLocalization();
  const { hasPermission } = useAuth();
  const canDelete = hasPermission("pages.delete");
  const canCreate = hasPermission("pages.create");
  const section = /^\/(Holy|Protection|Retribution)\/Overview$/i.exec(item.href)?.[1];
  const [open, setOpen] = useState(false); const { pathname } = useLocation();
  const currentPath = (pathname || "/").toLowerCase().replace(/\/+$/, "") || "/";
  const itemPath = item.href.toLowerCase().replace(/\/+$/, "") || "/";
  const sectionPath = section ? `/${section.toLowerCase()}/` : null;
  const isActive = !/^https?:\/\//i.test(item.href) && (
    currentPath === itemPath ||
    children.some(child => currentPath === (child.href.toLowerCase().replace(/\/+$/, "") || "/")) ||
    (sectionPath ? currentPath.startsWith(sectionPath) : false)
  );
  useEffect(() => setOpen(false), [pathname]);
  return <li className="nav-item dropdown" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
    <div className="d-flex align-items-center"><NavAnchor item={item} className={`nav-link${children.length ? " dropdown-toggle" : ""}${isActive ? " active" : ""}`} />
      {children.length ? <button type="button" className="nav-link border-0 bg-transparent ph-managed-submenu-toggle" style={{ minWidth: 44, minHeight: 44 }} aria-label={t("nav.submenu", "Toggle {name} submenu").replace("{name}", item.name)} aria-expanded={open} aria-controls={`managed-menu-${item.id}`} onClick={() => setOpen(v => !v)}><span className="ph-managed-submenu-caret" aria-hidden="true" /></button> : null}
    </div>
    {children.length ? <ul id={`managed-menu-${item.id}`} className={`dropdown-menu${open ? " show" : ""}`} aria-label={t("nav.submenuLabel", "{name} submenu").replace("{name}", item.name)}>
      {children.map(child => <li className="position-relative" key={child.id}><NavAnchor item={child} className={canDelete && section ? "dropdown-item pe-5" : "dropdown-item"} />
        {canDelete && section && child.href.startsWith(`/${section}/`) ? <Link className="text-danger position-absolute top-50 translate-middle-y" style={{ right: 12, textDecoration: "none" }} aria-label={t("page.deleteNamed", "Delete {name}").replace("{name}", child.name)} title={t("page.delete", "Delete page")} to={`/Admin/PageBuilder/DeleteConfirm?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(child.href.split("/")[2].toLowerCase())}`}>✕</Link> : null}
      </li>)}
      {canCreate && section ? <><li><hr className="dropdown-divider" /></li><li><Link className="dropdown-item" to={`/Admin/PageBuilder/Create?section=${encodeURIComponent(section)}`}>{t("page.add", "Add page")}</Link></li></> : null}
    </ul> : null}
  </li>;
}
export default function ManagedNavigation({ entries, location }: { entries: NavigationEntry[]; location: string }) {
  return <>{entries.filter(item => item.parentId === null && item.location === location).map(item => <Menu key={item.id} item={item} children={entries.filter(child => child.parentId === item.id)} />)}</>;
}
