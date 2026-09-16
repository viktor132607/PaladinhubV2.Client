import { Link } from "@/router/nextCompat";
import s from "./account.module.css";
const links = [
  [
    "Overview",
    "MyAccount",
    "Account Overview",
    "M3 10 12 3l9 7v11h-6v-7H9v7H3z",
  ],
  [
    "Details",
    "AccountDetails",
    "Account Details",
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a8 8 0 0 1 16 0v2",
  ],
  ["Security", "Security", "Security", "M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7z"],
  [
    "Privacy",
    "Privacy",
    "Privacy & Communication",
    "M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3",
  ],
  [
    "PaymentMethods",
    "PaymentMethods",
    "Payment Methods",
    "M3 5h18v14H3zM3 10h18M6 15h4",
  ],
  [
    "TransactionHistory",
    "TransactionHistory",
    "Transaction History",
    "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h6",
  ],
] as const;
export default function AccountSideNav({ active }: { active?: string }) {
  return (
    <nav className={s.nav} aria-label="Account navigation">
      {links.map(([key, path, label, d]) => (
        <Link
          key={key}
          to={`/Account/${path}`}
          aria-current={active === key ? "page" : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d={d} />
          </svg>
          {label}
        </Link>
      ))}
    </nav>
  );
}
