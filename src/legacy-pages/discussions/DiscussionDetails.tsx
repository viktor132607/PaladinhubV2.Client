"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  backendEndpoints,
  fetchBackend,
  readApiJson,
} from "@/config/api";
import {
  Link,
  useNavigate,
  useParams,
} from "@/router/nextCompat";

type JsonRecord = Record<string, unknown>;

type DiscussionComment = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdOn: string;
  likes: number;
  likedByCurrentUser: boolean;
};

type DiscussionPost = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdOn: string;
  likes: number;
  likedByCurrentUser: boolean;
  comments: DiscussionComment[];
  deleteAllowed?: boolean;
};

type CsrfResponse = {
  token?: string;
};

type ApiError = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
};

function asRecord(value: unknown): JsonRecord {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function text(value: unknown): string {
  return value === null || value === undefined
    ? ""
    : String(value).trim();
}

function number(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function bool(value: unknown): boolean {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed)
    ? 0
    : parsed;
}

function formatDate(value: string): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeComment(
  value: unknown,
  index: number,
): DiscussionComment {
  const source = asRecord(value);
  const author = asRecord(
    source.author ??
      source.Author,
  );

  return {
    id:
      text(
        source.id ??
          source.Id,
      ) || `comment-${index}`,

    authorId: text(
      source.authorId ??
        source.AuthorId,
    ),

    authorName:
      text(
        source.authorName ??
          source.AuthorName ??
          author.userName ??
          author.UserName ??
          author.username ??
          author.Username,
      ) || "Unknown user",

    content: text(
      source.content ??
        source.Content,
    ),

    createdOn: text(
      source.createdOn ??
        source.CreatedOn,
    ),

    likes: Math.max(
      0,
      number(
        source.likes ??
          source.Likes,
      ),
    ),

    likedByCurrentUser: bool(
      source.likedByCurrentUser ??
        source.LikedByCurrentUser ??
        source.alreadyLiked ??
        source.AlreadyLiked,
    ),
  };
}

function normalizePost(
  value: unknown,
  requestedId: string,
): DiscussionPost {
  const wrapper = asRecord(value);

  const source = asRecord(
    wrapper.post ??
      wrapper.Post ??
      value,
  );

  const author = asRecord(
    source.author ??
      source.Author,
  );

  const rawComments =
    source.comments ??
    source.Comments;

  const deleteValue =
    wrapper.canDelete ??
    wrapper.CanDelete ??
    source.canDelete ??
    source.CanDelete;

  return {
    id:
      text(
        source.id ??
          source.Id,
      ) || requestedId,

    title: text(
      source.title ??
        source.Title,
    ),

    content: text(
      source.content ??
        source.Content,
    ),

    authorId: text(
      source.authorId ??
        source.AuthorId,
    ),

    authorName:
      text(
        source.authorName ??
          source.AuthorName ??
          author.userName ??
          author.UserName ??
          author.username ??
          author.Username,
      ) || "Unknown user",

    createdOn: text(
      source.createdOn ??
        source.CreatedOn,
    ),

    likes: Math.max(
      0,
      number(
        source.likes ??
          source.Likes,
      ),
    ),

    likedByCurrentUser: bool(
      source.likedByCurrentUser ??
        source.LikedByCurrentUser ??
        wrapper.alreadyLikedPost ??
        wrapper.AlreadyLikedPost,
    ),

    comments: Array.isArray(rawComments)
      ? rawComments
          .map(normalizeComment)
          .sort(
            (left, right) =>
              timestamp(right.createdOn) -
              timestamp(left.createdOn),
          )
      : [],

    deleteAllowed:
      deleteValue === undefined
        ? undefined
        : bool(deleteValue),
  };
}

function actionContains(
  form: HTMLFormElement,
  actionName: string,
): boolean {
  const action =
    form.getAttribute("action") ??
    "";

  return action
    .toLowerCase()
    .includes(
      `/discussions/${actionName.toLowerCase()}`,
    );
}

function extractActionId(
  action: string | null,
): string {
  if (!action) {
    return "";
  }

  try {
    const url = new URL(
      action,
      "http://paladinhub.local",
    );

    const queryId =
      url.searchParams.get("id");

    if (queryId) {
      return queryId;
    }

    const segments =
      url.pathname
        .split("/")
        .filter(Boolean);

    return segments.at(-1) ?? "";
  } catch {
    return "";
  }
}

function parseLikes(
  value: string,
): number {
  const match = value.match(/\d+/);

  return match
    ? Number(match[0])
    : 0;
}

function parseDiscussionHtml(
  html: string,
  requestedId: string,
): DiscussionPost {
  const documentNode =
    new DOMParser().parseFromString(
      html,
      "text/html",
    );

  const article =
    documentNode.querySelector<HTMLElement>(
      ".discussion-item",
    );

  if (!article) {
    throw new Error(
      "The server returned a page without discussion data.",
    );
  }

  const title =
    article
      .querySelector("h1, h2, h3")
      ?.textContent
      ?.trim() ?? "";

  if (!title) {
    throw new Error(
      "The server returned an invalid discussion.",
    );
  }

  const meta =
    article.querySelector<HTMLElement>(
      ".discussion-meta",
    );

  const authorName =
    meta
      ?.querySelector<HTMLElement>(
        ".highlight",
      )
      ?.textContent
      ?.trim() ||
    "Unknown user";

  const metaText =
    meta?.textContent?.trim() ?? "";

  const dateSeparator =
    metaText.lastIndexOf("•");

  const createdOn =
    dateSeparator >= 0
      ? metaText
          .slice(dateSeparator + 1)
          .trim()
      : "";

  const content =
    article
      .querySelector<HTMLElement>(
        "p.mt-2",
      )
      ?.textContent
      ?.trim() ??
    article
      .querySelector<HTMLElement>("p")
      ?.textContent
      ?.trim() ??
    "";

  const articleForms =
    Array.from(
      article.querySelectorAll<HTMLFormElement>(
        "form",
      ),
    );

  const likeForm =
    articleForms.find((form) =>
      actionContains(form, "Like"),
    );

  const likeButtonText =
    likeForm
      ?.querySelector("button")
      ?.textContent
      ?.trim() ?? "";

  const deleteAllowed =
    Array.from(
      documentNode.querySelectorAll<HTMLFormElement>(
        "form",
      ),
    ).some((form) =>
      actionContains(form, "Delete"),
    );

  const commentsHeading =
    Array.from(
      documentNode.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, h5",
      ),
    ).find((heading) =>
      heading.textContent
        ?.trim()
        .toLowerCase()
        .startsWith("comments"),
    );

  const commentsContainer =
    commentsHeading?.nextElementSibling;

  const commentElements =
    commentsContainer
      ? Array.from(
          commentsContainer.children,
        ).filter(
          (
            element,
          ): element is HTMLElement =>
            element instanceof HTMLElement,
        )
      : [];

  const comments =
    commentElements
      .map(
        (
          element,
          index,
        ): DiscussionComment | null => {
          const header =
            Array.from(
              element.children,
            ).find(
              (child) =>
                child.querySelector(
                  "b, strong",
                ) !== null &&
                child.querySelector(
                  "small",
                ) !== null,
            );

          if (!header) {
            return null;
          }

          const commentLikeForm =
            element.querySelector<HTMLFormElement>(
              "form",
            );

          const commentLikeButtonText =
            commentLikeForm
              ?.querySelector("button")
              ?.textContent
              ?.trim() ?? "";

          const contentElement =
            Array.from(
              element.children,
            ).find(
              (child) =>
                child !== header &&
                child.tagName.toLowerCase() ===
                  "div",
            );

          return {
            id:
              extractActionId(
                commentLikeForm?.getAttribute(
                  "action",
                ) ?? null,
              ) ||
              `comment-${index}`,

            authorId: "",

            authorName:
              header
                .querySelector(
                  "b, strong",
                )
                ?.textContent
                ?.trim() ||
              "Unknown user",

            createdOn:
              header
                .querySelector("small")
                ?.textContent
                ?.trim() ?? "",

            content:
              contentElement
                ?.textContent
                ?.trim() ?? "",

            likes: parseLikes(
              commentLikeButtonText,
            ),

            likedByCurrentUser:
              commentLikeButtonText
                .toLowerCase()
                .includes("unlike"),
          };
        },
      )
      .filter(
        (
          comment,
        ): comment is DiscussionComment =>
          comment !== null,
      );

  return {
    id: requestedId,
    title,
    content,
    authorId: "",
    authorName,
    createdOn,
    likes: parseLikes(
      likeButtonText,
    ),
    likedByCurrentUser:
      likeButtonText
        .toLowerCase()
        .includes("unlike"),
    comments,
    deleteAllowed,
  };
}

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(
    backendEndpoints.auth.csrf,
    {
      cache: "no-store",
    },
  );

  const payload =
    await readApiJson<CsrfResponse>(
      response,
    );

  if (!payload?.token) {
    throw new Error(
      "The server did not return a CSRF token.",
    );
  }

  return payload.token;
}

