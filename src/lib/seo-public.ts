import type { Metadata } from "next";
import { SEO_BUILD_FIXTURE } from "./seo-build-fixture";

const DEFAULT_SITE_URL = "https://paladinhubv2-client.onrender.com";
const DEFAULT_API_URL = "http://localhost:10000";
const SEO_FETCH_ATTEMPTS = 3;
const SEO_FETCH_RETRY_DELAY_MS = 250;
export const DEFAULT_SEO_TITLE = "PaladinHub";
export const DEFAULT_SEO_DESCRIPTION =
  "World of Warcraft Paladin guides, builds, discussions and merchandise.";

const STATIC_ALIASES: Record<string, string> = {
  "/home/home": "/",
  "/discussion/index": "/discussions",
  "/discussions/index": "/discussions",
  "/merchandise/merchandise": "/products",
  "/merchandise/list": "/products",
  "/home/privacy": "/privacy",
};

export type SeoBuildSource = "api" | "fixture";

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

export type SeoBuildManifest = {
  schemaVersion: 1;
  status: "included-in-this-build";
  source: SeoBuildSource;
  snapshotVersion: string;
  registryVersion: string;
  snapshotGeneratedAtUtc: string;
  builtAtUtc: string;
  buildCommit: string;
  siteUrl: string;
  apiSnapshotUrl: string;
  requiresRebuildForChanges: true;
  deployHookConfigured: boolean;
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

export function configuredSeoBuildSource(): SeoBuildSource {
  const value = process.env.SEO_BUILD_SOURCE?.trim().toLowerCase();
  if (!value || value === "api") return "api";
  if (value === "fixture") return "fixture";
  throw new Error(
    `Invalid SEO_BUILD_SOURCE '${process.env.SEO_BUILD_SOURCE}'. Use 'api' or 'fixture'.`,
  );
}

export function configuredApiUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!explicit && process.env.NODE_ENV === "production" && configuredSeoBuildSource() === "api") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required for a production SEO build when SEO_BUILD_SOURCE=api.",
    );
  }

  const candidate = (explicit || DEFAULT_API_URL)
    .replace(/\/api\/?$/i, "")
    .replace(/\/+$/, "");
  const normalized = normalizeOrigin(candidate);
  if (!normalized) {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid HTTP/HTTPS origin.");
  }
  return normalized;
}

function normalizePath(value: string): string {
  const candidate = value.trim();
  if (candidate === "*") return "*";

  const rawPath = candidate.split(/[?#]/, 1)[0] || "/";
  const withSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const collapsed = withSlash.replace(/\/{2,}/g, "/");
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : "/";
}

function isSnapshot(value: unknown): value is SeoPublicSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SeoPublicSnapshot>;
  return typeof candidate.siteUrl === "string" &&
    typeof candidate.registryVersion === "string" &&
    typeof candidate.snapshotVersion === "string" &&
    typeof candidate.generatedAtUtc === "string" &&
    Array.isArray(candidate.staticRoutes) &&
    Array.isArray(candidate.pages) &&
    Array.isArray(candidate.entries);
}

function normalizeSnapshot(payload: SeoPublicSnapshot): SeoPublicSnapshot {
  return {
    ...payload,
    siteUrl: normalizeOrigin(payload.siteUrl) || configuredSiteUrl(),
    staticRoutes: payload.staticRoutes.map(normalizePath),
    pages: payload.pages.map(page => ({ ...page, path: normalizePath(page.path) })),
    entries: payload.entries.map(entry => ({ ...entry, path: normalizePath(entry.path) })),
  };
}

function unitTestFallbackSnapshot(): SeoPublicSnapshot {
  return {
    ...SEO_BUILD_FIXTURE,
    registryVersion: "fallback-client-routes",
    snapshotVersion: "fallback",
    generatedAtUtc: new Date(0).toISOString(),
  };
}

function retryDelayMs(): number {
  const configured = Number(process.env.SEO_BUILD_RETRY_DELAY_MS);
  return Number.isFinite(configured) && configured >= 0
    ? configured
    : SEO_FETCH_RETRY_DELAY_MS;
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSeoSnapshotFromApi(): Promise<SeoPublicSnapshot> {
  const snapshotUrl = `${configuredApiUrl()}/api/seo/snapshot`;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= SEO_FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(snapshotUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`SEO snapshot request returned HTTP ${response.status}.`);
      }

      const payload: unknown = await response.json();
      if (!isSnapshot(payload)) {
        throw new Error("SEO snapshot payload is invalid.");
      }

      return normalizeSnapshot(payload);
    } catch (error) {
      lastError = error;
      if (attempt < SEO_FETCH_ATTEMPTS) {
        await delay(retryDelayMs() * attempt);
      }
    }
  }

  const detail = lastError instanceof Error ? ` ${lastError.message}` : "";
  throw new Error(
    `SEO build failed: could not load a valid public snapshot from ${snapshotUrl} after ${SEO_FETCH_ATTEMPTS} attempts.${detail}`,
  );
}

let snapshotPromise: Promise<SeoPublicSnapshot> | null = null;

export function resetSeoSnapshotCacheForTests(): void {
  snapshotPromise = null;
}

export async function getSeoSnapshot(): Promise<SeoPublicSnapshot> {
  if (snapshotPromise) return snapshotPromise;

  if (!process.env.SEO_BUILD_SOURCE && process.env.NODE_ENV === "test") {
    snapshotPromise = Promise.resolve(normalizeSnapshot(unitTestFallbackSnapshot()));
    return snapshotPromise;
  }

  snapshotPromise = configuredSeoBuildSource() === "fixture"
    ? Promise.resolve(normalizeSnapshot(SEO_BUILD_FIXTURE))
    : fetchSeoSnapshotFromApi();

  return snapshotPromise;
}

export function buildSeoBuildManifest(
  snapshot: SeoPublicSnapshot,
  builtAtUtc = new Date().toISOString(),
): SeoBuildManifest {
  return {
    schemaVersion: 1,
    status: "included-in-this-build",
    source: configuredSeoBuildSource(),
    snapshotVersion: snapshot.snapshotVersion,
    registryVersion: snapshot.registryVersion,
    snapshotGeneratedAtUtc: snapshot.generatedAtUtc,
    builtAtUtc,
    buildCommit:
      process.env.SEO_BUILD_COMMIT?.trim() ||
      process.env.RENDER_GIT_COMMIT?.trim() ||
      process.env.GITHUB_SHA?.trim() ||
      "unknown",
    siteUrl: configuredSiteUrl(),
    apiSnapshotUrl: `${configuredApiUrl()}/api/seo/snapshot`,
    requiresRebuildForChanges: true,
    deployHookConfigured: process.env.SEO_DEPLOY_HOOK_CONFIGURED === "true",
  };
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
    entry.path !== "*" &&
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
  if (normalized === "/" || normalized === "*") return null;

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
