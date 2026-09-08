"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import { Link, useNavigate, useSearchParams } from "@/router/nextCompat";

type BuilderBlock = Record<string, unknown> & {
  type: string;
};

type SectionName = "Holy" | "Protection" | "Retribution";

type CsrfResponse = {
  token?: string;
};

type CreatePageResponse = {
  id: number;
  section: string;
  title: string;
  slug: string;
  isPublished: boolean;
  jsonLayout: string;
  redirectUrl: string;
};

type ErrorResponse = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

const createPageEndpoint = "/Admin/api/pages";

const templates: Array<{
  key: string;
  label: string;
  block: BuilderBlock;
}> = [
  {
    key: "heading",
    label: "+ Heading",
    block: {
      type: "heading",
      Text: "Section title",
      Level: "h2",
    },
  },
  {
    key: "callout",
    label: "+ Callout",
    block: {
      type: "callout",
      Variant: "info",
      Text: "Callout text",
    },
  },
  {
    key: "divider",
    label: "+ Divider",
    block: {
      type: "divider",
    },
  },
  {
    key: "markdown",
    label: "+ Markdown",
    block: {
      type: "markdown",
      Markdown: "# Title\n\nSome **markdown** text.",
    },
  },
  {
    key: "tabs",
    label: "+ Tabs",
    block: {
      type: "tabs",
      Tabs: [
        {
          Title: "Tab 1",
          Blocks: [
            {
              type: "markdown",
              Markdown: "Tab 1 **content**",
            },
          ],
        },
        {
          Title: "Tab 2",
          Blocks: [],
        },
      ],
    },
  },
  {
    key: "table.generic",
    label: "+ Generic table",
    block: {
      type: "table.generic",
      Columns: [
        {
          Key: "col1",
          Title: "Column 1",
          Kind: "text",
        },
      ],
      Rows: [
        {
          col1: "Value",
        },
      ],
    },
  },
  {
    key: "table.gear",
    label: "+ Gear table",
    block: {
      type: "table.gear",
      Rows: [
        {
          Slot: "Head",
          Item: {
            Name: "Item name",
          },
          Source: "Drop/Shop",
        },
      ],
    },
  },
  {
    key: "table.consumables",
    label: "+ Consumables table",
    block: {
      type: "table.consumables",
      Rows: [
        {
          Type: "Flask",
          Best: {
            Name: "Best item",
          },
          Alternative: {
            Name: "Alternative",
          },
        },
      ],
    },
  },
  {
    key: "talenttree",
    label: "+ Talent tree",
    block: {
      type: "talenttree",
      TreeKey: "paladin",
      Build: null,
    },
  },
  {
    key: "talentbuildmenu",
    label: "+ Talent menu",
    block: {
      type: "talentbuildmenu",
      TreeKey: "paladin",
      Builds: [
        {
          Name: "Default",
          IsDefault: true,
        },
      ],
      Selected: "Default",
    },
  },
  {
    key: "itemgrid",
    label: "+ Item grid",
    block: {
      type: "itemgrid",
      Columns: 4,
      Items: [
        {
          Name: "Item 1",
        },
        {
          Name: "Item 2",
        },
      ],
    },
  },
  {
    key: "spelllist",
    label: "+ Spell list",
    block: {
      type: "spelllist",
      Spells: [
        {
          Name: "Spell 1",
          Note: "",
        },
      ],
    },
  },
  {
    key: "rotationcard",
    label: "+ Rotation card",
    block: {
      type: "rotationcard",
      Sequence: [
        {
          Name: "Spell A",
        },
        {
          Name: "Spell B",
        },
      ],
    },
  },
];

const inputClass =
  "w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

function normalizeSection(value: string | null): SectionName {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "protection" || normalized === "prot") {
    return "Protection";
  }

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
  const normalized = value.trim().toLowerCase();

  const filtered = Array.from(normalized)
    .filter((character) => /[\p{L}\p{N}-]/u.test(character))
    .join("");

  const slug = filtered
    .split("-")
    .filter(Boolean)
    .join("-");

  return slug || "page";
}

