"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { adminRequest } from "@/lib/admin-categories";
import { spellIconSource } from "@/lib/spell-icons";

type SeoTargetType = "global" | "static" | "database";
type TriState = "inherit" | "yes" | "no";
type EntryStatus = "active" | "archived" | "deleted" | "all";

type SeoEntry = {
  id: string;
  pageId: number | null;
  path: string;
  resolvedPath: string;
  targetType: SeoTargetType;
  targetLabel: string;
  title: string;
  description: string;
  canonicalUrl: string;
  socialTitle: string;
  socialDescription: string;
  socialImageMediaId: string | null;
  imageUrl: string;
  index: boolean | null;
  follow: boolean | null;
  isArchived: boolean;
  isDeleted: boolean;
  version: number;
};

type SeoRouteTarget = {
  route: string;
  canonicalPath: string | null;
  visibility: number | string;
  selectable: boolean;
  isAlias: boolean;
};

type SeoPageTarget = {
  id: number;
  title: string;
  path: string;
  isPublished: boolean;
};

type SeoTargets = {
  registryVersion: string;
  staticRoutes: SeoRouteTarget[];
  pages: SeoPageTarget[];
};

type SeoRevision = {
  id: string;
  version: number;
  action: string;
  actor: string;
  createdAtUtc: string;
};

type MediaEntry = {
  id: string;
  name: string;
  altText: string;
  description: string;
  icon: string;
  size: number;
  contentType: string;
  isArchived: boolean;
  isDeleted: boolean;
  version: number;
  usageCount: number;
};

type MediaCatalog = {
  media: MediaEntry[];
  page: number;
  pages: number;
  total: number;
};

type Draft = {
  targetType: SeoTargetType;
  path: string;
  pageId: string;
  title: string;
  description: string;
  canonicalUrl: string;
  socialTitle: string;
  socialDescription: string;
  socialImageMediaId: string;
  imageUrl: string;
  index: TriState;
  follow: TriState;
};

const endpoint = "/Admin/api/seo";

function emptyDraft(): Draft {
  return {
    targetType: "global",
    path: "*",
    pageId: "",
    title: "",
    description: "",
    canonicalUrl: "",
    socialTitle: "",
    socialDescription: "",
    socialImageMediaId: "",
    imageUrl: "",
    index: "inherit",
    follow: "inherit",
  };
}

function triState(value: boolean | null): TriState {
  return value === null ? "inherit" : value ? "yes" : "no";
}

function nullableBoolean(value: TriState): boolean | null {
  return value === "inherit" ? null : value === "yes";
}

function draftFromEntry(entry: SeoEntry): Draft {
  return {
    targetType: entry.targetType,
    path: entry.targetType === "global" ? "*" : entry.path,
    pageId: entry.pageId?.toString() ?? "",
    title: entry.title,
    description: entry.description,
    canonicalUrl: entry.canonicalUrl,
    socialTitle: entry.socialTitle,
    socialDescription: entry.socialDescription,
    socialImageMediaId: entry.socialImageMediaId ?? "",
    imageUrl: entry.imageUrl,
    index: triState(entry.index),
    follow: triState(entry.follow),
  };
}

function entryStatus(entry: SeoEntry): Exclude<EntryStatus, "all"> {
  if (entry.isDeleted) return "deleted";
  if (entry.isArchived) return "archived";
  return "active";
}

function statusLabel(entry: SeoEntry): string {
  const status = entryStatus(entry);
  return status === "active" ? "Active" : status === "archived" ? "Archived" : "Deleted";
}

function targetTypeLabel(type: SeoTargetType): string {
  if (type === "global") return "Global defaults";
  if (type === "database") return "Database page";
  return "Static route";
}

function actionLabel(action: string): string {
  const normalized = action.toLowerCase();
  if (normalized === "created") return "Created";
  if (normalized === "updated") return "Updated";
  if (normalized === "archive") return "Archived";
  if (normalized === "unarchive") return "Unarchived";
  if (normalized === "delete") return "Deleted";
  if (normalized === "restore") return "Restored";
  return action;
}

