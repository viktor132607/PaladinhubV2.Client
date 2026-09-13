import type { MetadataRoute } from "next";
import { configuredSiteUrl } from "@/lib/seo-public";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = configuredSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/Admin",
        "/admin",
        "/Account",
        "/account",
        "/login",
        "/register",
        "/Cart",
        "/cart",
        "/Checkout",
        "/checkout",
        "/Products/Add",
        "/Products/Create",
        "/Products/Edit",
        "/Home/ThanksForPurchasing",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
