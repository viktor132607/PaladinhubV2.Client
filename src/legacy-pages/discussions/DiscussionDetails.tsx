"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

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
  canDelete: boolean;
  comments: DiscussionComment[];
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

export default function DiscussionDetails() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("Discussion not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchBackend(backendEndpoints.discussions.details(id), {
        method: "GET",
        cache: "no-store",
      });
      setPost(await readApiJson<DiscussionPost>(response));
    } catch (caught) {
      setPost(null);
      setError(caught instanceof Error ? caught.message : "The discussion could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const mutate = async (path: string, method: "POST" | "DELETE", body?: unknown) => {
    const response = await fetchBackend(path, {
      method,
      cache: "no-store",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    await readApiJson<unknown>(response);
  };

  const remove = async () => {
    if (!post || working || !window.confirm("Are you sure you want to delete this discussion?")) return;

    setWorking(true);
    setError(null);
    try {
      await mutate(backendEndpoints.discussions.delete(post.id), "DELETE");
      navigate("/Discussions", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The discussion could not be deleted.");
      setWorking(false);
    }
  };

  const likePost = async () => {
    if (!post || working) return;
    setWorking(true);
    setError(null);
    try {
      await mutate(backendEndpoints.discussions.like(post.id), "POST");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The discussion could not be liked.");
    } finally {
      setWorking(false);
    }
  };

  const likeComment = async (commentId: string) => {
    if (!post || working) return;
    setWorking(true);
    setError(null);
    try {
      await mutate(backendEndpoints.discussions.likeComment(post.id, commentId), "POST");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The comment could not be liked.");
    } finally {
      setWorking(false);
    }
  };

  const addComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!post || working || !comment.trim()) return;

    setWorking(true);
    setError(null);
    try {
      await mutate(backendEndpoints.discussions.addComment(post.id), "POST", { content: comment.trim() });
      setComment("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The comment could not be published.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <div className="section-wrapper">Loading discussion…</div>;

  if (!post) {
    return (
      <div className="section-wrapper">
        <div className="alert alert-danger">{error || "Discussion not found."}</div>
        <Link className="btn btn-outline-primary" to="/Discussions">← Back to Discussions</Link>
      </div>
    );
  }

  return (
    <div className="section-wrapper">
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="mb-3 d-flex gap-2">
        <Link className="btn btn-outline-primary" to="/Discussions">← Back to Discussions</Link>
        {post.canDelete ? (
          <button type="button" className="btn btn-outline-danger" disabled={working} onClick={() => void remove()}>
            <i className="fa-solid fa-trash" /> Delete Discussion
          </button>
        ) : null}
      </div>

      <div className="discussion-item p-3" style={cardStyle}>
        <h2 className="mb-1">{post.title}</h2>
        <div className="discussion-meta text-muted mb-3" style={{ fontSize: "0.9rem" }}>
          by <span className="highlight">{post.authorName}</span> • {formatDate(post.createdOn)}
        </div>
        <p className="mt-2">{post.content}</p>

        {isAuthenticated ? (
          <button type="button" className="btn btn-outline-danger mb-3" disabled={working} onClick={() => void likePost()}>
            ❤️ {post.likes} {post.likedByCurrentUser ? "Unlike" : "Like"}
          </button>
        ) : null}
      </div>

      <h4 className="mt-4">Comments ({post.comments.length})</h4>

      <div className="mt-3">
        {post.comments.map((item) => (
          <div key={item.id} className="p-3 mb-3" style={cardStyle}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div><b>{item.authorName}</b> • <small>{formatDate(item.createdOn)}</small></div>
              {isAuthenticated ? (
                <button type="button" className="btn btn-sm btn-outline-danger" disabled={working} onClick={() => void likeComment(item.id)}>
                  ❤️ {item.likes} {item.likedByCurrentUser ? "Unlike" : "Like"}
                </button>
              ) : null}
            </div>
            <div>{item.content}</div>
          </div>
        ))}
      </div>

      {isAuthenticated ? (
        <div className="mt-4 p-3" style={cardStyle}>
          <form onSubmit={addComment}>
            <div className="mb-3">
              <textarea
                rows={4}
                className="form-control"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write a comment..."
                style={{ backgroundColor: "#151515", color: "white", border: "1px solid #FFD700" }}
              />
            </div>
            <button className="btn btn-outline-primary" type="submit" disabled={working || !comment.trim()}>Comment</button>
          </form>
        </div>
      ) : (
        <div className="alert alert-info mt-3">Log in to comment.</div>
      )}
    </div>
  );
}
