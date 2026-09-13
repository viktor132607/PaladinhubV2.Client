import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://paladinhubv2-client.onrender.com";
const DEFAULT_API_URL = "http://localhost:10000";
export const DEFAULT_SEO_TITLE = "PaladinHub";
export const DEFAULT_SEO_DESCRIPTION =
  "World of Warcraft Paladin guides, builds, discussions and merchandise.";

const FALLBACK_STATIC_ROUTES = [
  "/",
  "/Holy/Overview",
  "/Holy/Gear",
  "/Holy/Talents",
  "/Holy/Consumables",
  "/Holy/Rotation",
  "/Holy/Stats",
  "/Protection/Overview",
  "/Protection/Gear",
  "/Protection/Talents",
  "/Protection/Consumables",
  "/Protection/Rotation",
  "/Protection/Stats",
  "/Retribution/Overview",
  "/Retribution/Gear",
  "/Retribution/Talents",
  "/Retribution/Consumables",
  "/Retribution/Rotation",
  "/Retribution/Stats",
  "/discussions",
  "/products",
  "/privacy",
] as const;

const STATIC_ALIASES: Record<string, string> = {
  "/home/home": "/",
  "/discussion/index": "/discussions",
  "/discussions/index": "/discussions",
  "/merchandise/merchandise": "/products",
  "/merchandise/list": "/products",
  "/home/privacy": "/privacy",
};

export type SeoPublicEntry = {
  id: string;
  version: number;
  pageId: number | null;
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  socialTitle: string;
  socialDescription: string;
  imageUrl: string;
  index: boolean | null;
  follow: boolean | null;
};

export type SeoPublicPage = {
  id: number;
  title: string;
  path: string;
};

export type SeoPublicSnapshot = {
  siteUrl: string;
  registryVersion: string;
  snapshotVersion: string;
  generatedAtUtc: string;
  staticRoutes: string[];
  pages: SeoPublicPage[];
  entries: SeoPublicEntry[];
};

export type EffectiveSeo = {
  isPublic: boolean;
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  socialTitle: string;
  socialDescription: string;
  imageUrl: string;
  index: boolean;
  follow: boolean;
};

function normalizeOrigin(value?: string | null): string {
  if (!value?.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (!url.hostname || url.username || url.password) return "";
    return url.origin.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function configuredSiteUrl(): string {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) || DEFAULT_SITE_URL;
}

function configuredApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL)
    .replace(/\/api\/?$/i, "")
    .replace(/\/+$/, "");
}

