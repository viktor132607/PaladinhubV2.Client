import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import Providers from "./providers";
import {
  configuredSiteUrl,
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
} from "@/lib/seo-public";

import "../index.css";
import "../App.css";
import "../styles/v1-adapter.css";
import "../styles/v1-navbar-exact.css";
import "../styles/v1-source-corrections.css";
import "../styles/banners.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL(configuredSiteUrl()),
  title: DEFAULT_SEO_TITLE,
  description: DEFAULT_SEO_DESCRIPTION,
  icons: {
    icon: {
      url: "/images/WoW_icon.svg.png",
      type: "image/png",
    },
    shortcut: "/images/WoW_icon.svg.png",
    apple: "/images/WoW_icon.svg.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="wowhead-tooltip-options" strategy="beforeInteractive">
          {`const whTooltips = { colorLinks: false, iconizeLinks: false, renameLinks: false, hide: { extra: true } };`}
        </Script>
        <Script src="https://wow.zamimg.com/js/tooltips.js" strategy="afterInteractive" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
