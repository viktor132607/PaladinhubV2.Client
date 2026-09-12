"use client";

import { useState, type FormEvent } from "react";
import RecordTypePicker from "@/components/admin/RecordTypePicker";
import CategoryPicker from "@/components/admin/CategoryPicker";
import ClassPicker from "@/components/admin/ClassPicker";
import TagPicker from "@/components/admin/TagPicker";
import SpellIconPicker from "@/components/admin/SpellIconPicker";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

type SpellForm = {
  name: string;
  icon: string;
  description: string;
  url: string;
  quality: string;
};

type SpellDto = {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  url?: string | null;
  quality?: string | null;
};

type CsrfResponse = { token?: string };

const spellsApiEndpoint = "/Admin/api/spells";

const initialForm: SpellForm = {
  name: "",
  icon: "",
  description: "",
  url: "",
  quality: "spell",
};

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const payload = await readApiJson<CsrfResponse>(response);
  if (!payload?.token) throw new Error("The server did not return a CSRF token.");
  return payload.token;
}

export default function CreateSpell() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SpellForm>(initialForm);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [disciplineId, setDisciplineId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [typeBusy, setTypeBusy] = useState(false);
  const [typeValid, setTypeValid] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof SpellForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || iconUploading || typeBusy || !typeValid) return;

    setError("");
    const name = form.name.trim();
    if (!name) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(spellsApiEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          name,
          icon: form.icon.trim() || null,
          description: form.description.trim() || null,
          url: form.url.trim() || null,
          quality: form.quality,
          categoryId,
          disciplineId,
          tagIds,
        }),
      });
      await readApiJson<SpellDto>(response);
      navigate("/Admin/Database?entity=Spells");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The spell could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2>Create Spell</h2>

      {error && error !== "Name is required." ? (
        <div className="text-danger mb-3" role="alert">{error}</div>
      ) : null}

      <form onSubmit={submit}>
        <CategoryPicker value={categoryId} onChange={setCategoryId} disabled={saving} />
        <ClassPicker value={disciplineId} onChange={setDisciplineId} disabled={saving} />
        <TagPicker value={tagIds} onChange={setTagIds} disabled={saving} />
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
          {form.url.trim() ? (
            <div className="mt-1">
              <a href={form.url.trim()} target="_blank">{form.url.trim()}</a>
            </div>
          ) : null}
        </div>

        <div className="mb-3">
          <RecordTypePicker value={form.quality} onChange={(type) => update("quality", type)} disabled={saving || iconUploading} onBusyChange={setTypeBusy} onValidityChange={setTypeValid} />
        </div>

        <button type="submit" className="btn btn-success" disabled={saving || iconUploading || typeBusy || !typeValid}>{saving ? "Creating..." : "Create"}</button>{" "}
        <Link to="/Admin/Database?entity=Spells" className="btn btn-secondary">Cancel</Link>
      </form>
    </>
  );
}
