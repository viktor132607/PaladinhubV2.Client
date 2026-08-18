import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";

import "../index.css";
import "../App.css";

export const metadata: Metadata = {
  title: "PaladinHub",
  description:
    "World of Warcraft Paladin guides, builds, discussions and merchandise.",
  icons: {
    icon: "/favicon.ico",
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