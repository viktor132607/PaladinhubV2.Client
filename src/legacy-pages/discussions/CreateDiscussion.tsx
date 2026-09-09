"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

export default function CreateDiscussion() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: checkingSession } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      setError(!cleanTitle ? "Title is required." : "Content is required.");
      return;
    }

    if (cleanTitle.length > 120) {
      setError("Title must be 120 characters or fewer.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetchBackend(backendEndpoints.discussions.create, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle, content: cleanContent }),
      });
      await readApiJson<{ ok: boolean }>(response);
      navigate("/Discussions", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The discussion could not be published.");
    } finally {
      setSaving(false);
    }
  };

  if (checkingSession) {
    return <div className="section-wrapper">Checking your account…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="section-wrapper">
        <div className="alert alert-info">
          You must be logged in to start a discussion. <Link to="/Account/Login">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-wrapper">
      <h2 className="text-center mb-4">
        <i className="fa-solid fa-pen-to-square" /> New Topic
      </h2>

      <div className="separator-container mb-4">
        <span className="separator" />
      </div>

      <form
        onSubmit={submit}
        className="p-4"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #FFD700", borderRadius: "6px" }}
      >
        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="mb-3">
          <label className="form-label fw-bold text-white" htmlFor="discussion-title">Title</label>
          <input
            id="discussion-title"
            className="form-control"
            value={title}
            maxLength={120}
            disabled={saving}
            onChange={(event) => setTitle(event.target.value)}
            style={{ backgroundColor: "#2c2c2c", color: "white", border: "1px solid #FFD700" }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold text-white" htmlFor="discussion-content">Content</label>
          <textarea
            id="discussion-content"
            rows={8}
            className="form-control"
            value={content}
            disabled={saving}
            onChange={(event) => setContent(event.target.value)}
            style={{ backgroundColor: "#2c2c2c", color: "white", border: "1px solid #FFD700" }}
          />
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-success" type="submit" disabled={saving}>
            <i className="fa-solid fa-upload" /> {saving ? "Publishing…" : "Publish"}
          </button>
          <Link className="btn btn-outline-secondary" to="/Discussions">
            <i className="fa-solid fa-arrow-left" /> Back
          </Link>
        </div>
      </form>
    </div>
  );
}
