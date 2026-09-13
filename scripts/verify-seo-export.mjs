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

const adminSeo = await readRoute("Admin/Seo.html", "Admin/Seo/index.html");
assertIncludes(adminSeo, "noindex", "Admin SEO HTML");
assertIncludes(adminSeo, "nofollow", "Admin SEO HTML");

const sitemap = await read("sitemap.xml");
assertIncludes(sitemap, "<urlset", "sitemap.xml");
assertIncludes(sitemap, "<loc>", "sitemap.xml");
assertNotIncludes(sitemap.toLowerCase(), "/admin", "sitemap.xml");
assertNotIncludes(sitemap.toLowerCase(), "/account", "sitemap.xml");

const robots = await read("robots.txt");
assertIncludes(robots, "User-Agent: *", "robots.txt");
assertIncludes(robots, "Disallow: /Admin", "robots.txt");
assertIncludes(robots, "Disallow: /Account", "robots.txt");
assertIncludes(robots, "Sitemap:", "robots.txt");

process.stdout.write("SEO static export verification passed.\n");
