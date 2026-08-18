import type { ReactNode } from "react";
import { Link, Outlet } from "@/router/nextCompat";

const links = [
  ["Database", "/Admin/Database"], ["Create Item", "/Admin/Items/Create"], ["Create Spell", "/Admin/Spells/Create"],
  ["Page Builder", "/Admin/PageBuilder/Create"], ["Promo Codes", "/Admin/PromoCodes"],
] as const;

export default function AdminLayout({ children }: { children?: ReactNode }) {
  return <section className="ph-admin"><header><h1>PaladinHub Admin</h1><nav>{links.map(([label,to]) => <Link key={to} to={to}>{label}</Link>)}</nav></header><div>{children ?? <Outlet />}</div></section>;
}
