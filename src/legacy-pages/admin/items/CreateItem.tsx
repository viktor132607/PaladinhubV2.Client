"use client";

import { useState, type FormEvent } from "react";
import { backendEndpoints, fetchBackend, readApiJson } from "@/config/api";
import { Link, useNavigate } from "@/router/nextCompat";

type ItemFormState = {
  name: string;
  icon: string;
  secondIcon: string;
  description: string;
  url: string;
  itemLevel: string;
  requiredLevel: string;
  quality: string;
};

type CsrfResponse = { token?: string };

const itemsApiEndpoint = "/Admin/api/items";

const initialState: ItemFormState = {
  name: "",
  icon: "",
  secondIcon: "",
  description: "",
  url: "",
  itemLevel: "",
  requiredLevel: "",
  quality: "",
};

async function getCsrfToken(): Promise<string> {
  const response = await fetchBackend(backendEndpoints.auth.csrf, { cache: "no-store" });
  const result = await readApiJson<CsrfResponse>(response);
  if (!result?.token) throw new Error("The server did not return a CSRF token.");
  return result.token;
}

function nullableInteger(value: string, fieldName: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed)) throw new Error(`${fieldName} must be a whole number.`);
  return parsed;
}

export default function CreateItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ItemFormState>(initialState);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field: keyof ItemFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setError("");
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetchBackend(itemsApiEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon.trim() || null,
          secondIcon: form.secondIcon.trim() || null,
          description: form.description.trim() || null,
          url: form.url.trim() || null,
          itemLevel: nullableInteger(form.itemLevel, "Item level"),
          requiredLevel: nullableInteger(form.requiredLevel, "Required level"),
          quality: form.quality.trim() || null,
        }),
      });
      await readApiJson<unknown>(response);
      navigate("/Admin/Database?entity=Items");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The item could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2>Create Item</h2>

      {error && error !== "Name is required." ? (
        <div className="text-danger mb-3" role="alert">{error}</div>
      ) : null}

      <form onSubmit={submit}>
        <div className="mb-3">
          <label htmlFor="item-name" className="form-label">Name</label>
          <input id="item-name" name="name" className="form-control" value={form.name} onChange={(event) => update("name", event.target.value)} disabled={saving} required />
          <span className="text-danger">{error === "Name is required." ? error : ""}</span>
        </div>

        <div className="mb-3">
          <label htmlFor="item-icon" className="form-label">Icon</label>
          <input id="item-icon" name="icon" className="form-control" value={form.icon} onChange={(event) => update("icon", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label htmlFor="item-second-icon" className="form-label">SecondIcon</label>
          <input id="item-second-icon" name="secondIcon" className="form-control" value={form.secondIcon} onChange={(event) => update("secondIcon", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label htmlFor="item-description" className="form-label">Description</label>
          <textarea id="item-description" name="description" className="form-control" value={form.description} onChange={(event) => update("description", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label htmlFor="item-url" className="form-label">Url</label>
          <input id="item-url" name="url" className="form-control" value={form.url} onChange={(event) => update("url", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label htmlFor="item-level" className="form-label">ItemLevel</label>
          <input id="item-level" name="itemLevel" className="form-control" type="number" step={1} value={form.itemLevel} onChange={(event) => update("itemLevel", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label htmlFor="item-required-level" className="form-label">RequiredLevel</label>
          <input id="item-required-level" name="requiredLevel" className="form-control" type="number" step={1} value={form.requiredLevel} onChange={(event) => update("requiredLevel", event.target.value)} disabled={saving} />
        </div>

        <div className="mb-3">
          <label htmlFor="item-quality" className="form-label">Quality</label>
          <input id="item-quality" name="quality" className="form-control" value={form.quality} onChange={(event) => update("quality", event.target.value)} disabled={saving} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>{" "}
        <Link to="/Admin/Database?entity=Items" className="btn btn-secondary">Cancel</Link>
      </form>
    </>
  );
}