function parseLayout(value: string): BuilderBlock[] {
  const parsed: unknown = JSON.parse(value.trim() || "[]");

  if (!Array.isArray(parsed)) {
    throw new Error("Layout JSON must be an array.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`Block ${index + 1} must be an object.`);
    }

    const type = (entry as { type?: unknown }).type;

    if (typeof type !== "string" || !type.trim()) {
      throw new Error(`Block ${index + 1} must have a type property.`);
    }

    return entry as BuilderBlock;
  });
}

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, {
    cache: "no-store",
  });

  const payload = await readApiJson<CsrfResponse>(response);

  if (!payload?.token) {
    throw new Error("The server did not return a CSRF token.");
  }

  return payload.token;
}

async function responseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | ErrorResponse
      | null;

    if (payload?.errors) {
      const errors = Object.values(payload.errors).flat();

      if (errors.length) {
        return errors.join(" ");
      }
    }

    return (
      payload?.message ||
      payload?.title ||
      payload?.error ||
      `Request failed with status ${response.status}.`
    );
  }

  const text = await response.text().catch(() => "");

  return text || `Request failed with status ${response.status}.`;
}

function cloneBlock(block: BuilderBlock): BuilderBlock {
  return JSON.parse(JSON.stringify(block)) as BuilderBlock;
}

