import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isSnapshot,
  canonicalPublicPath,
  getSeoSnapshot,
  metadataForPath,
  pathToStaticSlug,
  resetSeoSnapshotCacheForTests,
  resolveEffectiveSeo,
  type SeoPublicSnapshot,
} from "./seo-public";

const snapshot: SeoPublicSnapshot = {
  siteUrl: "https://example.com",
  registryVersion: "test",
  snapshotVersion: "test-snapshot",
  generatedAtUtc: "2026-09-13T00:00:00Z",
  staticRoutes: ["/", "/products", "/privacy"],
  pages: [
    { id: 42, title: "Custom guide", path: "/Guides/custom" },
  ],
  entries: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      version: 1,
      pageId: null,
      path: "*",
      title: "Global title",
      description: "Global description",
      canonicalUrl: "",
      socialTitle: "Global social title",
      socialDescription: "Global social description",
      imageUrl: "https://cdn.example.com/global.jpg",
      index: null,
      follow: false,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      version: 3,
      pageId: null,
      path: "/products",
      title: "Products title",
      description: "",
      canonicalUrl: "https://example.com/products",
      socialTitle: "",
      socialDescription: "Products social description",
      imageUrl: "",
      index: false,
      follow: null,
    },
  ],
};

let originalSiteUrl: string | undefined;

beforeEach(() => {
  originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  resetSeoSnapshotCacheForTests();
});

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  vi.unstubAllGlobals();
  resetSeoSnapshotCacheForTests();
});

describe("public SEO resolution", () => {
  it("inherits global fields while respecting route-specific overrides", () => {
    const seo = resolveEffectiveSeo(snapshot, "/products");

    expect(seo).toMatchObject({
      isPublic: true,
      path: "/products",
      title: "Products title",
      description: "Global description",
      canonicalUrl: "https://example.com/products",
      socialTitle: "Products title",
      socialDescription: "Products social description",
      imageUrl: "https://cdn.example.com/global.jpg",
      index: false,
      follow: false,
    });
  });

  it("maps legacy aliases to their canonical SEO target", () => {
    expect(canonicalPublicPath(snapshot, "/Merchandise/List"))
      .toBe("/products");
    expect(resolveEffectiveSeo(snapshot, "/Merchandise/List").canonicalUrl)
      .toBe("https://example.com/products");
  });

  it("applies global defaults and an automatic canonical to database pages", () => {
    const seo = resolveEffectiveSeo(snapshot, "/Guides/custom");

    expect(seo).toMatchObject({
      isPublic: true,
      path: "/Guides/custom",
      title: "Global title",
      description: "Global description",
      canonicalUrl: "https://example.com/Guides/custom",
      imageUrl: "https://cdn.example.com/global.jpg",
      index: true,
      follow: false,
    });
  });

  it("marks private and admin routes noindex and nofollow", () => {
    const metadata = metadataForPath(snapshot, "/Admin/Seo");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("emits canonical, Open Graph and Twitter metadata for public pages", () => {
    const metadata = metadataForPath(snapshot, "/products");

    expect(metadata.alternates).toMatchObject({
      canonical: "https://example.com/products",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Products title",
      description: "Products social description",
      url: "https://example.com/products",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Products title",
      description: "Products social description",
    });
  });

  it("turns database page paths into catch-all static params", () => {
    expect(pathToStaticSlug("/Guides/custom"))
      .toEqual(["Guides", "custom"]);
    expect(pathToStaticSlug("/"))
      .toBeNull();
  });

  it("falls back to the deterministic public-route fixture in unit tests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));

    const fallback = await getSeoSnapshot();

    expect(fallback.registryVersion).toBe("fallback-client-routes");
    expect(fallback.staticRoutes).toContain("/products");
    expect(fallback.pages).toContainEqual({
      id: 900001,
      title: "Fixture guide",
      path: "/Guides/fixture-page",
    });
  });
});

describe("public snapshot validation", () => {
  it("accepts the API contract", () => expect(isSnapshot(snapshot)).toBe(true));
  it("rejects malformed nested values and duplicate targets", () => {
    expect(isSnapshot({...snapshot, pages:[{id:1, title:"Page", path:42}]})).toBe(false);
    expect(isSnapshot({...snapshot, entries:[{...snapshot.entries[0], index:"false"}]})).toBe(false);
    expect(isSnapshot({...snapshot, entries:[snapshot.entries[0],snapshot.entries[0]]})).toBe(false);
    expect(isSnapshot({...snapshot, staticRoutes:["/Admin/../products"]})).toBe(false);
  });
});

it("uses the immutable prebuild snapshot without another API fetch", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("SEO_BUILD_SNAPSHOT_JSON", JSON.stringify(snapshot));
  resetSeoSnapshotCacheForTests();
  try {
    expect(await getSeoSnapshot()).toEqual(snapshot);
    expect(await getSeoSnapshot()).toEqual(snapshot);
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetSeoSnapshotCacheForTests();
  }
});
