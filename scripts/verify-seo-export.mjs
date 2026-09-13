import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const out = path.join(root, "out");

async function read(relativePath) {
  const filePath = path.join(out, relativePath);
  await access(filePath);
  return readFile(filePath, "utf8");
}

async function readRoute(...candidates) {
  for (const candidate of candidates) {
    try {
      return await read(candidate);
    } catch {
      // Try the next static-export filename shape.
    }
  }
  throw new Error(`Missing exported route. Tried: ${candidates.join(", ")}`);
}

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label} is missing expected output: ${expected}`);
  }
}

function assertNotIncludes(content, unexpected, label) {
  if (content.includes(unexpected)) {
    throw new Error(`${label} contains forbidden output: ${unexpected}`);
  }
}

const home = await read("index.html");
assertIncludes(home, 'rel="canonical"', "Home HTML");
assertIncludes(home, 'property="og:title"', "Home HTML");
assertIncludes(home, 'name="twitter:card"', "Home HTML");
assertNotIncludes(home.toLowerCase(), "hreflang=", "Home HTML");

const adminSeo = await readRoute("Admin/Seo.html", "Admin/Seo/index.html");
assertIncludes(adminSeo, "noindex", "Admin SEO HTML");
assertIncludes(adminSeo, "nofollow", "Admin SEO HTML");

const sitemap = await read("sitemap.xml");
assertIncludes(sitemap, "<urlset", "sitemap.xml");
assertIncludes(sitemap, "<loc>", "sitemap.xml");
for (const forbidden of ["/admin", "/account", "/cart", "/checkout", "/home/home", "/merchandise/list"]) {
  assertNotIncludes(sitemap.toLowerCase(), forbidden, "sitemap.xml");
}

const robots = await read("robots.txt");
assertIncludes(robots, "User-Agent: *", "robots.txt");
assertIncludes(robots, "Disallow: /Admin", "robots.txt");
assertIncludes(robots, "Disallow: /Account", "robots.txt");
assertIncludes(robots, "Sitemap:", "robots.txt");

const manifestText = await readRoute(
  "seo-build-manifest",
  "seo-build-manifest.json",
  "seo-build-manifest/index.html",
);
const manifest = JSON.parse(manifestText);
if (manifest.status !== "included-in-this-build") {
  throw new Error(`SEO build manifest has unexpected status: ${manifest.status}`);
}
if (manifest.source !== "fixture") {
  throw new Error(`SEO build manifest has unexpected source: ${manifest.source}`);
}
if (manifest.snapshotVersion !== "fixture-2026-09-13.1") {
  throw new Error(`SEO build manifest has unexpected snapshot: ${manifest.snapshotVersion}`);
}
if (manifest.registryVersion !== "fixture-client-routes-2026-09-13.1") {
  throw new Error(`SEO build manifest has unexpected registry: ${manifest.registryVersion}`);
}
if (manifest.requiresRebuildForChanges !== true) {
  throw new Error("SEO build manifest must state that DB changes require a rebuild.");
}
if (manifest.deployHookConfigured !== false) {
  throw new Error("SEO build manifest must not claim an unconfigured deploy hook.");
}
if (!manifest.buildCommit || manifest.buildCommit === "unknown") {
  throw new Error("SEO build manifest must identify the build commit.");
}

process.stdout.write("SEO static export verification passed.\n");
