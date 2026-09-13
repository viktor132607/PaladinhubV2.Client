import type { Metadata } from "next";
import AppEntry from "@/app/AppEntry";
import { getSeoSnapshot, metadataForPath } from "@/lib/seo-public";

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath(await getSeoSnapshot(), "/");
}

export default function Page() { return <AppEntry />; }
