"use client";
import { CategoryLabel } from "@/components/admin/CategoryPicker";
import { ClassLabel } from "@/components/admin/ClassPicker";

import { useEffect, useState, type FormEvent } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type SpellDto = {
  disciplineId?: number | null;
  categoryId?: number | null;
  id: number;
  name: string;
  description?: string | null;
  quality?: string | null;
};

type CsrfResponse = { token?: string };
const spellsApiEndpoint = "/Admin/api/spells";

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

export default function DeleteSpell() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [spell, setSpell] = useState<SpellDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const spellId = Number(id);
  const hasValidId = Number.isInteger(spellId) && spellId > 0;

  useEffect(() => {
    if (!hasValidId) {
      setSpell(null);
      setError("Invalid or missing spell ID.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setSpell(null);
      setError("");
      try {
        const response = await fetchBackend(`${spellsApiEndpoint}/${spellId}/delete`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await readApiJson<SpellDto>(response);
        if (!controller.signal.aborted) setSpell(result);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The spell could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [hasValidId, spellId]);

  const remove = async () => {
    if (!hasValidId || !spell || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(`${spellsApiEndpoint}/${spellId}`, {
        method: "DELETE",
        cache: "no-store",
        headers: { Accept: "application/json", "X-CSRF-TOKEN": csrfToken },
      });
      await readApiJson<unknown>(response);
      navigate("/Admin/Database?entity=Spells");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The spell could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void remove();
  };

  if (loading) return <p>Loading spell...</p>;

  return (
    <>
      <h2>Delete Spell</h2>
      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      {spell ? (
        <>
          <p>Are you sure you want to delete this spell?</p>
          <dl className="row">
            <dt className="col-sm-3">Class / specialization</dt>
            <dd className="col-sm-9"><ClassLabel value={spell.disciplineId} /></dd>
            <dt className="col-sm-3">Category</dt>
            <dd className="col-sm-9"><CategoryLabel value={spell.categoryId} /></dd>
            <dt className="col-sm-3">Name</dt>
            <dd className="col-sm-9">{spell.name}</dd>

            <dt className="col-sm-3">Description</dt>
            <dd className="col-sm-9">{spell.description}</dd>

            <dt className="col-sm-3">Type</dt>
            <dd className="col-sm-9">{spell.quality}</dd>
          </dl>

          <form onSubmit={submit}>
            <button type="submit" className="btn btn-danger" disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>{" "}
            <Link to="/Admin/Database?entity=Spells" className="btn btn-secondary">Cancel</Link>
          </form>
        </>
      ) : (
        <Link to="/Admin/Database?entity=Spells" className="btn btn-secondary">Back</Link>
      )}
    </>
  );
}
