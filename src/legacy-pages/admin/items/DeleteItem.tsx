"use client";
import { CategoryLabel } from "@/components/admin/CategoryPicker";
import { ClassLabel } from "@/components/admin/ClassPicker";
import { PatchLabel } from "@/components/admin/PatchPicker";
import { TagLabel } from "@/components/admin/TagPicker";

import { useEffect, useState, type FormEvent } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type ItemDto = {
  tagIds?: number[];
  patchId?: number | null;
  disciplineId?: number | null;
  categoryId?: number | null;
  id: number;
  name: string;
};

type CsrfResponse = { token?: string };

const itemsApiEndpoint = "/Admin/api/items";

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const result = await readApiJson<CsrfResponse>(response);
  if (!result?.token) throw new Error("The server did not return a CSRF token.");
  return result.token;
}

export default function DeleteItem() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const itemId = Number(id);
  const hasValidId = Number.isInteger(itemId) && itemId > 0;

  useEffect(() => {
    if (!hasValidId) {
      setError("Invalid or missing item ID.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetchBackend(`${itemsApiEndpoint}/${itemId}/delete`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await readApiJson<ItemDto>(response);
        if (!controller.signal.aborted) setItem(result);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The item could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [hasValidId, itemId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidId || deleting) return;

    setDeleting(true);
    setError("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(`${itemsApiEndpoint}/${itemId}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
      });
      await readApiJson<unknown>(response);
      navigate("/Admin/Database?entity=Items");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The item could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p>Loading item...</p>;

  return (
    <>
      <h2>Delete Item</h2>

      {error ? <div className="text-danger mb-3" role="alert">{error}</div> : null}

      {item ? (
        <>
          <p>Are you sure you want to delete this item?</p>

          <dl className="row">
            <dt className="col-sm-3">Tags</dt>
            <dd className="col-sm-9"><TagLabel value={item.tagIds} /></dd>
            <dt className="col-sm-3">Patch</dt>
            <dd className="col-sm-9"><PatchLabel value={item.patchId} /></dd>
            <dt className="col-sm-3">Class / specialization</dt>
            <dd className="col-sm-9"><ClassLabel value={item.disciplineId} /></dd>
            <dt className="col-sm-3">Category</dt>
            <dd className="col-sm-9"><CategoryLabel value={item.categoryId} /></dd>
            <dt className="col-sm-3">Name</dt>
            <dd className="col-sm-9">{item.name}</dd>
          </dl>

          <form onSubmit={submit}>
            <button type="submit" className="btn btn-danger" disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>{" "}
            <Link to="/Admin/Database?entity=Items" className="btn btn-secondary">Cancel</Link>
          </form>
        </>
      ) : (
        <Link to="/Admin/Database?entity=Items" className="btn btn-secondary">Back</Link>
      )}
    </>
  );
}
