"use client";

import { useEffect, useMemo, useState } from "react";
import BuilderNavigation from "@/components/admin/page-builder/BuilderNavigation";
import { fetchBackend, readApiJson } from "@/config/api";
import { Link } from "@/router/nextCompat";

type SectionName = "Holy" | "Protection" | "Retribution";

type DynamicPage = {
  id: number;
  section: SectionName;
  title: string;
  slug: string;
  isPublished: boolean;
  updatedAt?: string;
};

type HardcodedPage = {
  source: "hardcoded";
  section: SectionName;
  title: string;
  slug: string;
  path: string;
};

export const PAGE_SECTIONS: SectionName[] = [
  "Holy",
  "Protection",
  "Retribution",
];

const HARD_CODED_SLUGS = [
  "Overview",
  "Gear",
  "Talents",
  "Consumables",
  "Rotation",
  "Stats",
] as const;

export const HARDCODED_PAGES: HardcodedPage[] = PAGE_SECTIONS.flatMap(
  (section) =>
    HARD_CODED_SLUGS.map((slug) => ({
      source: "hardcoded" as const,
      section,
      title: slug,
      slug,
      path: `/${section}/${slug}`,
    })),
);

function normalizeSection(value: string): SectionName {
  const normalized = value.trim().toLowerCase();
  if (normalized === "protection") return "Protection";
  if (normalized === "retribution") return "Retribution";
  return "Holy";
}

export default function PageBuilderIndex() {
  const [dynamicPages, setDynamicPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetchBackend("/Admin/api/page-builder/pages", {
          cache: "no-store",
          signal: controller.signal,
        });
        const pages = await readApiJson<DynamicPage[]>(response);
        if (!controller.signal.aborted) {
          setDynamicPages(
            pages.map((page) => ({
              ...page,
              section: normalizeSection(page.section),
            })),
          );
        }
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load dynamic pages.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const grouped = useMemo(
    () =>
      PAGE_SECTIONS.map((section) => ({
        section,
        hardcoded: HARDCODED_PAGES.filter((page) => page.section === section),
        dynamic: dynamicPages
          .filter((page) => page.section === section)
          .sort((a, b) => a.title.localeCompare(b.title)),
      })),
    [dynamicPages],
  );

  return (
    <main className="px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <BuilderNavigation />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Page Builder</h1>
            <p className="mt-1 text-sm text-slate-400">
              Hardcoded pages stay protected. New pages are managed separately.
            </p>
          </div>

          <Link
            to="/Admin/PageBuilder/Create"
            className="rounded-md bg-amber-500 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-400"
          >
            + Add page
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

        {loading ? (
          <p className="text-slate-400">Loading pages...</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ section, hardcoded, dynamic }) => (
              <section
                key={section}
                className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70"
              >
                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                  <div>
                    <h2 className="text-xl font-semibold">{section}</h2>
                    <p className="text-sm text-slate-400">
                      {hardcoded.length + dynamic.length} pages
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    Category: {section}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-950/70 text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">Page</th>
                        <th className="px-5 py-3 font-medium">Slug</th>
                        <th className="px-5 py-3 font-medium">Source</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {hardcoded.map((page) => (
                        <tr key={`hardcoded:${page.path}`}>
                          <td className="px-5 py-4 font-medium">{page.title}</td>
                          <td className="px-5 py-4 font-mono text-slate-300">
                            {page.slug}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs">
                              Hardcoded constant
                            </span>
                          </td>
                          <td className="px-5 py-4 text-emerald-300">Protected</td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              to={page.path}
                              className="rounded bg-slate-700 px-3 py-1.5 hover:bg-slate-600"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {dynamic.map((page) => (
                        <tr key={`dynamic:${page.id}`}>
                          <td className="px-5 py-4 font-medium">{page.title}</td>
                          <td className="px-5 py-4 font-mono text-slate-300">
                            {page.slug}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-300">
                              Page Builder
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {page.isPublished ? (
                              <span className="text-emerald-300">Published</span>
                            ) : (
                              <span className="text-slate-400">Draft</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/${page.section}/${page.slug}`}
                                className="rounded bg-slate-700 px-3 py-1.5 hover:bg-slate-600"
                              >
                                View
                              </Link>
                              <Link
                                to={`/Admin/PageBuilder/Edit?id=${page.id}`}
                                className="rounded bg-blue-700 px-3 py-1.5 hover:bg-blue-600"
                              >
                                Edit
                              </Link>
                              <Link
                                to={`/Admin/PageBuilder/Delete?id=${page.id}`}
                                className="rounded bg-red-800 px-3 py-1.5 hover:bg-red-700"
                              >
                                Delete
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
