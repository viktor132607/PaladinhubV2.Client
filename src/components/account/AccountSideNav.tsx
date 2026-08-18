
import { NavLink } from "@/router/nextCompat";

export type AccountSideNavProps = {
  active?: string;
};

const links = [
  ["Overview", "/account", "Account Overview"],
  ["Security", "/account/security", "Security"],
  ["Privacy", "/account/privacy", "Privacy & Communication"],
  ["Connections", "/account/connections", "Connections"],
  ["PaymentMethods", "/account/payment-methods", "Payment Methods"],
  ["TransactionHistory", "/account/transactions", "Transaction History"],
] as const;

export default function AccountSideNav({ active }: AccountSideNavProps) {
  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      <div className="rounded-xl border border-[#313a45] bg-[#1a1f24] p-3 shadow-xl">
        <nav className="flex flex-col gap-1" aria-label="Account navigation">
          {links.map(([key, to, label]) => (
            <NavLink
              key={key}
              to={to}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3 py-2.5 text-sm font-medium text-[#e9ecef] transition hover:bg-[#20262d]",
                  isActive || active === key ? "bg-[#20262d]" : "",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
