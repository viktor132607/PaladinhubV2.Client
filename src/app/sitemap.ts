import type { MetadataRoute } from "next";
import {
  configuredSiteUrl,
  getSeoSnapshot,
  resolveEffectiveSeo,
} from "@/lib/seo-public";

export const dynamic = "force-static";

function pageUrl(siteUrl: string, path: string): string {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await getSeoSnapshot();
  const siteUrl = configuredSiteUrl();
  const paths = new Map<string, string>();

  for (const path of snapshot.staticRoutes) {
    paths.set(path.toLowerCase(), path);
  }
  for (const page of snapshot.pages) {
    paths.set(page.path.toLowerCase(), page.path);
  }

  return [...paths.values()]
    .map(path => resolveEffectiveSeo(snapshot, path))
    .filter(seo => seo.isPublic && seo.index)
    .map(seo => ({
      url: pageUrl(siteUrl, seo.path),
      changeFrequency: seo.path === "/" ? "weekly" as const : "monthly" as const,
      priority: seo.path === "/" ? 1 : 0.7,
    }));
}
