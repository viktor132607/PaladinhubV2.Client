"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link } from "@/router/nextCompat";

type DiscussionPost = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdOn: string;
  commentsCount: number;
  likes: number;
  canDelete: boolean;
};

const cardStyle = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #FFD700",
  borderRadius: "6px",
} as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Discussions() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchBackend(backendEndpoints.discussions.index, {
        method: "GET",
        cache: "no-store",
      });
      const data = await readApiJson<DiscussionPost[]>(response);
      setPosts(Array.isArray(data) ? data : []);
    } catch (caught) {
      setPosts([]);
      setError(caught instanceof Error ? caught.message : "Discussions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (post: DiscussionPost) => {
    if (workingId || !window.confirm("Are you sure you want to delete this discussion?")) {
      return;
    }

    setWorkingId(post.id);
    setError(null);

    try {
      const response = await fetchBackend(backendEndpoints.discussions.delete(post.id), {
        method: "DELETE",
        cache: "no-store",
      });
      await readApiJson<null>(response);
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The discussion could not be deleted.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="section-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">
          <i className="fa-solid fa-comments" /> Discussions
        </h2>
        {!authLoading && isAuthenticated ? (
          <Link className="btn btn-outline-primary" to="/Discussions/Create">
            <i className="fa-solid fa-plus" /> New Topic
          </Link>
        ) : null}
      </div>

      <div className="separator-container">
        <span className="separator" />
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {loading ? <div className="text-muted">Loading discussions…</div> : null}

      {!loading && posts.length === 0 ? (
        <div className="alert alert-info">No topics yet. Be the first to start a discussion!</div>
      ) : null}

      {!loading && posts.length > 0 ? (
        <div className="discussion-list">
          {posts.map((post) => {
            const preview = post.content.length > 220 ? `${post.content.slice(0, 220)}...` : post.content;

            return (
              <div key={post.id} className="discussion-item mb-4 p-3" style={cardStyle}>
                <h3 className="discussion-title mb-1">
                  <Link
                    className="item-link"
                    to={`/Discussions/Details/view?id=${encodeURIComponent(post.id)}`}
                  >
                    {post.title}
                  </Link>
                </h3>
                <div className="discussion-meta text-muted mb-2" style={{ fontSize: "0.9rem" }}>
                  by <span className="highlight">{post.authorName}</span> • {formatDate(post.createdOn)}
                </div>
                <div className="discussion-preview">{preview}</div>
                <div className="discussion-stats mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
                  💬 {post.commentsCount} • ❤️ {post.likes}
                </div>

                {post.canDelete ? (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm mt-2"
                    disabled={workingId !== null}
                    onClick={() => void remove(post)}
                  >
                    <i className="fa-solid fa-trash" /> {workingId === post.id ? "Deleting…" : "Delete"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {!authLoading && !isAuthenticated ? (
        <div className="alert alert-info mt-3">
          <Link to="/Account/Login">Log in</Link> to start a new topic.
        </div>
      ) : null}
    </div>
  );
}
