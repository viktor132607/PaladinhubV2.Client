"use client";

import { useEffect, useState, type FormEvent } from "react";
import RecordTypePicker from "@/components/admin/RecordTypePicker";
import SpellIconPicker from "@/components/admin/SpellIconPicker";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate, useParams } from "@/router/nextCompat";

type SpellDto = {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality?: string | null;
};

type SpellForm = {
  name: string;
  icon: string;
  description: string;
  url: string;
  quality: string;
};

type CsrfResponse = { token?: string };
const spellsApiEndpoint = "/Admin/api/spells";
const emptyForm: SpellForm = { name: "", icon: "", description: "", url: "", quality: "spell" };

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

export default function EditSpell() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<SpellForm>(emptyForm);
  const [spellLoaded, setSpellLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeBusy, setTypeBusy] = useState(false);
  const [typeValid, setTypeValid] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [error, setError] = useState("");
  const spellId = Number(id);
  const hasValidId = Number.isInteger(spellId) && spellId > 0;

  useEffect(() => {
    if (!hasValidId) {
      setSpellLoaded(false);
      setError("Invalid or missing spell ID.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setSpellLoaded(false);
      setError("");
      try {
        const response = await fetchBackend(`${spellsApiEndpoint}/${spellId}/edit`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const spell = await readApiJson<SpellDto>(response);
        if (controller.signal.aborted) return;
        setForm({
          name: spell.name ?? "",
          icon: spell.icon ?? "",
          description: spell.description ?? "",
          url: spell.url ?? "",
          quality: spell.quality ?? "spell",
        });
        setSpellLoaded(true);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The spell could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [hasValidId, spellId]);

  const update = (field: keyof SpellForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasValidId || !spellLoaded || saving || iconUploading || typeBusy || !typeValid) return;
    setError("");
    const name = form.name.trim();
    if (!name) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(`${spellsApiEndpoint}/${spellId}`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          id: spellId,
          name,
          icon: form.icon.trim() || null,
          description: form.description.trim() || null,
          url: form.url.trim() || null,
          quality: form.quality,
        }),
      });
      await readApiJson<SpellDto>(response);
      navigate("/Admin/Database?entity=Spells");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The spell could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading spell...</p>;
  if (!spellLoaded) return <><h2>Edit Spell</h2><div className="alert alert-danger" role="alert">{error || "The spell could not be loaded."}</div><Link className="btn btn-secondary" to="/Admin/Database?entity=Spells">Back</Link></>;

  return (
    <>
      <h2>Edit Spell</h2>
      {error && error !== "Name is required." ? <div className="text-danger mb-3" role="alert">{error}</div> : null}
      <form onSubmit={submit}>
        <div className="mb-3">
          <label htmlFor="spell-name" className="form-label">Name</label>
          <input id="spell-name" name="name" className="form-control" value={form.name} onChange={(event) => update("name", event.target.value)} disabled={saving} />
          <span className="text-danger">{error === "Name is required." ? error : ""}</span>
        </div>
        <div className="mb-3"><SpellIconPicker value={form.icon} onChange={(icon) => update("icon", icon)} disabled={saving} onBusyChange={setIconUploading} /></div>
        <div className="mb-3">
          <label htmlFor="spell-description" className="form-label">Description</label>
          <textarea id="spell-description" name="description" className="form-control" rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} disabled={saving} />
          <span className="text-danger" />
        </div>
        <div className="mb-3">
          <label htmlFor="spell-url" className="form-label">Url</label>
          <input id="spell-url" name="url" className="form-control" value={form.url} onChange={(event) => update("url", event.target.value)} disabled={saving} />
          {form.url.trim() ? <div className="mt-1"><a href={form.url.trim()} target="_blank">{form.url.trim()}</a></div> : null}
        </div>
        <div className="mb-3">
          <RecordTypePicker value={form.quality} onChange={(type) => update("quality", type)} disabled={saving || iconUploading} onBusyChange={setTypeBusy} onValidityChange={setTypeValid} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || iconUploading || typeBusy || !typeValid}>{saving ? "Saving..." : "Save"}</button>{" "}
        <Link to="/Admin/Database?entity=Spells" className="btn btn-secondary">Cancel</Link>
      </form>
    </>
  );
}
