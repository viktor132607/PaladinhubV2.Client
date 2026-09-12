"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import DynamicPageContent from "@/components/dynamic-talents/DynamicPageContent";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useSearchParams } from "@/router/nextCompat";

type SectionName = "Holy" | "Protection" | "Retribution";

type BuilderBlock = Record<string, unknown> & {
  type: string;
};

type ManagedPage = {
  id: number;
  section: SectionName;
  title: string;
  slug: string;
  isPublished: boolean;
  jsonLayout?: string;
  rowVersionBase64?: string;
};

type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: string[] | Record<string, string[]>;
};

type BlockModel = {
  id: string;
  label: string;
  description: string;
  create: (section: SectionName) => BuilderBlock;
};

type GenericColumn = {
  Key: string;
  Title: string;
  Kind: "text";
};

type GenericRow = Record<string, string>;

type TierItem = {
  name: string;
  type: "item";
};

const inputClass =
  "w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60";

const smallButton =
  "rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40";

const BLOCK_MODELS: BlockModel[] = [
  {
    id: "title",
    label: "Title",
    description: "Main section heading",
    create: () => ({
      type: "heading",
      Text: "Section title",
      Level: "h2",
      Align: "left",
    }),
  },
  {
    id: "subtitle",
    label: "Subtitle",
    description: "Smaller section heading",
    create: () => ({
      type: "heading",
      Text: "Subtitle",
      Level: "h3",
      Align: "left",
    }),
  },
  {
    id: "paragraph",
    label: "Paragraph",
    description: "Reusable text block",
    create: () => ({
      type: "paragraph",
      Text: "Paragraph text",
      Align: "left",
    }),
  },
  {
    id: "table",
    label: "Table",
    description: "Generic table like the static guide tables",
    create: () => ({
      type: "table.generic",
      Title: "Table",
      Columns: [
        { Key: "column1", Title: "Column 1", Kind: "text" },
        { Key: "column2", Title: "Column 2", Kind: "text" },
      ],
      Rows: [{ column1: "Value", column2: "Value" }],
    }),
  },
  {
    id: "image",
    label: "Image",
    description: "Responsive content image",
    create: () => ({
      type: "image",
      Url: "",
      Alt: "",
      Caption: "",
      Align: "center",
    }),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal section separator",
    create: () => ({ type: "divider" }),
  },
  {
    id: "tierlist",
    label: "Tier List",
    description: "Tier rows like the static guide component",
    create: () => ({
      type: "tierlist",
      Title: "Tier List",
      Tiers: ["S", "A", "B", "C"],
      ItemsByTier: { S: [], A: [], B: [], C: [] },
    }),
  },
  {
    id: "talenttree",
    label: "Talent Tree",
    description: "Talent tree component",
    create: (section) => ({
      type: "talenttree",
      TreeKey: section.toLowerCase(),
      Build: "",
    }),
  },
];

function normalizeSection(value: string | null | undefined): SectionName {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "protection" || normalized === "prot") return "Protection";
  if (
    normalized === "retribution" ||
    normalized === "retri" ||
    normalized === "ret"
  ) {
    return "Retribution";
  }
  return "Holy";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLayout(jsonLayout?: string): BuilderBlock[] {
  if (!jsonLayout?.trim()) return [];

  const parsed: unknown = JSON.parse(jsonLayout);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (entry): entry is BuilderBlock =>
      Boolean(entry) &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      typeof (entry as { type?: unknown }).type === "string",
  );
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : fallback;
}

function tableColumns(block: BuilderBlock): GenericColumn[] {
  if (!Array.isArray(block.Columns)) return [];

  return block.Columns.map((entry, index) => {
    const record =
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : {};

    return {
      Key: stringValue(record.Key, `column${index + 1}`),
      Title: stringValue(record.Title, `Column ${index + 1}`),
      Kind: "text",
    };
  });
}

