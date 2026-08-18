
import type { ReactNode } from "react";
import AccountSideNav from "./AccountSideNav";

export type AccountLayoutProps = {
  children?: ReactNode;
  active?: string;
};

export default function AccountLayout({ children, active }: AccountLayoutProps) {
  return (
    <main id="acc" className="min-h-[calc(100vh-4rem)] bg-[#0f1216] px-4 py-8 text-[#e9ecef]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <AccountSideNav active={active} />
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
