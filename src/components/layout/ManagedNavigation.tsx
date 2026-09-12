"use client";
import { useEffect, useState } from "react";
import { Link, useLocation } from "@/router/nextCompat";
export type NavigationEntry = { id: number; name: string; href: string; location: string; openNewTab: boolean; parentId: number | null; sortOrder: number };
function NavAnchor({ item, className }: { item: NavigationEntry; className: string }) {
  const props = { className, target: item.openNewTab ? "_blank" : undefined, rel: item.openNewTab ? "noopener noreferrer" : undefined, style: { overflowWrap: "anywhere" as const } };
  return /^https?:\/\//i.test(item.href) ? <a href={item.href} {...props}>{item.name}</a> : <Link to={item.href} {...props}>{item.name}</Link>;
}
function Menu({ item, children, isAdmin }: { item: NavigationEntry; children: NavigationEntry[]; isAdmin: boolean }) {
  const section = /^\/(Holy|Protection|Retribution)\/Overview$/i.exec(item.href)?.[1];
  const [open, setOpen] = useState(false); const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return <li className="nav-item dropdown" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
    <div className="d-flex align-items-center"><NavAnchor item={item} className="nav-link" />
      {children.length ? <button type="button" className="nav-link border-0 bg-transparent" style={{ minWidth: 44, minHeight: 44 }} aria-label={`Toggle ${item.name} submenu`} aria-expanded={open} aria-controls={`managed-menu-${item.id}`} onClick={() => setOpen(v => !v)}>▾</button> : null}
    </div>
    {children.length ? <ul id={`managed-menu-${item.id}`} className={`dropdown-menu${open ? " show" : ""}`} aria-label={`${item.name} submenu`}>
      {children.map(child => <li className="position-relative" key={child.id}><NavAnchor item={child} className={isAdmin && section ? "dropdown-item pe-5" : "dropdown-item"} />
        {isAdmin && section && child.href.startsWith(`/${section}/`) ? <Link className="text-danger position-absolute top-50 translate-middle-y" style={{ right: 12, textDecoration: "none" }} aria-label={`Delete ${child.name}`} title="Delete page" to={`/Admin/PageBuilder/DeleteConfirm?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(child.href.split("/")[2].toLowerCase())}`}>✕</Link> : null}
      </li>)}
      {isAdmin && section ? <><li><hr className="dropdown-divider" /></li><li><Link className="dropdown-item" to={`/Admin/PageBuilder/Create?section=${encodeURIComponent(section)}`}>Add page</Link></li></> : null}
    </ul> : null}
  </li>;
}
export default function ManagedNavigation({ entries, location, isAdmin = false }: { entries: NavigationEntry[]; location: string; isAdmin?: boolean }) {
  return <>{entries.filter(item => item.parentId === null && item.location === location).map(item => <Menu key={item.id} item={item} isAdmin={isAdmin} children={entries.filter(child => child.parentId === item.id)} />)}</>;
}