function tableRows(block: BuilderBlock): GenericRow[] {
  if (!Array.isArray(block.Rows)) return [];

  return block.Rows.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return {};
    return Object.fromEntries(
      Object.entries(entry).map(([key, value]) => [key, stringValue(value)]),
    );
  });
}

function tierItems(block: BuilderBlock): Record<string, TierItem[]> {
  if (!block.ItemsByTier || typeof block.ItemsByTier !== "object") return {};

  const source = block.ItemsByTier as Record<string, unknown>;
  const result: Record<string, TierItem[]> = {};

  for (const [tier, entries] of Object.entries(source)) {
    result[tier] = Array.isArray(entries)
      ? entries.map((entry) => {
          if (typeof entry === "string") return { name: entry, type: "item" };
          if (entry && typeof entry === "object" && !Array.isArray(entry)) {
            return {
              name: stringValue((entry as Record<string, unknown>).name),
              type: "item",
            };
          }
          return { name: "", type: "item" };
        })
      : [];
  }

  return result;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ErrorResponse
      | null;

    if (Array.isArray(payload?.errors) && payload.errors.length) {
      return payload.errors.join(" ");
    }

    if (payload?.errors && !Array.isArray(payload.errors)) {
      const messages = Object.values(payload.errors).flat();
      if (messages.length) return messages.join(" ");
    }

    return (
      payload?.message ||
      payload?.title ||
      payload?.error ||
      `Request failed with status ${response.status}.`
    );
  }

  return (
    (await response.text().catch(() => "")) ||
    `Request failed with status ${response.status}.`
  );
}

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idValue = Number(searchParams.get("id") || 0);
  const editingId = Number.isInteger(idValue) && idValue > 0 ? idValue : 0;
  const isEditing = editingId > 0;

  const [section, setSection] = useState<SectionName>(() =>
    normalizeSection(searchParams.get("section")),
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [rowVersionBase64, setRowVersionBase64] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const response = await fetchBackend(
          `/Admin/api/page-builder/pages/${editingId}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const page = await readApiJson<ManagedPage>(response);
        if (controller.signal.aborted) return;

        setSection(normalizeSection(page.section));
        setTitle(page.title);
        setSlug(page.slug);
        setIsPublished(page.isPublished);
        setRowVersionBase64(page.rowVersionBase64 ?? "");
        setBlocks(parseLayout(page.jsonLayout));
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "The page could not be loaded.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [editingId, isEditing]);

  const finalSlug = useMemo(() => slugify(slug || title), [slug, title]);
  const layoutJson = useMemo(() => JSON.stringify(blocks), [blocks]);

  const addBlock = (model: BlockModel) => {
    setBlocks((current) => [...current, model.create(section)]);
  };

  const patchBlock = (index: number, patch: Partial<BuilderBlock>) => {
    setBlocks((current) =>
      current.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block,
      ),
    );
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeBlock = (index: number) => {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setError("");
    const normalizedTitle = title.trim();
    const normalizedSlug = finalSlug;

    if (!normalizedTitle) {
      setError("Page title is required.");
      return;
    }
    if (!normalizedSlug) {
      setError("Slug is required.");
      return;
    }
    if (normalizedTitle.length > 200) {
      setError("Page title cannot exceed 200 characters.");
      return;
    }
    if (normalizedSlug.length > 100) {
      setError("Slug cannot exceed 100 characters.");
      return;
    }

    setSaving(true);

    try {
      const metadataResponse = await fetchBackend(
        isEditing
          ? `/Admin/api/page-builder/pages/${editingId}`
          : "/Admin/api/page-builder/pages",
        {
          method: isEditing ? "PUT" : "POST",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section,
            title: normalizedTitle,
            slug: normalizedSlug,
            isPublished,
            rowVersionBase64,
          }),
        },
      );

      if (!metadataResponse.ok) {
        throw new Error(await responseMessage(metadataResponse));
      }

      const savedPage = await readApiJson<ManagedPage>(metadataResponse);

      setRowVersionBase64(savedPage.rowVersionBase64 ?? "");
      if (!savedPage.rowVersionBase64) {
        throw new Error("The server did not return a page version for content saving.");
      }

      const layoutResponse = await fetchBackend(
        backendEndpoints.pageBuilder.pageLayout(savedPage.id),
        {
          method: "PUT",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonLayout: layoutJson,
            rowVersionBase64: savedPage.rowVersionBase64,
          }),
        },
      );

      if (!layoutResponse.ok) {
        throw new Error(await responseMessage(layoutResponse));
      }

      navigate("/Admin/PageBuilder/Index");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The page could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-page-builder px-4 py-12 text-center text-slate-300">
        Loading page...
      </main>
    );
  }

  return (
    <main className="admin-page-builder px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <BuilderNavigation />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              {isEditing ? "Edit Page" : "Add Page"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Assemble the dynamic page from reusable Lego-style components.
            </p>
          </div>
          <Link
            to="/Admin/PageBuilder/Index"
            className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600"
          >
            Back to pages
          </Link>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-6">
          <section className="grid gap-5 rounded-xl border border-slate-700 bg-slate-900 p-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Category / Section
              </span>
              <select
                className={inputClass}
                value={section}
                disabled={saving}
                onChange={(event) =>
                  setSection(event.target.value as SectionName)
                }
              >
                <option value="Holy">Holy</option>
                <option value="Protection">Protection</option>
                <option value="Retribution">Retribution</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Page name
              </span>
              <input
                className={inputClass}
                value={title}
                maxLength={200}
                disabled={saving}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Mythic+ Guide"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Slug
              </span>
              <input
                className={inputClass}
                value={slug}
                maxLength={100}
                disabled={saving}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="mythic-plus-guide"
              />
              <span className="mt-2 block text-xs text-slate-400">
                Route: /{section}/{finalSlug || "page-slug"}
              </span>
            </label>

            <label className="flex items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={isPublished}
                disabled={saving}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-4 w-4"
              />
              <span>
                Active on site
                <span className="ml-2 text-sm text-slate-400">
                  Uncheck to keep the page inactive.
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Models</h2>
              <p className="mt-1 text-sm text-slate-400">
                Add a component. Every click adds one new block at the bottom of the page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {BLOCK_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => addBlock(model)}
                  className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-left hover:border-amber-400 hover:bg-slate-900"
                >
                  <strong className="block text-slate-100">+ {model.label}</strong>
                  <span className="mt-1 block text-xs text-slate-400">
                    {model.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Page content</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Blocks are rendered from top to bottom in this exact order.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {blocks.length} blocks
              </span>
            </div>

            {blocks.length ? (
              <div className="space-y-3">
                {blocks.map((block, index) => (
                  <BlockEditor
                    key={`${block.type}:${index}`}
                    block={block}
                    index={index}
                    total={blocks.length}
                    onPatch={(patch) => patchBlock(index, patch)}
                    onMove={(direction) => moveBlock(index, direction)}
                    onRemove={() => removeBlock(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center text-slate-400">
                Add a model above to start building the page.
              </div>
            )}
          </section>

          {blocks.length ? (
            <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-semibold">Live preview</h2>
              <div className="admin-content-preview min-w-0 overflow-x-auto rounded-lg bg-slate-950 p-3 sm:p-6">
                <DynamicPageContent json={layoutJson} />
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-amber-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditing ? "Save page" : "Create page"}
            </button>
            <Link
              to="/Admin/PageBuilder/Index"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold hover:bg-slate-600"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onPatch,
  onMove,
  onRemove,
}: {
  block: BuilderBlock;
  index: number;
  total: number;
  onPatch: (patch: Partial<BuilderBlock>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const type = block.type.toLowerCase();
  const headingLevel = stringValue(block.Level, "h2");
  const label =
    type === "heading"
      ? headingLevel === "h3"
        ? "Subtitle"
        : "Title"
      : type === "table.generic"
        ? "Table"
        : type === "tierlist"
          ? "Tier List"
          : type === "talenttree"
            ? "Talent Tree"
            : type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <article className="rounded-lg border border-slate-700 bg-slate-950/70 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <strong>
            {index + 1}. {label}
          </strong>
          <span className="ml-2 font-mono text-xs text-slate-500">
            {block.type}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={smallButton}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="rounded-md bg-red-900 px-3 py-1.5 text-sm text-red-100 hover:bg-red-800"
            onClick={onRemove}
          >
            Delete
          </button>
        </div>
      </div>

      {type === "heading" ? (
        <div className="grid gap-3 md:grid-cols-[1fr_10rem]">
          <label>
            <span className="mb-1 block text-xs text-slate-400">Text</span>
            <input
              className={inputClass}
              value={stringValue(block.Text)}
              onChange={(event) => onPatch({ Text: event.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Align</span>
            <select
              className={inputClass}
              value={stringValue(block.Align, "left")}
              onChange={(event) => onPatch({ Align: event.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      ) : null}

      {type === "paragraph" ? (
        <div className="grid gap-3 md:grid-cols-[1fr_10rem]">
          <label>
            <span className="mb-1 block text-xs text-slate-400">Text</span>
            <textarea
              rows={5}
              className={inputClass}
              value={stringValue(block.Text)}
              onChange={(event) => onPatch({ Text: event.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Align</span>
            <select
              className={inputClass}
              value={stringValue(block.Align, "left")}
              onChange={(event) => onPatch({ Align: event.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      ) : null}

      {type === "image" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">Image URL</span>
            <input
              className={inputClass}
              value={stringValue(block.Url)}
              onChange={(event) => onPatch({ Url: event.target.value })}
              placeholder="/images/... or https://..."
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Alt text</span>
            <input
              className={inputClass}
              value={stringValue(block.Alt)}
              onChange={(event) => onPatch({ Alt: event.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Caption</span>
            <input
              className={inputClass}
              value={stringValue(block.Caption)}
              onChange={(event) => onPatch({ Caption: event.target.value })}
            />
          </label>
        </div>
      ) : null}

      {type === "table.generic" ? (
        <TableEditor block={block} onPatch={onPatch} />
      ) : null}

      {type === "tierlist" ? (
        <TierListEditor block={block} onPatch={onPatch} />
      ) : null}

      {type === "talenttree" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs text-slate-400">Tree key</span>
            <input
              className={inputClass}
              value={stringValue(block.TreeKey)}
              onChange={(event) => onPatch({ TreeKey: event.target.value })}
              placeholder="holy / protection / retribution / ..."
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-slate-400">Build</span>
            <input
              className={inputClass}
              value={stringValue(block.Build)}
              onChange={(event) => onPatch({ Build: event.target.value })}
              placeholder="Optional build name"
            />
          </label>
        </div>
      ) : null}

      {type === "divider" ? (
        <p className="text-sm text-slate-400">
          Divider has no content fields. Move it to the position where the section should break.
        </p>
      ) : null}
    </article>
  );
}

function TableEditor({
  block,
  onPatch,
}: {
  block: BuilderBlock;
  onPatch: (patch: Partial<BuilderBlock>) => void;
}) {
  const columns = tableColumns(block);
  const rows = tableRows(block);

  const updateColumns = (nextColumns: GenericColumn[]) => {
    const keys = new Set(nextColumns.map((column) => column.Key));
    const nextRows = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([key]) => keys.has(key)),
      ),
    );
    onPatch({ Columns: nextColumns, Rows: nextRows });
  };

  return (
    <div className="space-y-4">
      <label>
        <span className="mb-1 block text-xs text-slate-400">Table title</span>
        <input
          className={inputClass}
          value={stringValue(block.Title)}
          onChange={(event) => onPatch({ Title: event.target.value })}
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Columns</span>
          <button
            type="button"
            className={smallButton}
            onClick={() => {
              const nextIndex = columns.length + 1;
              updateColumns([
                ...columns,
                {
                  Key: `column${nextIndex}`,
                  Title: `Column ${nextIndex}`,
                  Kind: "text",
                },
              ]);
            }}
          >
            + Column
          </button>
        </div>
        <div className="space-y-2">
          {columns.map((column, columnIndex) => (
            <div
              key={column.Key}
              className="grid gap-2 md:grid-cols-[1fr_auto]"
            >
              <input
                className={inputClass}
                value={column.Title}
                onChange={(event) =>
                  updateColumns(
                    columns.map((entry, index) =>
                      index === columnIndex
                        ? { ...entry, Title: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="rounded bg-red-950 px-3 py-2 text-sm text-red-200"
                onClick={() =>
                  updateColumns(
                    columns.filter((_, index) => index !== columnIndex),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Rows</span>
          <button
            type="button"
            className={smallButton}
            disabled={!columns.length}
            onClick={() =>
              onPatch({
                Rows: [
                  ...rows,
                  Object.fromEntries(columns.map((column) => [column.Key, ""])),
                ],
              })
            }
          >
            + Row
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded border border-slate-800 bg-slate-900 p-3"
            >
              <div className="grid gap-2 md:grid-cols-2">
                {columns.map((column) => (
                  <label key={column.Key}>
                    <span className="mb-1 block text-xs text-slate-500">
                      {column.Title}
                    </span>
                    <input
                      className={inputClass}
                      value={stringValue(row[column.Key])}
                      onChange={(event) =>
                        onPatch({
                          Rows: rows.map((entry, index) =>
                            index === rowIndex
                              ? { ...entry, [column.Key]: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 rounded bg-red-950 px-3 py-1.5 text-xs text-red-200"
                onClick={() =>
                  onPatch({
                    Rows: rows.filter((_, index) => index !== rowIndex),
                  })
                }
              >
                Remove row
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TierListEditor({
  block,
  onPatch,
}: {
  block: BuilderBlock;
  onPatch: (patch: Partial<BuilderBlock>) => void;
}) {
  const tiers = stringArray(block.Tiers, ["S", "A", "B", "C"]);
  const itemsByTier = tierItems(block);

  return (
    <div className="space-y-4">
      <label>
        <span className="mb-1 block text-xs text-slate-400">Title</span>
        <input
          className={inputClass}
          value={stringValue(block.Title, "Tier List")}
          onChange={(event) => onPatch({ Title: event.target.value })}
        />
      </label>

      <label>
        <span className="mb-1 block text-xs text-slate-400">
          Tiers, comma separated
        </span>
        <input
          className={inputClass}
          value={tiers.join(", ")}
          onChange={(event) => {
            const nextTiers = event.target.value
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);
            onPatch({
              Tiers: nextTiers,
              ItemsByTier: Object.fromEntries(
                nextTiers.map((tier) => [tier, itemsByTier[tier] ?? []]),
              ),
            });
          }}
        />
      </label>

      <div className="space-y-2">
        {tiers.map((tier) => (
          <label key={tier} className="grid gap-2 md:grid-cols-[5rem_1fr]">
            <span className="rounded bg-slate-800 px-3 py-2 text-center font-bold">
              {tier}
            </span>
            <input
              className={inputClass}
              value={(itemsByTier[tier] ?? []).map((item) => item.name).join(", ")}
              placeholder="Item 1, Item 2, Item 3"
              onChange={(event) =>
                onPatch({
                  ItemsByTier: {
                    ...itemsByTier,
                    [tier]: event.target.value
                      .split(",")
                      .map((name) => name.trim())
                      .filter(Boolean)
                      .map((name) => ({ name, type: "item" as const })),
                  },
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
