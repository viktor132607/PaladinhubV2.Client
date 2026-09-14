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
  const { hasPermission } = useAuth();
  const canDelete = hasPermission("pages.delete");
  const canCreate = hasPermission("pages.create");
  const section = /^\/(Holy|Protection|Retribution)\/Overview$/i.exec(item.href)?.[1];
  const [open, setOpen] = useState(false); const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return <li className="nav-item dropdown" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
    <div className="d-flex align-items-center"><NavAnchor item={item} className="nav-link" />
      {children.length ? <button type="button" className="nav-link border-0 bg-transparent" style={{ minWidth: 44, minHeight: 44 }} aria-label={`Toggle ${item.name} submenu`} aria-expanded={open} aria-controls={`managed-menu-${item.id}`} onClick={() => setOpen(v => !v)}>▾</button> : null}
    </div>
    {children.length ? <ul id={`managed-menu-${item.id}`} className={`dropdown-menu${open ? " show" : ""}`} aria-label={`${item.name} submenu`}>
      {children.map(child => <li className="position-relative" key={child.id}><NavAnchor item={child} className={canDelete && section ? "dropdown-item pe-5" : "dropdown-item"} />
        {canDelete && section && child.href.startsWith(`/${section}/`) ? <Link className="text-danger position-absolute top-50 translate-middle-y" style={{ right: 12, textDecoration: "none" }} aria-label={`Delete ${child.name}`} title="Delete page" to={`/Admin/PageBuilder/DeleteConfirm?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(child.href.split("/")[2].toLowerCase())}`}>✕</Link> : null}
      </li>)}
      {canCreate && section ? <><li><hr className="dropdown-divider" /></li><li><Link className="dropdown-item" to={`/Admin/PageBuilder/Create?section=${encodeURIComponent(section)}`}>Add page</Link></li></> : null}
    </ul> : null}
  </li>;
}
export default function ManagedNavigation({ entries, location }: { entries: NavigationEntry[]; location: string }) {
  return <>{entries.filter(item => item.parentId === null && item.location === location).map(item => <Menu key={item.id} item={item} children={entries.filter(child => child.parentId === item.id)} />)}</>;
}