export default function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [section, setSection] = useState<SectionName>(() =>
    normalizeSection(searchParams.get("section")),
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [jsonLayout, setJsonLayout] = useState("[]");
  const [editorOpen, setEditorOpen] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const finalSlug = useMemo(
    () => slugify(slug || title),
    [slug, title],
  );

  const addTemplate = (block: BuilderBlock) => {
    setError("");

    try {
      const blocks = parseLayout(jsonLayout);
      const nextLayout = [...blocks, cloneBlock(block)];

      setJsonLayout(JSON.stringify(nextLayout, null, 2));
      setMessage("Block added.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The layout JSON is invalid.",
      );
    }
  };

  const resetLayout = () => {
    setJsonLayout("[]");
    setPreviewHtml("");
    setError("");
    setMessage("Layout reset.");
  };

  const formatLayout = () => {
    setError("");

    try {
      const blocks = parseLayout(jsonLayout);
      setJsonLayout(JSON.stringify(blocks, null, 2));
      setMessage("JSON formatted.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The layout JSON is invalid.",
      );
    }
  };

  const renderPreview = async () => {
    if (previewing) {
      return;
    }

    setError("");
    setMessage("");
    setPreviewing(true);

    try {
      const blocks = parseLayout(jsonLayout);

      if (!blocks.length) {
        setPreviewHtml("");
        setMessage("The layout is empty.");
        return;
      }

      const response = await fetchBackend(
        backendEndpoints.pageBuilder.renderLayout,
        {
          method: "POST",
          cache: "no-store",
          headers: {
            Accept: "text/html",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(blocks),
        },
      );

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      setPreviewHtml(await response.text());
      setMessage("Preview updated.");
    } catch (caught) {
      setPreviewHtml("");
      setError(
        caught instanceof Error
          ? caught.message
          : "The preview could not be rendered.",
      );
    } finally {
      setPreviewing(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setMessage("");

    const normalizedTitle = title.trim();
    const normalizedSlug = slug.trim();

    if (!normalizedTitle) {
      setError("Title is required.");
      return;
    }

    if (normalizedTitle.length > 200) {
      setError("Title cannot exceed 200 characters.");
      return;
    }

    if (normalizedSlug.length > 100) {
      setError("Slug cannot exceed 100 characters.");
      return;
    }

    let normalizedLayout: string;

    try {
      normalizedLayout = JSON.stringify(parseLayout(jsonLayout), null, 2);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The layout JSON is invalid.",
      );
      return;
    }

    setSaving(true);

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetchBackend(createPageEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          section,
          title: normalizedTitle,
          slug: normalizedSlug || null,
          isPublished: true,
          jsonLayout: normalizedLayout,
        }),
      });

      if (!response.ok) {
        throw new Error(await responseMessage(response));
      }

      const created = await readApiJson<CreatePageResponse>(response);

      navigate(
        created.redirectUrl ||
          `/${created.section || section}/${created.slug || finalSlug}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The page could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Create Page</h1>
            <p className="mt-1 text-sm text-slate-400">
              Build a Holy, Protection, or Retribution content page.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditorOpen((current) => !current)}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
          >
            ✎ Editor ON/OFF
          </button>
        </div>

        {error ? (
          <div
            className="mb-5 rounded-lg border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {message}
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-6" noValidate>
          <section className="grid gap-5 rounded-xl border border-slate-700 bg-slate-900 p-6 md:grid-cols-3">
            <Field label="Section" htmlFor="page-section" required>
              <select
                id="page-section"
                name="section"
                value={section}
                onChange={(event) =>
                  setSection(event.target.value as SectionName)
                }
                disabled={saving}
                className={inputClass}
              >
                <option value="Holy">Holy</option>
                <option value="Protection">Protection</option>
                <option value="Retribution">Retribution</option>
              </select>
            </Field>

            <Field label="Title" htmlFor="page-title" required>
              <input
                id="page-title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                disabled={saving}
                className={inputClass}
                autoFocus
                required
              />
            </Field>

            <Field label="Slug" htmlFor="page-slug">
              <input
                id="page-slug"
                name="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                maxLength={100}
                disabled={saving}
                placeholder={finalSlug}
                className={inputClass}
              />

              <span className="mt-1 block text-xs text-slate-500">
                Final slug: {finalSlug}
              </span>
            </Field>
          </section>

          <div
            className={`grid gap-6 ${
              editorOpen ? "lg:grid-cols-[minmax(19rem,24rem)_1fr]" : ""
            }`}
          >
            {editorOpen ? (
              <aside className="self-start rounded-xl border border-slate-700 bg-[#2b2f33] shadow-xl lg:sticky lg:top-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-[#262a2e] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-950 px-2 py-1 text-xs font-semibold">
                      Builder
                    </span>
                    <strong>Create Page</strong>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetLayout}
                      disabled={saving || previewing}
                      className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={() => void renderPreview()}
                      disabled={saving || previewing}
                      className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                    >
                      Preview
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.key}
                        type="button"
                        onClick={() => addTemplate(template.block)}
                        disabled={saving || previewing}
                        className="rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    Type JSON or use the buttons above. Preview renders the
                    layout through the backend block renderer.
                  </p>

                  <textarea
                    value={jsonLayout}
                    onChange={(event) => setJsonLayout(event.target.value)}
                    disabled={saving}
                    spellCheck={false}
                    aria-label="Page layout JSON"
                    className="mt-3 min-h-[360px] w-full resize-y rounded-md border border-slate-600 bg-[#1f2327] px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-blue-500 disabled:opacity-60"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={formatLayout}
                      disabled={saving || previewing}
                      className="rounded bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600 disabled:opacity-60"
                    >
                      Format JSON
                    </button>

                    <button
                      type="button"
                      onClick={() => void renderPreview()}
                      disabled={saving || previewing}
                      className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
                    >
                      {previewing ? "Rendering..." : "Preview"}
                    </button>
                  </div>
                </div>
              </aside>
            ) : null}

            <section className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-6">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">
                Use the editor to build the layout. The JSON is checked before
                the page is created.
              </div>

              <div className="mt-5 min-h-24 rounded-lg border border-dashed border-slate-600 bg-slate-950/50 p-5">
                {previewing ? (
                  <p className="text-sm text-slate-400">
                    Rendering preview...
                  </p>
                ) : previewHtml ? (
                  <div
                    className="page-builder-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    The preview will appear here.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || previewing}
              className="rounded-md bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create"}
            </button>

            <Link
              to="/Admin"
              className="rounded-md bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </span>

      {children}
    </label>
  );
}