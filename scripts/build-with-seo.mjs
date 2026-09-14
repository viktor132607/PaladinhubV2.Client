import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import ts from "typescript";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

// Fetch once before Next launches workers. Metadata, sitemap and manifest all
// consume the same immutable public payload, even if the API changes mid-build.
loadEnvConfig(process.cwd(), false);
process.env.NODE_ENV = "production";
const directory = await mkdtemp(join(tmpdir(), "paladin-seo-"));
try {
  for (const name of ["seo-build-fixture", "seo-public"]) {
    const source = await readFile(`src/lib/${name}.ts`, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText.replace('"./seo-build-fixture"', '"./seo-build-fixture.mjs"');
    await writeFile(join(directory, `${name}.mjs`), output);
  }
  const { getSeoSnapshot } = await import(pathToFileURL(join(directory, "seo-public.mjs")));
  const snapshot = await getSeoSnapshot();
  const snapshotFile = join(directory, "snapshot.json");
  await writeFile(snapshotFile, JSON.stringify(snapshot));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build", ...process.argv.slice(2)], {
    stdio: "inherit", env: { ...process.env, SEO_SNAPSHOT_FILE: snapshotFile },
  });
  process.exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => resolve(code ?? 1));
  });
} finally {
  await rm(directory, { recursive: true, force: true });
}
