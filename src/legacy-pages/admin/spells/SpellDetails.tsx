"use client";
import { CategoryLabel } from "@/components/admin/CategoryPicker";

import { useEffect, useState } from "react";
import { fetchBackend, readApiJson } from "@/config/api";
import { spellIconSource } from "@/lib/spell-icons";
import { Link, useParams } from "@/router/nextCompat";

type SpellDto = {
  categoryId?: number | null;
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality?: string | null;
};

const spellsApiEndpoint = "/Admin/api/spells";

export default function SpellDetails() {
  const { id } = useParams<{ id?: string }>();
  const [spell, setSpell] = useState<SpellDto | null>(null);
  const [loading, setLoading] = useState(true);
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
        const response = await fetchBackend(`${spellsApiEndpoint}/${spellId}`, {
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

  if (loading) return <p>Loading spell...</p>;
  if (!spell) return <><h2>Spell Details</h2><div className="alert alert-danger" role="alert">{error || "Spell not found."}</div><Link className="btn btn-secondary" to="/Admin/Database?entity=Spells">Back</Link></>;

  const iconSource = spellIconSource(spell.icon);

  return (
    <>
      <h2>Spell Details</h2>
      <dl className="row">
        <dt className="col-sm-3">Category</dt>
        <dd className="col-sm-9"><CategoryLabel value={spell.categoryId} /></dd>
        <dt className="col-sm-3">Name</dt>
        <dd className="col-sm-9">{spell.name}</dd>

        <dt className="col-sm-3">Icon</dt>
        <dd className="col-sm-9">
          {iconSource ? <><img src={iconSource} alt={spell.name} className="img-thumbnail" style={{ maxWidth: 64 }} /><div>{spell.icon}</div></> : null}
        </dd>

        <dt className="col-sm-3">Description</dt>
        <dd className="col-sm-9">{spell.description}</dd>

        <dt className="col-sm-3">Url</dt>
        <dd className="col-sm-9">
          {spell.url ? <a href={spell.url} target="_blank" rel="noopener">{spell.url}</a> : null}
        </dd>

        <dt className="col-sm-3">Type</dt>
        <dd className="col-sm-9">{spell.quality}</dd>
      </dl>

      <Link to="/Admin/Database?entity=Spells" className="btn btn-secondary">Back</Link>
    </>
  );
}
