import ts from "typescript";
import { gzipSync, gunzipSync } from "node:zlib";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
const root = "src", output = "translation-workspace";
const files = [];
async function walk(dir) {
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(?:[cm]?[jt]sx?|json)$/.test(path)) files.push(path);
  }
}
await walk(root); await mkdir(output, { recursive: true });
const catalog = JSON.parse(await readFile("src/localization/catalog.json", "utf8"));
const inventory = [], english = {}, bulgarian = {};
for (const path of files) {
  const source = ts.createSourceFile(path, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true,
    path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const records = [];
  let ordinal = 0;
  function visit(node) {
    if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = ts.isJsxText(node) ? node.getText(source).replace(/\s+/g, " ").trim() : node.text;
      if (text) {
        const parent = node.parent;
        const attr = ts.isJsxAttribute(parent) ? parent.name.getText(source) : null;
        const technical = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) ||
          attr && ["className", "id", "href", "src", "type", "name", "value", "role", "to", "key", "htmlFor", "data-testid"].includes(attr);
        const visible = ts.isJsxText(node) || attr && ["title", "placeholder", "alt", "aria-label"].includes(attr);
        const key = relative(root, path).replace(/[^a-zA-Z0-9]+/g, ".") + ".text." + createHash("sha256").update(text).digest("hex").slice(0, 16);
        const translated = ts.isCallExpression(parent) && parent.expression.getText(source) === "t" && parent.arguments[0] === node && Object.hasOwn(catalog, text);
        const testFixture = /\.(test|spec)\./.test(path);
        const state = testFixture ? "excluded" : translated ? "translated" : technical ? "technical-review" : visible ? "translate" : "review-context";
        const position = source.getLineAndCharacterOfPosition(node.getStart(source));
        records.push({ key, line: position.line + 1, syntax: ts.SyntaxKind[node.kind], attribute: attr, text, state, ...(testFixture ? {reason: "Test fixture; not shipped UI."} : translated ? {catalogKey: text} : {}) });
        if (!technical) { english[key] = text; bulgarian[key] = null; }
      }
    }
    // Template expressions are recorded intact for review; placeholders must become interpolation parameters.
    if (ts.isTemplateExpression(node)) {
      const key = relative(root, path).replace(/[^a-zA-Z0-9]+/g, ".") + ".template." + createHash("sha256").update(node.getText(source)).digest("hex").slice(0, 16);
      records.push({ key, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        syntax: "TemplateExpression", text: node.getText(source), state: "review-interpolation" });
    }
    ts.forEachChild(node, visit);
  }
  visit(source); inventory.push({ file: path, entries: records });
}
const serialized = JSON.stringify({ fileCount: files.length,
  literalCount: inventory.reduce((sum, item) => sum + item.entries.length, 0), files: inventory }) + "\n";
if (process.argv.includes("--check")) {
  if (gunzipSync(await readFile(join(output, "inventory.json.gz"))).toString("utf8") !== serialized) throw new Error("Translation inventory is stale. Regenerate and review it.");
} else {
  await writeFile(join(output, "inventory.json"), serialized);
  await writeFile(join(output, "inventory.json.gz"), gzipSync(serialized));
}

console.log(`Inventoried ${files.length} source files, ${Object.keys(english).length} candidate translation values. These drafts are NOT imported at runtime.`);
