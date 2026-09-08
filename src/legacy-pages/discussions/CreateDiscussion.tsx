"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  backendEndpoints,
  fetchBackend,
} from "@/config/api";
import {
  Link,
  useNavigate,
} from "@/router/nextCompat";

const CREATE_DISCUSSION_ENDPOINT =
  "/Discussions/Create";

type ApiError = {
  message?: string;
  title?: string;
  error?: string;
  errors?: Record<
    string,
    string[] | string
  >;
};

async function readErrorMessage(
  response: Response,
): Promise<string> {
  const fallback =
    `Request failed with status ${response.status}.`;

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
      const payload =
        JSON.parse(text) as ApiError;

      if (payload.errors) {
        const validationErrors =
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

        if (
          validationErrors.length > 0
        ) {
          return validationErrors.join(
            " ",
          );
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
        text,
        "text/html",
      );

    const validationMessages =
      Array.from(
        documentNode.querySelectorAll(
          ".validation-summary-errors li, .field-validation-error",
        ),
      )
        .map((node) =>
          node.textContent?.trim(),
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
        new Set(validationMessages),
      ).join(" ");
    }
  } catch {
    // The response was not readable HTML.
  }

  return fallback;
}

export default function CreateDiscussion() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    loading: checkingSession,
  } = useAuth();

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError(null);

    const cleanTitle =
      title.trim();

    const cleanContent =
      content.trim();

    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }

    if (cleanTitle.length > 120) {
      setError(
        "Title must be 120 characters or fewer.",
      );
      return;
    }

    if (!cleanContent) {
      setError(
        "Content is required.",
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetchBackend(
          CREATE_DISCUSSION_ENDPOINT,
          {
            method: "POST",
            cache: "no-store",
            redirect: "follow",

            headers: {
              Accept:
                "application/json, text/html;q=0.9",

              "Content-Type":
                "application/x-www-form-urlencoded;charset=UTF-8",
            },

            body: new URLSearchParams({
              Title: cleanTitle,
              Content: cleanContent,
            }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
          ),
        );
      }

      if (!response.redirected) {
        throw new Error(
          await readErrorMessage(
            response,
          ),
        );
      }

      navigate(
        backendEndpoints.discussions
          .index,
        {
          replace: true,
        },
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The discussion could not be published.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-slate-200">
        Checking your account…
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-slate-100">
        <div className="rounded-lg border border-amber-400/60 bg-slate-950 p-6">
          <h1 className="text-2xl font-bold">
            New Topic
          </h1>

          <p className="mt-3 text-slate-300">
            You must be logged in to
            start a discussion.
          </p>

          <Link
            to="/Account/Login"
            className="mt-5 inline-flex rounded border border-amber-400 px-4 py-2 font-semibold text-amber-300 hover:bg-amber-400/10"
          >
            Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-100">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">
          <i
            className="fa-solid fa-pen-to-square"
            aria-hidden="true"
          />{" "}
          New Topic
        </h1>

        <div className="mx-auto mt-4 h-px max-w-xl bg-amber-400/70" />
      </div>

      <form
        onSubmit={submit}
        className="rounded-lg border border-amber-400 bg-[#1a1a1a] p-5 shadow-xl"
        noValidate
      >
        {error ? (
          <div
            className="mb-4 rounded border border-red-500/60 bg-red-950/40 p-3 text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <label
          className="mb-2 block font-bold"
          htmlFor="discussion-title"
        >
          Title
        </label>

        <input
          id="discussion-title"
          name="Title"
          value={title}
          onChange={(event) => {
            setTitle(
              event.target.value,
            );
          }}
          maxLength={120}
          required
          disabled={saving}
          autoFocus
          className="mb-1 w-full rounded border border-amber-400 bg-[#2c2c2c] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mb-5 text-right text-xs text-slate-400">
          {title.length}/120
        </div>

        <label
          className="mb-2 block font-bold"
          htmlFor="discussion-content"
        >
          Content
        </label>

        <textarea
          id="discussion-content"
          name="Content"
          value={content}
          onChange={(event) => {
            setContent(
              event.target.value,
            );
          }}
          rows={10}
          required
          disabled={saving}
          className="w-full resize-y rounded border border-amber-400 bg-[#2c2c2c] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded border border-emerald-500 px-4 py-2 font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i
              className="fa-solid fa-upload"
              aria-hidden="true"
            />{" "}
            {saving
              ? "Publishing…"
              : "Publish"}
          </button>

          <Link
            to={
              backendEndpoints.discussions
                .index
            }
            className="rounded border border-slate-500 px-4 py-2 text-slate-200 hover:bg-slate-800"
          >
            <i
              className="fa-solid fa-arrow-left"
              aria-hidden="true"
            />{" "}
            Back
          </Link>
        </div>
      </form>
    </main>
  );
}