async function readResponseError(
  response: Response,
  fallback: string,
): Promise<string> {
  const responseText =
    await response.text().catch(
      () => "",
    );

  if (!responseText.trim()) {
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
      const payload =
        JSON.parse(
          responseText,
        ) as ApiError;

      if (payload.errors) {
        const errors =
          Object.values(
            payload.errors,
          )
            .flatMap((value) =>
              Array.isArray(value)
                ? value
                : [value],
            )
            .map((value) =>
              value.trim(),
            )
            .filter(Boolean);

        if (errors.length > 0) {
          return errors.join(" ");
        }
      }

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
        responseText,
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
            value,
          ): value is string =>
            Boolean(value),
        );

    if (
      validationMessages.length > 0
    ) {
      return Array.from(
        new Set(validationMessages),
      ).join(" ");
    }

    const pageTitle =
      documentNode
        .querySelector("title")
        ?.textContent
        ?.trim();

    if (
      pageTitle &&
      !pageTitle
        .toLowerCase()
        .includes("paladinhub")
    ) {
      return pageTitle;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

async function loadDiscussion(
  id: string,
  signal?: AbortSignal,
): Promise<DiscussionPost> {
  const response = await fetchBackend(
    backendEndpoints.discussions.details(
      id,
    ),
    {
      method: "GET",
      cache: "no-store",
      signal,
      headers: {
        Accept:
          "application/json, text/html;q=0.9",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await readResponseError(
        response,
        response.status === 404
          ? "Discussion not found."
          : `The discussion could not be loaded (${response.status}).`,
      ),
    );
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
    const post = normalizePost(
      await response.json(),
      id,
    );

    if (!post.id || !post.title) {
      throw new Error(
        "The server returned an invalid discussion.",
      );
    }

    return post;
  }

  return parseDiscussionHtml(
    await response.text(),
    id,
  );
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

export default function DiscussionDetails() {
  const { id = "" } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    loading: authLoading,
    hasRole,
  } = useAuth();

  const [post, setPost] =
    useState<DiscussionPost | null>(
      null,
    );

  const [comment, setComment] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      signal?: AbortSignal,
      showLoading = true,
    ): Promise<void> => {
      if (!id) {
        setPost(null);
        setError(
          "The discussion identifier is missing.",
        );
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      try {
        const result =
          await loadDiscussion(
            id,
            signal,
          );

        if (signal?.aborted) {
          return;
        }

        setPost(result);
      } catch (caught) {
        if (
          signal?.aborted ||
          isAbortError(caught)
        ) {
          return;
        }

        setPost(null);

        setError(
          caught instanceof Error
            ? caught.message
            : "The discussion could not be loaded.",
        );
      } finally {
        if (
          showLoading &&
          !signal?.aborted
        ) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(
      controller.signal,
      true,
    );

    return () => {
      controller.abort();
    };
  }, [load]);

  const performAction =
    async (
      key: string,
      path: string,
      body?: URLSearchParams,
    ): Promise<boolean> => {
      if (working !== null) {
        return false;
      }

      setWorking(key);
      setError(null);

      try {
        const csrfToken =
          await getCsrfToken();

        const response =
          await fetchBackend(
            path,
            {
              method: "POST",
              cache: "no-store",
              redirect: "follow",

              headers: {
                Accept:
                  "application/json, text/html;q=0.9",

                "Content-Type":
                  "application/x-www-form-urlencoded;charset=UTF-8",

                "X-CSRF-TOKEN":
                  csrfToken,
              },

              body:
                body ??
                new URLSearchParams(),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readResponseError(
              response,
              `The action could not be completed (${response.status}).`,
            ),
          );
        }

        await load(
          undefined,
          false,
        );

        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The action could not be completed.",
        );

        return false;
      } finally {
        setWorking(null);
      }
    };

  const canDelete = Boolean(
    post &&
      isAuthenticated &&
      (
        post.deleteAllowed !==
        undefined
          ? post.deleteAllowed
          : hasRole("Admin") ||
            user?.id ===
              post.authorId
      ),
  );

  const addComment = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!post) {
      return;
    }

    const cleanComment =
      comment.trim();

    if (!cleanComment) {
      setError(
        "Comment is required.",
      );
      return;
    }

    const succeeded =
      await performAction(
        "comment",
        `/Discussions/AddComment?id=${encodeURIComponent(
          post.id,
        )}`,
        new URLSearchParams({
          NewComment:
            cleanComment,
        }),
      );

    if (succeeded) {
      setComment("");
    }
  };

  const deleteDiscussion =
    async (): Promise<void> => {
      if (
        !post ||
        working !== null
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this discussion?",
        );

      if (!confirmed) {
        return;
      }

      setWorking("delete");
      setError(null);

      try {
        const csrfToken =
          await getCsrfToken();

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

                "Content-Type":
                  "application/x-www-form-urlencoded;charset=UTF-8",

                "X-CSRF-TOKEN":
                  csrfToken,
              },

              body:
                new URLSearchParams(),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readResponseError(
              response,
              `The discussion could not be deleted (${response.status}).`,
            ),
          );
        }

        navigate(
          "/discussions",
          {
            replace: true,
          },
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "The discussion could not be deleted.",
        );

        setWorking(null);
      }
    };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-slate-200">
        Loading discussion…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <div className="mb-4 flex flex-wrap gap-3">
        <Link
          to="/discussions"
          className="rounded border border-blue-400 px-4 py-2 text-blue-300 hover:bg-blue-500/10"
        >
          ← Back to Discussions
        </Link>

        {canDelete ? (
          <button
            type="button"
            onClick={() => {
              void deleteDiscussion();
            }}
            disabled={
              working !== null
            }
            className="rounded border border-red-500 px-4 py-2 text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i
              className="fa-solid fa-trash"
              aria-hidden="true"
            />{" "}
            {working === "delete"
              ? "Deleting…"
              : "Delete Discussion"}
          </button>
        ) : null}
      </div>

      {error ? (
        <div
          className="mb-4 rounded border border-red-500/60 bg-red-950/40 p-3 text-red-200"
          role="alert"
        >
          <p>{error}</p>

          {!post ? (
            <button
              type="button"
              onClick={() => {
                void load();
              }}
              disabled={loading}
              className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40 disabled:opacity-50"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!post ? (
        <div className="rounded border border-slate-700 bg-slate-950 p-6">
          Discussion not found.
        </div>
      ) : (
        <>
          <article className="rounded-lg border border-amber-400 bg-[#1a1a1a] p-5 shadow-lg">
            <h1 className="text-3xl font-bold">
              {post.title}
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              by{" "}
              <span className="font-semibold text-amber-300">
                {post.authorName}
              </span>{" "}
              •{" "}
              {formatDate(
                post.createdOn,
              )}
            </p>

            <p className="mt-5 whitespace-pre-wrap break-words text-slate-100">
              {post.content}
            </p>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  void performAction(
                    "like-post",
                    `/Discussions/Like?id=${encodeURIComponent(
                      post.id,
                    )}`,
                  );
                }}
                disabled={
                  working !== null
                }
                className="mt-5 rounded border border-red-500 px-4 py-2 text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ❤️ {post.likes}{" "}
                {post.likedByCurrentUser
                  ? "Unlike"
                  : "Like"}
              </button>
            ) : null}
          </article>

          <h2 className="mt-8 text-2xl font-bold">
            Comments (
            {post.comments.length})
          </h2>

          <div className="mt-4 space-y-4">
            {post.comments.map(
              (
                entry,
                index,
              ) => (
                <article
                  key={`${entry.id}-${index}`}
                  className="rounded-lg border border-amber-400 bg-[#1a1a1a] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p>
                      <strong>
                        {entry.authorName}
                      </strong>{" "}
                      •{" "}
                      <span className="text-sm text-slate-400">
                        {formatDate(
                          entry.createdOn,
                        )}
                      </span>
                    </p>

                    {isAuthenticated &&
                    !entry.id.startsWith(
                      "comment-",
                    ) ? (
                      <button
                        type="button"
                        onClick={() => {
                          void performAction(
                            `comment-like-${entry.id}`,
                            `/Discussions/LikeComment?id=${encodeURIComponent(
                              entry.id,
                            )}`,
                          );
                        }}
                        disabled={
                          working !==
                          null
                        }
                        className="rounded border border-red-500 px-3 py-1 text-sm text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ❤️ {entry.likes}{" "}
                        {entry.likedByCurrentUser
                          ? "Unlike"
                          : "Like"}
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-slate-200">
                    {entry.content}
                  </p>
                </article>
              ),
            )}

            {post.comments.length ===
            0 ? (
              <p className="text-slate-400">
                No comments yet.
              </p>
            ) : null}
          </div>

          {authLoading ? (
            <div className="mt-5 rounded border border-slate-700 bg-slate-950 p-4 text-slate-400">
              Checking your account…
            </div>
          ) : isAuthenticated ? (
            <form
              onSubmit={addComment}
              className="mt-6 rounded-lg border border-amber-400 bg-[#1a1a1a] p-4"
            >
              <label
                htmlFor="new-comment"
                className="mb-2 block font-semibold"
              >
                Add a comment
              </label>

              <textarea
                id="new-comment"
                name="NewComment"
                value={comment}
                onChange={(event) => {
                  setComment(
                    event.target.value,
                  );
                }}
                rows={5}
                required
                disabled={
                  working !== null
                }
                className="w-full resize-y rounded border border-amber-400 bg-[#151515] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Write a comment…"
              />

              <button
                type="submit"
                disabled={
                  working !== null
                }
                className="mt-3 rounded border border-blue-400 px-4 py-2 font-semibold text-blue-300 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working === "comment"
                  ? "Posting…"
                  : "Comment"}
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded border border-blue-400/50 bg-blue-950/30 p-4 text-blue-100">
              <Link
                to="/Account/Login"
                className="underline"
              >
                Log in
              </Link>{" "}
              to comment.
            </div>
          )}
        </>
      )}
    </main>
  );
}