export default function SeoAdmin() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [targets, setTargets] = useState<SeoTargets>({ registryVersion: "", staticRoutes: [], pages: [] });
  const [selected, setSelected] = useState<SeoEntry | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [history, setHistory] = useState<SeoRevision[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EntryStatus>("active");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaCatalog, setMediaCatalog] = useState<MediaCatalog>({ media: [], page: 1, pages: 1, total: 0 });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void Promise.all([
      adminRequest<SeoEntry[]>(endpoint, "GET", undefined, controller.signal),
      adminRequest<SeoTargets>(`${endpoint}/targets`, "GET", undefined, controller.signal),
    ])
      .then(([entryData, targetData]) => {
        if (controller.signal.aborted) return;
        setEntries(entryData);
        setTargets(targetData);
        setSelected(current => {
          if (!current) return current;
          const replacement = entryData.find(item => item.id === current.id) ?? null;
          if (replacement) setDraft(draftFromEntry(replacement));
          return replacement;
        });
      })
      .catch(value => {
        if (!controller.signal.aborted) setError(value instanceof Error ? value.message : "Could not load SEO settings.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    setHistory([]);
    if (!selected) {
      setHistoryLoading(false);
      return;
    }
    const controller = new AbortController();
    setHistoryLoading(true);
    void adminRequest<SeoRevision[]>(`${endpoint}/${selected.id}/history`, "GET", undefined, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setHistory(data);
      })
      .catch(value => {
        if (!controller.signal.aborted) setError(value instanceof Error ? value.message : "Could not load SEO history.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoryLoading(false);
      });
    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    if (!mediaOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setMediaLoading(true);
      void adminRequest<MediaCatalog>(
        `/Admin/api/media?${new URLSearchParams({ search: mediaSearch, status: "active", page: String(mediaPage) })}`,
        "GET",
        undefined,
        controller.signal,
      )
        .then(data => {
          if (!controller.signal.aborted) setMediaCatalog(data);
        })
        .catch(value => {
          if (!controller.signal.aborted) setError(value instanceof Error ? value.message : "Could not load media.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setMediaLoading(false);
        });
    }, 150);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mediaOpen, mediaSearch, mediaPage]);

  const visibleEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter(entry => {
      const matchesStatus = status === "all" || entryStatus(entry) === status;
      if (!matchesStatus) return false;
      if (!needle) return true;
      return [entry.targetLabel, entry.resolvedPath, entry.title, entry.description]
        .some(value => value.toLowerCase().includes(needle));
    });
  }, [entries, search, status]);

  const configuredTargets = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      if (entry.isDeleted || entry.id === selected?.id) continue;
      values.add(entry.pageId !== null ? `page:${entry.pageId}` : `path:${entry.path.toLowerCase()}`);
    }
    return values;
  }, [entries, selected]);

  const targetKey = draft.targetType === "database"
    ? draft.pageId ? `page:${draft.pageId}` : ""
    : `path:${(draft.targetType === "global" ? "*" : draft.path).toLowerCase()}`;
  const duplicateTarget = Boolean(targetKey && configuredTargets.has(targetKey));
  const isGlobal = draft.targetType === "global";
  const editorDisabled = busy || Boolean(selected?.isDeleted || selected?.isArchived);
  const selectedMediaSource = draft.socialImageMediaId
    ? spellIconSource(`/api/spell-icons/${draft.socialImageMediaId}`)
    : "";

  function choose(entry: SeoEntry | null) {
    setSelected(entry);
    setDraft(entry ? draftFromEntry(entry) : emptyDraft());
    setHistory([]);
    setError("");
    setNotice("");
    setMediaOpen(false);
    setMediaSearch("");
    setMediaPage(1);
  }

  function changeTargetType(nextType: SeoTargetType) {
    setDraft(current => ({
      ...current,
      targetType: nextType,
      path: nextType === "global" ? "*" : nextType === "static" ? targets.staticRoutes[0]?.route ?? "" : "",
      pageId: nextType === "database" ? targets.pages[0]?.id.toString() ?? "" : "",
      canonicalUrl: nextType === "global" ? "" : current.canonicalUrl,
    }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current || editorDisabled) return;
    if (duplicateTarget) {
      setError("SEO settings already exist for this target. Edit or restore that record instead.");
      return;
    }
    if (draft.targetType === "static" && !draft.path) {
      setError("Choose a static route.");
      return;
    }
    if (draft.targetType === "database" && !draft.pageId) {
      setError("Choose a database page.");
      return;
    }
    if (draft.socialImageMediaId && draft.imageUrl.trim()) {
      setError("Choose either a media-library image or an external social image URL, not both.");
      return;
    }

    const body = {
      pageId: draft.targetType === "database" ? Number(draft.pageId) : null,
      path: draft.targetType === "database" ? null : draft.targetType === "global" ? "*" : draft.path,
      title: draft.title.trim(),
      description: draft.description.trim(),
      canonicalUrl: isGlobal ? "" : draft.canonicalUrl.trim(),
      socialTitle: draft.socialTitle.trim(),
      socialDescription: draft.socialDescription.trim(),
      socialImageMediaId: draft.socialImageMediaId || null,
      imageUrl: draft.imageUrl.trim(),
      index: nullableBoolean(draft.index),
      follow: nullableBoolean(draft.follow),
      version: selected?.version ?? 0,
    };

    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await adminRequest<SeoEntry>(selected ? `${endpoint}/${selected.id}` : endpoint, selected ? "PUT" : "POST", body);
      const updated = await adminRequest<SeoEntry[]>(endpoint);
      setEntries(updated);
      const replacement = updated.find(item => item.id === result.id) ?? result;
      setSelected(replacement);
      setDraft(draftFromEntry(replacement));
      setNotice(selected ? "SEO settings saved." : "SEO settings created.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not save SEO settings.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function lifecycle(action: "archive" | "unarchive" | "delete" | "restore", revisionId?: string) {
    if (!selected || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await adminRequest<SeoEntry>(`${endpoint}/${selected.id}/actions`, "POST", {
        version: selected.version,
        action,
        revisionId: revisionId ?? null,
      });
      const updated = await adminRequest<SeoEntry[]>(endpoint);
      setEntries(updated);
      const replacement = updated.find(item => item.id === result.id) ?? result;
      setSelected(replacement);
      setDraft(draftFromEntry(replacement));
      setNotice(action === "restore" ? "SEO revision restored." : `SEO entry ${action === "delete" ? "deleted" : action === "archive" ? "archived" : "unarchived"}.`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not change SEO entry state.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="seo-admin-workspace">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 className="mb-1">SEO</h2>
          <p className="mb-0 text-secondary">
            Manage search metadata, canonical URLs, social sharing and robots rules for public routes and Page Builder pages.
          </p>
        </div>
        {targets.registryVersion ? <span className="badge text-bg-secondary">Route registry {targets.registryVersion}</span> : null}
      </div>

      {error ? <p className="alert alert-danger" role="alert">{error}</p> : null}
      {notice ? <p className="alert alert-success" role="status">{notice}</p> : null}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => choose(null)}>New SEO entry</button>
        <button type="button" className="btn btn-secondary" disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xxl-7" style={{ minWidth: 0 }}>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <input
              type="search"
              className="form-control"
              style={{ flex: "1 1 260px", minWidth: 0 }}
              aria-label="Search SEO settings"
              placeholder="Search route, page, title or description…"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <select
              className="form-select"
              style={{ flex: "0 1 170px", minWidth: 150 }}
              aria-label="SEO entry status"
              value={status}
              onChange={event => setStatus(event.target.value as EntryStatus)}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
              <option value="all">All</option>
            </select>
          </div>

          {loading ? <p>Loading SEO settings…</p> : (
            <>
              <p className="text-secondary">{visibleEntries.length} of {entries.length} SEO entries</p>
              <div className="table-responsive">
                <table className="table table-dark table-striped align-middle admin-record-table">
                  <thead>
                    <tr><th>Target</th><th>Type</th><th>Metadata</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {visibleEntries.map(entry => (
                      <tr key={entry.id}>
                        <td data-label="Target">
                          <strong className="d-block" style={{ overflowWrap: "anywhere" }}>{entry.targetLabel}</strong>
                          <span className="text-secondary" style={{ overflowWrap: "anywhere" }}>{entry.resolvedPath}</span>
                        </td>
                        <td data-label="Type">{targetTypeLabel(entry.targetType)}</td>
                        <td data-label="Metadata">
                          <span className="d-block">{entry.title || <span className="text-secondary">No title override</span>}</span>
                          <small className="text-secondary">v{entry.version}</small>
                        </td>
                        <td data-label="Status"><span className={`badge ${entry.isDeleted ? "text-bg-danger" : entry.isArchived ? "text-bg-warning" : "text-bg-success"}`}>{statusLabel(entry)}</span></td>
                        <td data-label="Actions">
                          <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => choose(entry)}>
                            {entry.isDeleted ? "History / restore" : entry.isArchived ? "Manage" : "Edit / history"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!visibleEntries.length ? <p>No SEO entries match this filter.</p> : null}
            </>
          )}
        </div>

        <div className="col-12 col-xxl-5" style={{ minWidth: 0 }}>
          <div className="border rounded p-3 p-lg-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h3 className="mb-0">{selected ? `${statusLabel(selected)} SEO entry` : "New SEO entry"}</h3>
              {selected ? <span className="badge text-bg-secondary">v{selected.version}</span> : null}
            </div>

            {selected?.isDeleted ? <p className="alert alert-warning">This entry is deleted. Restore a previous revision before editing it.</p> : null}
            {selected?.isArchived ? <p className="alert alert-warning">This entry is archived. Unarchive it before editing.</p> : null}

            <form onSubmit={save}>
              <fieldset disabled={editorDisabled}>
                <label className="form-label" htmlFor="seo-target-type">Target type</label>
                <select id="seo-target-type" className="form-select mb-3" value={draft.targetType} onChange={event => changeTargetType(event.target.value as SeoTargetType)}>
                  <option value="global">Global defaults</option>
                  <option value="static">Static public route</option>
                  <option value="database">Page Builder page</option>
                </select>

                {draft.targetType === "static" ? (
                  <>
                    <label className="form-label" htmlFor="seo-static-route">Static route</label>
                    <select id="seo-static-route" className="form-select mb-2" required value={draft.path} onChange={event => setDraft(current => ({ ...current, path: event.target.value }))}>
                      <option value="" disabled>Choose a route</option>
                      {targets.staticRoutes.map(route => <option key={route.route} value={route.route}>{route.route}</option>)}
                    </select>
                  </>
                ) : null}

                {draft.targetType === "database" ? (
                  <>
                    <label className="form-label" htmlFor="seo-page-target">Page Builder page</label>
                    <select id="seo-page-target" className="form-select mb-2" required value={draft.pageId} onChange={event => setDraft(current => ({ ...current, pageId: event.target.value }))}>
                      <option value="" disabled>Choose a page</option>
                      {targets.pages.map(page => (
                        <option key={page.id} value={page.id}>{page.path} — {page.title}{page.isPublished ? "" : " (unpublished)"}</option>
                      ))}
                    </select>
                  </>
                ) : null}

                {isGlobal ? <p className="small text-secondary mb-3">Global defaults are inherited by pages without their own override. Canonical URL is always resolved per page.</p> : null}
                {duplicateTarget ? <p className="alert alert-warning py-2">An active or archived SEO record already owns this target.</p> : null}

                <hr />
                <h4>Search metadata</h4>
                <label className="form-label" htmlFor="seo-title">Title</label>
                <input id="seo-title" className="form-control" maxLength={200} value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} />
                <div className="text-end small text-secondary mb-3">{draft.title.length}/200</div>

                <label className="form-label" htmlFor="seo-description">Description</label>
                <textarea id="seo-description" className="form-control" rows={4} maxLength={500} value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} />
                <div className="text-end small text-secondary mb-3">{draft.description.length}/500</div>

                <label className="form-label" htmlFor="seo-canonical">Canonical URL</label>
                <input
                  id="seo-canonical"
                  type="url"
                  className="form-control mb-1"
                  maxLength={2048}
                  placeholder={isGlobal ? "Resolved automatically per page" : "Leave blank to use the page URL"}
                  disabled={isGlobal || editorDisabled}
                  value={isGlobal ? "" : draft.canonicalUrl}
                  onChange={event => setDraft(current => ({ ...current, canonicalUrl: event.target.value }))}
                />
                <p className="small text-secondary">Optional absolute HTTP/HTTPS URL. Leave blank for the normal canonical page URL.</p>

                <hr />
                <h4>Social sharing</h4>
                <label className="form-label" htmlFor="seo-social-title">Social title</label>
                <input id="seo-social-title" className="form-control" maxLength={200} value={draft.socialTitle} onChange={event => setDraft(current => ({ ...current, socialTitle: event.target.value }))} />
                <div className="text-end small text-secondary mb-3">{draft.socialTitle.length}/200</div>

                <label className="form-label" htmlFor="seo-social-description">Social description</label>
                <textarea id="seo-social-description" className="form-control" rows={3} maxLength={500} value={draft.socialDescription} onChange={event => setDraft(current => ({ ...current, socialDescription: event.target.value }))} />
                <div className="text-end small text-secondary mb-3">{draft.socialDescription.length}/500</div>

                <div className="border rounded p-3 mb-3">
                  <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2">
                    <strong>Social image</strong>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setMediaOpen(value => !value)}>{mediaOpen ? "Close media library" : "Choose from media"}</button>
                  </div>

                  {selectedMediaSource ? (
                    <div className="d-flex gap-3 align-items-center mb-3">
                      <img src={selectedMediaSource} alt="Selected social image" style={{ width: 96, height: 64, objectFit: "contain" }} />
                      <div style={{ minWidth: 0 }}>
                        <div className="small" style={{ overflowWrap: "anywhere" }}>Media ID: {draft.socialImageMediaId}</div>
                        <button type="button" className="btn btn-sm btn-outline-danger mt-1" onClick={() => setDraft(current => ({ ...current, socialImageMediaId: "" }))}>Clear media image</button>
                      </div>
                    </div>
                  ) : null}

                  <label className="form-label" htmlFor="seo-image-url">Or external image URL</label>
                  <input
                    id="seo-image-url"
                    type="url"
                    className="form-control"
                    maxLength={2048}
                    placeholder="https://cdn.example.com/share-card.jpg"
                    value={draft.imageUrl}
                    onChange={event => setDraft(current => ({ ...current, imageUrl: event.target.value, socialImageMediaId: event.target.value ? "" : current.socialImageMediaId }))}
                  />
                  <p className="small text-secondary mb-0 mt-1">Media-library image and external URL are mutually exclusive.</p>
                </div>

                {mediaOpen ? (
                  <div className="border rounded p-3 mb-3">
                    <label className="form-label" htmlFor="seo-media-search">Media library</label>
                    <input id="seo-media-search" type="search" className="form-control mb-3" placeholder="Search active media…" value={mediaSearch} onChange={event => { setMediaSearch(event.target.value); setMediaPage(1); }} />
                    {mediaLoading ? <p>Loading media…</p> : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                        {mediaCatalog.media.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            className={`btn btn-dark border text-start p-2${draft.socialImageMediaId === item.id ? " border-primary" : ""}`}
                            aria-pressed={draft.socialImageMediaId === item.id}
                            onClick={() => setDraft(current => ({ ...current, socialImageMediaId: item.id, imageUrl: "" }))}
                          >
                            <img src={spellIconSource(item.icon)} alt={item.altText || item.name} loading="lazy" style={{ width: "100%", height: 72, objectFit: "contain" }} />
                            <span className="d-block mt-1 small" style={{ overflowWrap: "anywhere" }}>{item.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!mediaLoading && !mediaCatalog.media.length ? <p>No active media match this search.</p> : null}
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                      <button type="button" className="btn btn-sm btn-secondary" disabled={mediaLoading || mediaCatalog.page <= 1} onClick={() => setMediaPage(mediaCatalog.page - 1)}>Previous</button>
                      <span className="small">{mediaCatalog.page} / {mediaCatalog.pages} · {mediaCatalog.total} images</span>
                      <button type="button" className="btn btn-sm btn-secondary" disabled={mediaLoading || mediaCatalog.page >= mediaCatalog.pages} onClick={() => setMediaPage(mediaCatalog.page + 1)}>Next</button>
                    </div>
                  </div>
                ) : null}

                <hr />
                <h4>Robots</h4>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="seo-index">Index</label>
                    <select id="seo-index" className="form-select" value={draft.index} onChange={event => setDraft(current => ({ ...current, index: event.target.value as TriState }))}>
                      <option value="inherit">Inherit / default</option>
                      <option value="yes">Allow indexing</option>
                      <option value="no">No index</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="seo-follow">Follow links</label>
                    <select id="seo-follow" className="form-select" value={draft.follow} onChange={event => setDraft(current => ({ ...current, follow: event.target.value as TriState }))}>
                      <option value="inherit">Inherit / default</option>
                      <option value="yes">Follow links</option>
                      <option value="no">No follow</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-success" disabled={busy || duplicateTarget}>{busy ? "Saving…" : selected ? "Save SEO settings" : "Create SEO settings"}</button>
              </fieldset>
            </form>

            {selected ? (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {!selected.isDeleted && !selected.isArchived ? <button type="button" className="btn btn-warning" disabled={busy} onClick={() => { if (window.confirm("Archive this SEO entry?")) void lifecycle("archive"); }}>Archive</button> : null}
                {!selected.isDeleted && selected.isArchived ? <button type="button" className="btn btn-success" disabled={busy} onClick={() => void lifecycle("unarchive")}>Unarchive</button> : null}
                {!selected.isDeleted ? <button type="button" className="btn btn-danger" disabled={busy} onClick={() => { if (window.confirm("Move this SEO entry to Deleted? Its history will be preserved.")) void lifecycle("delete"); }}>Delete</button> : null}
              </div>
            ) : null}

            {selected ? (
              <section className="mt-4">
                <h3>Change history</h3>
                {historyLoading ? <p>Loading history…</p> : null}
                {history.map(revision => (
                  <div className="border rounded p-2 mb-2" key={revision.id}>
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <strong>v{revision.version} · {actionLabel(revision.action)}</strong>
                      <span className="small text-secondary">{new Date(revision.createdAtUtc).toLocaleString()}</span>
                    </div>
                    <div className="small mt-1" style={{ overflowWrap: "anywhere" }}>By: {revision.actor}</div>
                    {revision.action.toLowerCase() !== "delete" && revision.version !== selected.version ? (
                      <button type="button" className="btn btn-sm btn-outline-primary mt-2" disabled={busy} onClick={() => { if (window.confirm(`Restore SEO entry to revision ${revision.version}?`)) void lifecycle("restore", revision.id); }}>Restore this revision</button>
                    ) : null}
                  </div>
                ))}
                {!historyLoading && !history.length ? <p>No changes recorded.</p> : null}
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
