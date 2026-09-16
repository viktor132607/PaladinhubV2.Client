import type { Metadata } from "next";
import AppEntry from "@/app/AppEntry";
import {
  getSeoSnapshot,
  metadataForPath,
  pathToStaticSlug,
} from "@/lib/seo-public";

const applicationStaticParams = [
  { slug: ["Home", "Home"] },
  { slug: ["Holy", "Overview"] },
  { slug: ["Holy", "Gear"] },
  { slug: ["Holy", "Talents"] },
  { slug: ["Holy", "Consumables"] },
  { slug: ["Holy", "Rotation"] },
  { slug: ["Holy", "Stats"] },
  { slug: ["Protection", "Overview"] },
  { slug: ["Protection", "Gear"] },
  { slug: ["Protection", "Talents"] },
  { slug: ["Protection", "Consumables"] },
  { slug: ["Protection", "Rotation"] },
  { slug: ["Protection", "Stats"] },
  { slug: ["Retribution", "Overview"] },
  { slug: ["Retribution", "Gear"] },
  { slug: ["Retribution", "Talents"] },
  { slug: ["Retribution", "Consumables"] },
  { slug: ["Retribution", "Rotation"] },
  { slug: ["Retribution", "Stats"] },
  { slug: ["Discussion", "Index"] },
  { slug: ["Discussions", "Index"] },
  { slug: ["Discussions", "Create"] },
  { slug: ["Discussions", "Details", "view"] },
  { slug: ["Merchandise", "Merchandise"] },
  { slug: ["Merchandise", "List"] },
  { slug: ["Products"] },
  { slug: ["Products", "Create"] },
  { slug: ["Cart", "MyCart"] },
  { slug: ["Cart", "Archive"] },
  { slug: ["Checkout", "Start"] },
  { slug: ["Checkout", "Shipping"] },
  { slug: ["Checkout", "Payment"] },
  { slug: ["Checkout", "Card"] },
  { slug: ["Checkout", "Review"] },
  { slug: ["Checkout", "Registered"] },
  { slug: ["Checkout", "Success"] },
  { slug: ["Checkout", "Failure"] },
  { slug: ["Account", "Login"] },
  { slug: ["Account", "Register"] },
  { slug: ["Account", "ForgotPassword"] },
  { slug: ["Account", "ResetPassword"] },
  { slug: ["Account", "MyAccount"] },
  { slug: ["Account", "AccountDetails"] },
  { slug: ["Account", "ChangePassword"] },
  { slug: ["Account", "Connections"] },
  { slug: ["Account", "Enable2FA"] },
  { slug: ["Account", "PaymentMethods"] },
  { slug: ["Account", "AddPaymentMethod"] },
  { slug: ["Account", "Privacy"] },
  { slug: ["Account", "Security"] },
  { slug: ["Account", "Settings"] },
  { slug: ["Account", "TransactionHistory"] },
  { slug: ["Account", "LoginWith2fa"] },
  { slug: ["Account", "RecoveryCodeLogin"] },
  { slug: ["Account", "VerifyEmail"] },
  { slug: ["Account", "ShowRecoveryCodes"] },
  { slug: ["Home", "Privacy"] },
  { slug: ["Home", "ThanksForPurchasing"] },
  { slug: ["Admin", "Database"] },
  { slug: ["Admin", "Categories"] },
  { slug: ["Admin", "Classes"] },
  { slug: ["Admin", "Tags"] },
  { slug: ["Admin", "Patches"] },
  { slug: ["Admin", "Rarities"] },
  { slug: ["Admin", "Media"] },
  { slug: ["Admin", "Seo"] },
  { slug: ["Admin", "Navigation"] },
  { slug: ["Admin", "Translations"] },
  { slug: ["Admin", "Banners"] },
  { slug: ["Admin", "Footer"] },
  { slug: ["Admin", "Roles"] },
  { slug: ["Admin", "Users"] },
  { slug: ["Admin", "PageBuilder", "History"] },
  { slug: ["Admin", "Database", "Index"] },
  { slug: ["Admin", "Items", "Create"] },
  { slug: ["Admin", "Spells", "Create"] },
  { slug: ["Admin", "PageBuilder", "Create"] },
  { slug: ["Admin", "PageBuilder", "TalentTrees"] },
  { slug: ["Admin", "PageBuilder", "Edit"] },
  { slug: ["Admin", "PageBuilder", "DeleteConfirm"] },
  { slug: ["Admin", "PageBuilder", "Delete"] },
  { slug: ["Admin", "Products", "Create"] },
  { slug: ["Admin", "PromoCodes"] },
  { slug: ["Admin", "PromoCodes", "Index"] },
  { slug: ["Admin", "PromoCodes", "Create"] },
  { slug: ["Error", "403"] },
  { slug: ["Error", "404"] },
  { slug: ["Error", "500"] },
  { slug: ["login"] },
  { slug: ["register"] },
  { slug: ["account"] },
  { slug: ["cart"] },
  { slug: ["checkout"] },
  { slug: ["products"] },
  { slug: ["discussions"] },
  { slug: ["privacy"] },
  { slug: ["admin"] },
];

export async function generateStaticParams(): Promise<Array<{ slug: string[] }>> {
  const snapshot = await getSeoSnapshot();
  const result = applicationStaticParams.map(item => ({ slug: [...item.slug] }));
  const seen = new Set(result.map(item => item.slug.join("/").toLowerCase()));

  for (const path of [...snapshot.staticRoutes, ...snapshot.pages.map(page => page.path)]) {
    const slug = pathToStaticSlug(path);
    if (!slug?.length) continue;
    const key = slug.join("/").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ slug });
  }

  return result;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const requestedPath = `/${slug.join("/")}`;
  return metadataForPath(await getSeoSnapshot(), requestedPath);
}

export default function Page() { return <AppEntry />; }
