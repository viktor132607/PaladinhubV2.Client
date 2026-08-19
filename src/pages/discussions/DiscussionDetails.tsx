"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  addDiscussionComment,
  deleteDiscussion,
  getDiscussion,
  toggleDiscussionCommentLike,
  toggleDiscussionLike,
  type DiscussionDetails as DiscussionDetailsModel,
} from "@/features/discussions/api";
import {
  Link,
  useNavigate,
  useParams,
} from "@/router/nextCompat";

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value || "Unknown date"
    : date.toLocaleString();
}

export default function DiscussionDetails() {
  const navigate = useNavigate();
  const { id = "" } = useParams<{
    id?: string;
  }>();

  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [post, setPost] =
    useState<DiscussionDetailsModel | null>(null);

  const [newComment, setNewComment] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [working, setWorking] =
    useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      if (!id) {
        setPost(null);
        setError("Discussion not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedPost =
          await getDiscussion(id, signal);

        if (!signal?.aborted) {
          setPost(loadedPost);
        }
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
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const remove = async (): Promise<void> => {
    if (!post || working !== null) {
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this discussion?",
      )
    ) {
      return;
    }

    setWorking("delete");
    setError(null);

    try {
      await deleteDiscussion(post.id);
      navigate("/Discussions/Index", {
        replace: true,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The discussion could not be deleted.",
      );
      setWorking(null);
    }
  };

  const togglePostLike = async (): Promise<void> => {
    if (!post || working !== null) {
      return;
    }

    setWorking("post-like");
    setError(null);

    try {
      setPost(
        await toggleDiscussionLike(post.id),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The like could not be updated.",
      );
    } finally {
      setWorking(null);
    }
  };

  const toggleCommentLike = async (
    commentId: string,
  ): Promise<void> => {
    if (!post || working !== null) {
      return;
    }

    setWorking(`comment-like:${commentId}`);
    setError(null);

    try {
      setPost(
        await toggleDiscussionCommentLike(
          post.id,
          commentId,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The comment like could not be updated.",
      );
    } finally {
      setWorking(null);
    }
  };

  const submitComment = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!post || working !== null) {
      return;
    }

    const content = newComment.trim();

    if (!content) {
      return;
    }

    setWorking("add-comment");
    setError(null);

    try {
      setPost(
        await addDiscussionComment(
          post.id,
          content,
        ),
      );
      setNewComment("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The comment could not be added.",
      );
    } finally {
      setWorking(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/Discussions/Index"
          className="rounded border border-slate-500 px-3 py-2 text-slate-200 hover:bg-slate-800"
        >
          <i
            className="fa-solid fa-arrow-left"
            aria-hidden="true"
          />{" "}
          Back
        </Link>

        {post?.canDelete ? (
          <button
            type="button"
            onClick={() => {
              void remove();
            }}
            disabled={working !== null}
            className="rounded border border-red-500 px-3 py-2 font-semibold text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i
              className="fa-solid fa-trash"
              aria-hidden="true"
            />{" "}
            {working === "delete"
              ? "Deleting…"
              : "Delete"}
          </button>
        ) : null}
      </div>

      {error ? (
        <div
          className="mb-5 rounded border border-red-500/60 bg-red-950/40 p-3 text-red-200"
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
              className="mt-3 rounded border border-red-300/40 px-3 py-2 font-semibold hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-300">
          Loading discussion…
        </p>
      ) : null}

      {!loading && post ? (
        <>
          <article className="rounded-lg border border-amber-400 bg-[#1a1a1a] p-5 shadow-xl">
            <h1 className="text-3xl font-bold text-amber-100">
              {post.title}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              by{" "}
              <span className="font-semibold text-amber-300">
                {post.authorName}
              </span>{" "}
              • {formatDate(post.createdOn)}
            </p>

            <div className="my-5 h-px bg-amber-400/50" />

            <p className="whitespace-pre-wrap break-words text-slate-100">
              {post.content}
            </p>

            <div className="mt-5 flex items-center gap-3 text-sm text-slate-300">
              {!authLoading && isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    void togglePostLike();
                  }}
                  disabled={working !== null}
                  className="rounded border border-pink-500/70 px-3 py-1.5 font-semibold text-pink-300 hover:bg-pink-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {post.likedByCurrentUser
                    ? "Unlike"
                    : "Like"}{" "}
                  ❤️ {post.likes}
                </button>
              ) : (
                <span>❤️ {post.likes}</span>
              )}
            </div>
          </article>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">
              Comments ({post.comments.length})
            </h2>

            <div className="mt-4 space-y-3">
              {post.comments.length === 0 ? (
                <div className="rounded border border-slate-700 bg-slate-950 p-4 text-slate-400">
                  No comments yet.
                </div>
              ) : null}

              {post.comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-lg border border-slate-700 bg-[#171717] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-amber-300">
                        {comment.authorName}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatDate(comment.createdOn)}
                      </p>
                    </div>

                    {!authLoading && isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => {
                          void toggleCommentLike(
                            comment.id,
                          );
                        }}
                        disabled={working !== null}
                        className="rounded border border-pink-500/50 px-2.5 py-1 text-sm text-pink-300 hover:bg-pink-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {comment.likedByCurrentUser
                          ? "Unlike"
                          : "Like"}{" "}
                        ❤️ {comment.likes}
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">
                        ❤️ {comment.likes}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-slate-200">
                    {comment.content}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            {!authLoading && isAuthenticated ? (
              <form
                onSubmit={submitComment}
                className="rounded-lg border border-amber-400/60 bg-[#1a1a1a] p-4"
              >
                <label
                  htmlFor="new-comment"
                  className="mb-2 block font-bold"
                >
                  Add a comment
                </label>

                <textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(event) => {
                    setNewComment(event.target.value);
                  }}
                  rows={5}
                  disabled={working !== null}
                  className="w-full resize-y rounded border border-slate-600 bg-[#2c2c2c] px-3 py-2 text-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={
                    working !== null ||
                    !newComment.trim()
                  }
                  className="mt-3 rounded border border-emerald-500 px-4 py-2 font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working === "add-comment"
                    ? "Posting…"
                    : "Post comment"}
                </button>
              </form>
            ) : null}

            {!authLoading && !isAuthenticated ? (
              <div className="rounded border border-slate-700 bg-slate-950 p-4 text-slate-300">
                <Link
                  to="/Account/Login"
                  className="text-blue-300 underline"
                >
                  Log in
                </Link>{" "}
                to comment or like this discussion.
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
