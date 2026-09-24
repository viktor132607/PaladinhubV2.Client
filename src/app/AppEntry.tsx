"use client";
import App from "@/App";
export default function AppEntry({ initialPath = "/" }: { initialPath?: string }) {
  return <App initialPath={initialPath} />;
}
