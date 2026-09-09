import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";

import "../index.css";
import "../App.css";
import "../styles/v1-site.css";
import "../styles/v1-adapter.css";

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

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
