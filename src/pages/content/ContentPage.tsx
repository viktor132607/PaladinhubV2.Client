"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { HtmlContent } from "@/components/migration/MigratedView";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import {
  Link,
  useParams,
} from "@/router/nextCompat";

type ContentPageModel = {
  id: number;
  section: string;
  slug: string;
  title: string;
  jsonLayout?: string | null;
  isPublished: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  rowVersionBase64?: string | null;
};

type ContentPageResponse = {
  page: ContentPageModel;
  html: string;
  canEdit: boolean;
  renderError?: string | null;
};

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function property(
  source: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): unknown {
  return (
    source[camelCaseName] ??
    source[pascalCaseName]
  );
}

function normalizeResponse(
  payload: unknown,
  section: string,
  slug: string,
): ContentPageResponse {
  const root = asRecord(payload);

  const rawPage = asRecord(
    property(
      root,
      "page",
      "Page",
    ),
  );

  const page: ContentPageModel = {
    id: Number(
      property(
        rawPage,
        "id",
        "Id",
      ) ?? 0,
    ),

    section: String(
      property(
        rawPage,
        "section",
        "Section",
      ) ?? section,
    ),

    slug: String(
      property(
        rawPage,
        "slug",
        "Slug",
      ) ?? slug,
    ),

    title:
      String(
        property(
          rawPage,
          "title",
          "Title",
        ) ?? "Content Page",
      ).trim() || "Content Page",

    jsonLayout:
      typeof property(
        rawPage,
        "jsonLayout",
        "JsonLayout",
      ) === "string"
        ? String(
            property(
              rawPage,
              "jsonLayout",
              "JsonLayout",
            ),
          )
        : null,

    isPublished:
      property(
        rawPage,
        "isPublished",
        "IsPublished",
      ) === true,

    updatedAt:
      typeof property(
        rawPage,
        "updatedAt",
        "UpdatedAt",
      ) === "string"
        ? String(
            property(
              rawPage,
              "updatedAt",
              "UpdatedAt",
            ),
          )
        : null,

    updatedBy:
      typeof property(
        rawPage,
        "updatedBy",
        "UpdatedBy",
      ) === "string"
        ? String(
            property(
              rawPage,
              "updatedBy",
              "UpdatedBy",
            ),
          )
        : null,

    rowVersionBase64:
      typeof property(
        rawPage,
        "rowVersionBase64",
        "RowVersionBase64",
      ) === "string"
        ? String(
            property(
              rawPage,
              "rowVersionBase64",
              "RowVersionBase64",
            ),
          )
        : null,
  };

  return {
    page,

    html:
      typeof property(
        root,
        "html",
        "Html",
      ) === "string"
        ? String(
            property(
              root,
              "html",
              "Html",
            ),
          )
        : "",

    canEdit:
      property(
        root,
        "canEdit",
        "CanEdit",
      ) === true,

    renderError:
      typeof property(
        root,
        "renderError",
        "RenderError",
      ) === "string"
        ? String(
            property(
              root,
              "renderError",
              "RenderError",
            ),
          )
        : null,
  };
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function ContentPage() {
  const params =
    useParams<{
      section: string;
      slug: string;
    }>();

  const section =
    params.section?.trim() ?? "";

  const slug =
    params.slug?.trim() ?? "";

  const [content, setContent] =
    useState<ContentPageResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      if (!section || !slug) {
        setContent(null);
        setError(
          "The page route is incomplete.",
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.paladin.page(
              section,
              slug,
            ),
            {
              method: "GET",
              cache: "no-store",
              signal,
            },
          );

        const payload =
          await readApiJson<unknown>(
            response,
          );

        if (signal?.aborted) {
          return;
        }

        setContent(
          normalizeResponse(
            payload,
            section,
            slug,
          ),
        );
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setContent(null);

        setError(
          caught instanceof Error
            ? caught.message
            : "The page could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      section,
      slug,
    ],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-16 text-center text-slate-400">
        Loading page…
      </main>
    );
  }

  if (!content) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-16 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-xl border border-red-500/40 bg-red-950/30 p-8 text-center">
          <h1 className="text-3xl font-bold">
            Page not found
          </h1>

          <p
            className="mt-4 text-red-200"
            role="alert"
          >
            {error ||
              "The requested page could not be loaded."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                void load();
              }}
              className="rounded bg-amber-400 px-5 py-2.5 font-semibold text-slate-950"
            >
              Try again
            </button>

            <Link
              to="/"
              className="rounded border border-slate-600 px-5 py-2.5 font-semibold"
            >
              Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100">
      <article className="mx-auto max-w-5xl rounded-xl border border-slate-800 bg-slate-900 p-6">
        <header className="border-b border-slate-800 pb-5">
          <h1 className="text-3xl font-bold">
            {content.page.title}
          </h1>
        </header>

        {content.renderError ? (
          <div
            className="mt-5 rounded border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-amber-200"
            role="alert"
          >
            Some page blocks could not be
            rendered:{" "}
            {content.renderError}
          </div>
        ) : null}

        {content.html.trim() ? (
          <HtmlContent
            html={content.html}
            className="mt-6"
          />
        ) : (
          <p className="mt-6 text-slate-400">
            This page does not contain any
            published content.
          </p>
        )}
      </article>
    </main>
  );
}