function normalizePath(value: string): string {
  const rawPath = value.split(/[?#]/, 1)[0]?.trim() || "/";
  const withSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const collapsed = withSlash.replace(/\/{2,}/g, "/");
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : "/";
}

function fallbackSnapshot(): SeoPublicSnapshot {
  return {
    siteUrl: configuredSiteUrl(),
    registryVersion: "fallback-client-routes",
    snapshotVersion: "fallback",
    generatedAtUtc: new Date(0).toISOString(),
    staticRoutes: [...FALLBACK_STATIC_ROUTES],
    pages: [],
    entries: [],
  };
}

function isSnapshot(value: unknown): value is SeoPublicSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SeoPublicSnapshot>;
  return Array.isArray(candidate.staticRoutes) &&
    Array.isArray(candidate.pages) &&
    Array.isArray(candidate.entries);
}

let snapshotPromise: Promise<SeoPublicSnapshot> | null = null;

export function resetSeoSnapshotCacheForTests(): void {
  snapshotPromise = null;
}

export async function getSeoSnapshot(): Promise<SeoPublicSnapshot> {
  if (snapshotPromise) return snapshotPromise;

  snapshotPromise = (async () => {
    try {
      const response = await fetch(`${configuredApiUrl()}/api/seo/snapshot`, {
        headers: { Accept: "application/json" },
        cache: "force-cache",
      });
      if (!response.ok) return fallbackSnapshot();

      const payload: unknown = await response.json();
      if (!isSnapshot(payload)) return fallbackSnapshot();

      return {
        ...payload,
        siteUrl: normalizeOrigin(payload.siteUrl) || configuredSiteUrl(),
        staticRoutes: payload.staticRoutes.map(normalizePath),
        pages: payload.pages.map(page => ({ ...page, path: normalizePath(page.path) })),
        entries: payload.entries.map(entry => ({ ...entry, path: normalizePath(entry.path) })),
      };
    } catch {
      return fallbackSnapshot();
    }
  })();

  return snapshotPromise;
}

function siteUrlFor(snapshot: SeoPublicSnapshot): string {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeOrigin(snapshot.siteUrl) ||
    DEFAULT_SITE_URL;
}

export function canonicalPublicPath(
  snapshot: SeoPublicSnapshot,
  requestedPath: string,
): string | null {
  const normalized = normalizePath(requestedPath);
  const aliased = STATIC_ALIASES[normalized.toLowerCase()] ?? normalized;
  const target = aliased.toLowerCase();

  const staticRoute = snapshot.staticRoutes.find(route =>
    normalizePath(route).toLowerCase() === target);
  if (staticRoute) return normalizePath(staticRoute);

  const page = snapshot.pages.find(item =>
    normalizePath(item.path).toLowerCase() === target);
  return page ? normalizePath(page.path) : null;
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function absolutePageUrl(siteUrl: string, path: string): string {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export function resolveEffectiveSeo(
  snapshot: SeoPublicSnapshot,
  requestedPath: string,
): EffectiveSeo {
  const publicPath = canonicalPublicPath(snapshot, requestedPath);
  if (!publicPath) {
    return {
      isPublic: false,
      path: normalizePath(requestedPath),
      title: DEFAULT_SEO_TITLE,
      description: DEFAULT_SEO_DESCRIPTION,
      canonicalUrl: "",
      socialTitle: DEFAULT_SEO_TITLE,
      socialDescription: DEFAULT_SEO_DESCRIPTION,
      imageUrl: "",
      index: false,
      follow: false,
    };
  }

  const globalEntry = snapshot.entries.find(entry => entry.path === "*");
  const specificEntry = snapshot.entries.find(entry =>
    normalizePath(entry.path).toLowerCase() === publicPath.toLowerCase());

  const title = firstText(
    specificEntry?.title,
    globalEntry?.title,
    DEFAULT_SEO_TITLE,
  );
  const description = firstText(
    specificEntry?.description,
    globalEntry?.description,
    DEFAULT_SEO_DESCRIPTION,
  );
  const socialTitle = firstText(
    specificEntry?.socialTitle,
    specificEntry?.title,
    globalEntry?.socialTitle,
    globalEntry?.title,
    title,
  );
  const socialDescription = firstText(
    specificEntry?.socialDescription,
    specificEntry?.description,
    globalEntry?.socialDescription,
    globalEntry?.description,
    description,
  );
  const imageUrl = firstText(specificEntry?.imageUrl, globalEntry?.imageUrl);
  const siteUrl = siteUrlFor(snapshot);

  return {
    isPublic: true,
    path: publicPath,
    title,
    description,
    canonicalUrl: firstText(
      specificEntry?.canonicalUrl,
      absolutePageUrl(siteUrl, publicPath),
    ),
    socialTitle,
    socialDescription,
    imageUrl,
    index: specificEntry?.index ?? globalEntry?.index ?? true,
    follow: specificEntry?.follow ?? globalEntry?.follow ?? true,
  };
}

export function metadataForPath(
  snapshot: SeoPublicSnapshot,
  requestedPath: string,
): Metadata {
  const seo = resolveEffectiveSeo(snapshot, requestedPath);
  if (!seo.isPublic) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    robots: {
      index: seo.index,
      follow: seo.follow,
    },
    openGraph: {
      type: "website",
      siteName: "PaladinHub",
      url: seo.canonicalUrl,
      title: seo.socialTitle,
      description: seo.socialDescription,
      ...(seo.imageUrl ? { images: [{ url: seo.imageUrl }] } : {}),
    },
    twitter: {
      card: seo.imageUrl ? "summary_large_image" : "summary",
      title: seo.socialTitle,
      description: seo.socialDescription,
      ...(seo.imageUrl ? { images: [seo.imageUrl] } : {}),
    },
  };
}

export function pathToStaticSlug(path: string): string[] | null {
  const normalized = normalizePath(path);
  if (normalized === "/") return null;

  return normalized
    .split("/")
    .filter(Boolean)
    .map(segment => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}
