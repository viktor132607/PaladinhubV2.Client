"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  backendEndpoints,
  fetchBackend,
} from "@/config/api";
import { Link } from "@/router/nextCompat";

type DiscussionPost = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdOn: string;
  commentsCount: number;
  likes: number;
  canDelete: boolean;
};

function extractRouteId(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(
      value,
      "http://paladinhub.local",
    );

    const queryId =
      url.searchParams.get("id");

    if (queryId) {
      return queryId;
    }

    const segments = url.pathname
      .split("/")
      .filter(Boolean);

    return (
      segments.at(-1) ?? ""
    );
  } catch {
    return "";
  }
}

function parseNumber(
  value: string,
): number {
  const match = value.match(/\d+/);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[0]);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function parseCreatedOn(
  metaText: string,
): string {
  const separatorIndex =
    metaText.lastIndexOf("•");

  if (separatorIndex < 0) {
    return "";
  }

  return metaText
    .slice(separatorIndex + 1)
    .trim();
}

function parseDiscussionPosts(
  html: string,
): DiscussionPost[] {
  const documentNode =
    new DOMParser().parseFromString(
      html,
      "text/html",
    );

  return Array.from(
    documentNode.querySelectorAll<HTMLElement>(
      ".discussion-item",
    ),
  )
    .map(
      (
        element,
      ): DiscussionPost | null => {
        const titleLink =
          element.querySelector<HTMLAnchorElement>(
            ".discussion-title a",
          );

        const id = extractRouteId(
          titleLink?.getAttribute(
            "href",
          ) ?? null,
        );

        const title =
          titleLink?.textContent?.trim() ??
          "";

        if (!id || !title) {
          return null;
        }

        const meta =
          element.querySelector<HTMLElement>(
            ".discussion-meta",
          );

        const authorName =
          meta
            ?.querySelector<HTMLElement>(
              ".highlight",
            )
            ?.textContent?.trim() ||
          "Unknown user";

        const content =
          element
            .querySelector<HTMLElement>(
              ".discussion-preview",
            )
            ?.textContent?.trim() ??
          "";

        const statsText =
          element
            .querySelector<HTMLElement>(
              ".discussion-stats",
            )
            ?.textContent?.trim() ??
          "";

        const commentsMatch =
          statsText.match(
            /💬\s*(\d+)/u,
          );

        const likesMatch =
          statsText.match(
            /❤️\s*(\d+)/u,
          );

        const deleteForm =
          Array.from(
            element.querySelectorAll<HTMLFormElement>(
              "form",
            ),
          ).find((form) =>
            (
              form.getAttribute(
                "action",
              ) ?? ""
            )
              .toLowerCase()
              .includes(
                "/discussions/delete",
              ),
          );

        return {
          id,
          title,
          content,
          authorName,

          createdOn:
            parseCreatedOn(
              meta?.textContent?.trim() ??
                "",
            ),

          commentsCount:
            commentsMatch
              ? parseNumber(
                  commentsMatch[1],
                )
              : 0,

          likes:
            likesMatch
              ? parseNumber(
                  likesMatch[1],
                )
              : 0,

          canDelete:
            deleteForm !== undefined,
        };
      },
    )
    .filter(
      (
        post,
      ): post is DiscussionPost =>
        post !== null,
    );
}

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const text =
    await response.text().catch(
      () => "",
    );

  if (!text.trim()) {
    return fallback;
  }

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    try {
      const payload = JSON.parse(
        text,
      ) as {
        message?: string;
        title?: string;
        error?: string;
      };

      return (
        payload.message ||
        payload.title ||
        payload.error ||
        fallback
      );
    } catch {
      return fallback;
    }
  }

  try {
    const documentNode =
      new DOMParser().parseFromString(
        text,
        "text/html",
      );

    const validationMessages =
      Array.from(
        documentNode.querySelectorAll(
          ".validation-summary-errors li, .field-validation-error",
        ),
      )
        .map((element) =>
          element.textContent?.trim(),
        )
        .filter(
          (
            message,
          ): message is string =>
            Boolean(message),
        );

    if (
      validationMessages.length > 0
    ) {
      return Array.from(
        new Set(
          validationMessages,
        ),
      ).join(" ");
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function Discussions() {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [posts, setPosts] =
    useState<DiscussionPost[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    workingId,
    setWorkingId,
  ] = useState<string | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await fetchBackend(
            backendEndpoints.discussions
              .index,
            {
              method: "GET",
              cache: "no-store",
              signal,

              headers: {
                Accept: "text/html",
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            await readErrorMessage(
              response,
              `Discussions could not be loaded (${response.status}).`,
            ),
          );
        }

        const html =
          await response.text();

        if (signal?.aborted) {
          return;
        }

        setPosts(
          parseDiscussionPosts(html),
        );
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setPosts([]);

        setError(
          caught instanceof Error
            ? caught.message
            : "Discussions could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const remove = async (
    post: DiscussionPost,
  ): Promise<void> => {
    if (workingId !== null) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this discussion?",
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(post.id);
    setError(null);

    try {
      const response =
        await fetchBackend(
          `/Discussions/Delete?id=${encodeURIComponent(
            post.id,
          )}`,
          {
            method: "POST",
            cache: "no-store",
            redirect: "follow",

            headers: {
              Accept:
                "application/json, text/html;q=0.9",
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            `The discussion could not be deleted (${response.status}).`,
          ),
        );
      }

      setPosts((current) =>
        current.filter(
          (item) =>
            item.id !== post.id,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The discussion could not be deleted.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          <i
            className="fa-solid fa-comments"
            aria-hidden="true"
          />{" "}
          Discussions
        </h1>

        {!authLoading &&
        isAuthenticated ? (
          <Link
            to="/Discussions/Create"
            className="rounded border border-blue-400 px-4 py-2 font-semibold text-blue-300 hover:bg-blue-500/10"
          >
            <i
              className="fa-solid fa-plus"
              aria-hidden="true"
            />{" "}
            New Topic
          </Link>
        ) : null}
      </div>

      <div className="mb-7 h-px bg-amber-400/70" />

      {error ? (
        <div
          className="mb-5 rounded border border-red-500/60 bg-red-950/40 p-3 text-red-200"
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => {
              void load();
            }}
            disabled={loading}
            className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-300">
          Loading discussions…
        </p>
      ) : null}

      {!loading &&
      !error &&
      posts.length === 0 ? (
        <div className="rounded border border-blue-400/50 bg-blue-950/30 p-4 text-blue-100">
          No topics yet. Be the first
          to start a discussion!
        </div>
      ) : null}

      {!loading &&
      posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border border-amber-400 bg-[#1a1a1a] p-4 shadow-lg"
            >
              <h2 className="text-2xl font-semibold">
                <Link
                  to={`/Discussions/Details/${encodeURIComponent(
                    post.id,
                  )}`}
                  className="text-amber-200 hover:text-amber-100 hover:underline"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                by{" "}
                <span className="font-semibold text-amber-300">
                  {post.authorName}
                </span>{" "}
                •{" "}
                {post.createdOn ||
                  "Unknown date"}
              </p>

              <p className="mt-3 whitespace-pre-wrap break-words text-slate-200">
                {post.content}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                💬 {post.commentsCount} •
                ❤️ {post.likes}
              </p>

              {post.canDelete ? (
                <button
                  type="button"
                  disabled={
                    workingId !== null
                  }
                  onClick={() => {
                    void remove(post);
                  }}
                  className="mt-3 rounded border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i
                    className="fa-solid fa-trash"
                    aria-hidden="true"
                  />{" "}
                  {workingId === post.id
                    ? "Deleting…"
                    : "Delete"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {!authLoading &&
      !isAuthenticated ? (
        <div className="mt-6 rounded border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          <Link
            to="/Account/Login"
            className="text-blue-300 underline"
          >
            Log in
          </Link>{" "}
          to start a new topic.
        </div>
      ) : null}
    </main>
  );
}