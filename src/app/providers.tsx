"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/auth/AuthContext";
import TooltipLayer from "@/components/tooltips/TooltipLayer";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}<TooltipLayer /></AuthProvider>;
}
