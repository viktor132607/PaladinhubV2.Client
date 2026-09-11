import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";

import "../index.css";
import "../App.css";
import "../styles/v1-adapter.css";
import "../styles/v1-navbar-exact.css";
import "../styles/v1-source-corrections.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  title: "PaladinHub",
  description:
    "World of Warcraft Paladin guides, builds, discussions and merchandise.",
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
