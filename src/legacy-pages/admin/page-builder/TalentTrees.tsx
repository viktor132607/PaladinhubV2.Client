"use client";
import { useEffect, useState } from "react";
import { Link } from "@/router/nextCompat";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import TreeEditor from "@/components/dynamic-talents/TreeEditor";
import {
  createTree,
  parseLayout,
  validateTree,
  type Tree,
  type Block,
} from "@/features/dynamic-talents/model";
type Page = {
  id: number;
  title: string;
  section: string;
  slug: string;
  jsonLayout?: string;
  rowVersionBase64?: string;
};
const button =
  "rounded bg-amber-500 px-4 py-2 text-slate-950 disabled:opacity-40";
const input = "w-full rounded border border-slate-600 bg-[#1f2327] px-3 py-2";
export default function TalentTrees() {
  const [pages, setPages] = useState<Page[]>([]),
    [page, setPage] = useState<Page | null>(null),
    [blocks, setBlocks] = useState<Block[]>([]),
    [active, setActive] = useState(""),
    [title, setTitle] = useState(""),
    [slug, setSlug] = useState(""),
    [section, setSection] = useState("Holy"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false);
  const trees = blocks.filter((b) => b.type === "talenttree.dynamic") as Tree[];
  const tree = trees.find((t) => t.id === active) || trees[0];
  async function list() {
    setPages(
      await readApiJson<Page[]>(
        await fetchBackend("/Admin/api/talent-pages", { cache: "no-store" }),
      ),
    );
  }
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const result = await readApiJson<Page[]>(
          await fetchBackend("/Admin/api/talent-pages", {
            cache: "no-store",
            signal: controller.signal,
          }),
        );
        if (!controller.signal.aborted) setPages(result);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Could not load pages.");
      }
    })();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(next: Block[]) {
    setBlocks(next);
    setDirty(true);
    setMessage("");
  }
  async function load(id: number) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await readApiJson<Page>(
        await fetchBackend(`/Admin/api/talent-pages/${id}`, {
          cache: "no-store",
        }),
      );
      const next = parseLayout(data.jsonLayout || "[]");
      for (const b of next)
        if (b.type === "talenttree.dynamic" && validateTree(b as Tree).length)
          throw new Error(
            "This page contains an invalid dynamic tree. Correct its layout before loading.",
          );
      setPage(data);
      setTitle(data.title);
      setSection(data.section.charAt(0).toUpperCase() + data.section.slice(1));
      setSlug(data.slug);
      setBlocks(next);
      setActive("");
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setBusy(false);
    }
  }
  function newPage() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    const t = createTree();
    setPage(null);
    setTitle("");
    setSlug("");
    setBlocks([t]);
    setActive(t.id);
    setDirty(true);
    setMessage("");
    setError("");
  }
  async function save() {
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError("Page title is required.");
      return;
    }
    const errors = trees.flatMap(validateTree);
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    setBusy(true);
    try {
      const csrf = await readApiJson<{ token: string }>(
        await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" }),
      );
      if (!csrf.token) throw new Error("Could not verify the request.");
      if (page && !page.rowVersionBase64)
        throw new Error("Missing page version. Reload before saving.");
      const response = await fetchBackend(
        page ? `/Admin/api/talent-pages/${page.id}` : "/Admin/api/talent-pages",
        {
          method: page ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf.token,
          },
          body: JSON.stringify(
            page
              ? {
                  jsonLayout: JSON.stringify(blocks),
                  rowVersionBase64: page.rowVersionBase64,
                }
              : {
                  title: title.trim(),
                  slug: slug.trim() || null,
                  section,
                  isPublished: true,
                  jsonLayout: JSON.stringify(blocks),
                },
          ),
        },
      );
      if (response.status === 409)
        throw new Error(
          "The page changed or the slug is already in use. Your edits have been preserved.",
        );
      const saved = await readApiJson<Page>(response);
      const updated: Page = {
        ...(page || {
          id: saved.id,
          title: title.trim(),
          section,
          slug: saved.slug,
        }),
        jsonLayout: JSON.stringify(blocks),
        rowVersionBase64: saved.rowVersionBase64,
      };
      setPage(updated);
      setTitle(updated.title);
      setSlug(updated.slug);
      setDirty(false);
      setMessage("Talent trees saved.");
      try {
        await list();
      } catch {
        setMessage(
          "Talent trees saved. Use Refresh list to update the page list.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <BuilderNavigation />
        <h1 className="mb-5 text-3xl">Talent Tree Builder</h1>
        {page && (
          <Link
            className="mb-4 inline-block text-amber-400"
            to={`/${page.section}/${page.slug}`}
          >
            View saved page
          </Link>
        )}
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className={button} onClick={newPage}>
              New talent page
            </button>
            <label>
              Existing page
              <select
                aria-label="Existing talent page"
                className={input}
                value={page?.id || ""}
                onChange={(e) => {
                  if (e.target.value) void load(Number(e.target.value));
                }}
              >
                <option value="">Select page</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.section} / {p.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={button}
              onClick={() => void list().catch((e) => setError(e.message))}
            >
              Refresh list
            </button>
          </div>
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-green-300">
              {message}
            </p>
          )}
          {(tree || page) && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <label>
                  Page title
                  <input
                    className={input}
                    value={title}
                    maxLength={200}
                    disabled={!!page}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
                <label>
                  Section
                  <select
                    className={input}
                    value={section}
                    disabled={!!page}
                    onChange={(e) => {
                      setSection(e.target.value);
                      setDirty(true);
                    }}
                  >
                    {["Holy", "Protection", "Retribution"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Slug
                  <input
                    className={input}
                    value={slug}
                    maxLength={100}
                    disabled={!!page}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {trees.map((t, i) => (
                  <button
                    type="button"
                    key={t.id}
                    aria-pressed={tree === t}
                    className={`${button} ${tree === t ? "ring-2 ring-white" : ""}`}
                    onClick={() => setActive(t.id)}
                  >
                    {t.title || `Tree ${i + 1}`}
                  </button>
                ))}
                <button
                  type="button"
                  className={button}
                  onClick={() => {
                    const t = createTree();
                    change([...blocks, t]);
                    setActive(t.id);
                  }}
                >
                  Add tree
                </button>
              </div>
              {tree && (
                <>
                  <TreeEditor
                    key={tree.id}
                    tree={tree}
                    onChange={(next) =>
                      change(blocks.map((b) => (b === tree ? next : b)))
                    }
                  />
                  <button
                    type="button"
                    className="rounded bg-red-900 px-3 py-2"
                    onClick={() => {
                      if (window.confirm("Delete this tree?")) {
                        change(blocks.filter((b) => b !== tree));
                        setActive("");
                      }
                    }}
                  >
                    Delete tree
                  </button>
                </>
              )}
              <div>
                <button
                  type="button"
                  className={button}
                  disabled={busy || !dirty}
                  onClick={() => void save()}
                >
                  {busy ? "Saving…" : "Save talent page"}
                </button>
              </div>
            </>
          )}
        </fieldset>
      </div>
    </main>
  );
}
