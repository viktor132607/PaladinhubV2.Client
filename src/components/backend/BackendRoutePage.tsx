"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "@/router/nextCompat";
import {
  fetchBackend,
  readApiJson,
} from "@/config/api";

type BackendRoutePageProps = {
  title: string;
  path: string;
  description?: string;
};

type BackendRouteResponse = {
  redirect?: string | null;
  redirectUrl?: string | null;
};

export default function BackendRoutePage({
  title,
  path,
  description,
}: BackendRoutePageProps) {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const openRoute = useCallback(
    async (
      signal?: AbortSignal,
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchBackend(path, {
          method: "GET",
          cache: "no-store",
          signal,
        });

        const data =
          await readApiJson<BackendRouteResponse>(
            response,
          );

        const redirectTarget =
          data?.redirectUrl?.trim() ||
          data?.redirect?.trim();

        if (!redirectTarget) {
          throw new Error(
            "The backend did not return a redirect route.",
          );
        }

        if (/^https?:\/\//i.test(redirectTarget)) {
          const targetUrl = new URL(
            redirectTarget,
            window.location.origin,
          );

          if (
            targetUrl.origin ===
            window.location.origin
          ) {
            navigate(
              `${targetUrl.pathname}` +
                `${targetUrl.search}` +
                `${targetUrl.hash}`,
              {
                replace: true,
              },
            );

            return;
          }

          window.location.assign(
            targetUrl.toString(),
          );

          return;
        }

        navigate(redirectTarget, {
          replace: true,
        });
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : `Could not open ${title}.`,
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [navigate, path, title],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void openRoute(controller.signal);

    return () => {
      controller.abort();
    };
  }, [openRoute]);

  return (
    <section className="ph-route-page">
      <div className="ph-route-card">
        <h1>{title}</h1>

        {description ? (
          <p>{description}</p>
        ) : null}

        {loading ? (
          <p>Loading {title}...</p>
        ) : null}

        {error ? (
          <>
            <p role="alert">{error}</p>

            <button
              type="button"
              className="btn-hero"
              onClick={() => {
                void openRoute();
              }}
            >
              Try again
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}