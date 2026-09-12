"use client";
import { CategoryLabel } from "@/components/admin/CategoryPicker";
import { ClassLabel } from "@/components/admin/ClassPicker";
import { TagLabel } from "@/components/admin/TagPicker";

import { useEffect, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { Link, useParams } from "@/router/nextCompat";

type ItemDto = {
  tagIds?: number[];
  disciplineId?: number | null;
  categoryId?: number | null;
  id: number;
  name: string;
  icon?: string | null;
  secondIcon?: string | null;
  description?: string | null;
  url?: string | null;
  itemLevel?: number | null;
  requiredLevel?: number | null;
  quality?: string | null;
};

const itemsApiEndpoint = "/Admin/api/items";

export default function ItemDetails() {
  const { id } = useParams<{ id?: string }>();
  const [item, setItem] = useState<ItemDto | null>(null);
  const [loading, setLoading] = useState(true);
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
        const response = await fetchBackend(`${itemsApiEndpoint}/${itemId}`, {
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

  if (loading) return <p>Loading item...</p>;

  if (!item) {
    return (
      <>
        <h2>Item Details</h2>
        <div className="text-danger mb-3" role="alert">{error || "Item not found."}</div>
        <Link to="/Admin/Database?entity=Items" className="btn btn-secondary">Back</Link>
      </>
    );
  }

  return (
    <>
      <h2>Item Details</h2>

      <dl className="row">
        <dt className="col-sm-3">Tags</dt>
        <dd className="col-sm-9"><TagLabel value={item.tagIds} /></dd>
        <dt className="col-sm-3">Class / specialization</dt>
        <dd className="col-sm-9"><ClassLabel value={item.disciplineId} /></dd>
        <dt className="col-sm-3">Category</dt>
        <dd className="col-sm-9"><CategoryLabel value={item.categoryId} /></dd>
        <dt className="col-sm-3">Name</dt>
        <dd className="col-sm-9">{item.name}</dd>

        <dt className="col-sm-3">Icon</dt>
        <dd className="col-sm-9">
          {item.icon ? (
            <>
              <img src={`/images/ItemIcons/${encodeURIComponent(item.icon)}`} alt={item.name} className="img-thumbnail" style={{ maxWidth: 64 }} />
              <div>{item.icon}</div>
            </>
          ) : null}
        </dd>

        <dt className="col-sm-3">Second Icon</dt>
        <dd className="col-sm-9">
          {item.secondIcon ? (
            <>
              <img src={`/images/ItemIcons/${encodeURIComponent(item.secondIcon)}`} alt={item.name} className="img-thumbnail" style={{ maxWidth: 64 }} />
              <div>{item.secondIcon}</div>
            </>
          ) : null}
        </dd>

        <dt className="col-sm-3">Description</dt>
        <dd className="col-sm-9">{item.description}</dd>

        <dt className="col-sm-3">Url</dt>
        <dd className="col-sm-9">
          {item.url ? <a href={item.url} target="_blank">{item.url}</a> : null}
        </dd>

        <dt className="col-sm-3">Item Level</dt>
        <dd className="col-sm-9">{item.itemLevel}</dd>

        <dt className="col-sm-3">Required Level</dt>
        <dd className="col-sm-9">{item.requiredLevel}</dd>

        <dt className="col-sm-3">Quality</dt>
        <dd className="col-sm-9">{item.quality}</dd>
      </dl>

      <Link to="/Admin/Database?entity=Items" className="btn btn-secondary">Back</Link>
    </>
  );
}
