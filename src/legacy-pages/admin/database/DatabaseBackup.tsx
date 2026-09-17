"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import { fetchBackend, readApiJson } from "@/config/api";
import { useLocalization } from "@/localization/LocalizationContext";

const endpoint = "/api/admin/database-backup";

export default function DatabaseBackup() {
  const { hasPermission, refresh } = useAuth();
  const { t } = useLocalization();
  const [archive, setArchive] = useState<File | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState<"export" | "restore" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(operation: "export" | "restore") {
    if (busyRef.current) return;
    if (operation === "restore" && (!archive || confirmation !== "RESTORE")) return;
    busyRef.current = true;
    setBusy(operation); setError(""); setNotice("");
    try {
      if (operation === "export") {
        const response = await fetchBackend(`${endpoint}/export`, { cache: "no-store", headers: { Accept: "application/octet-stream" } });
        if (!response.ok) await readApiJson(response);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `paladinhub-full-database-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`;
        document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setNotice(t("backup.downloaded"));
      } else {
        const body = new FormData();
        body.append("archive", archive!); body.append("confirmation", confirmation);
        await readApiJson(await fetchBackend(`${endpoint}/restore`, { method: "POST", body }));
        setArchive(null); setConfirmation("");
        if (inputRef.current) inputRef.current.value = "";
        setNotice(t("backup.restored"));
        await refresh();
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("backup.failed"));
    } finally {
      busyRef.current = false; setBusy(null);
    }
  }

  return <div className="container-fluid py-4">
    <h1 className="h2 mb-3">{t("Database backup")}</h1>
    <p>{t("backup.scope")}</p>
    <p className="text-muted">{t("backup.external")}</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {notice && <div className="alert alert-success" role="status">{notice}</div>}
    {busy && <div className="alert alert-info" role="status">{t(busy === "export" ? "backup.exporting" : "backup.restoring")}</div>}
    <div className="row g-4" aria-busy={busy !== null}>
      {hasPermission(adminPermissions.databaseBackups.read) && <section className="col-12 col-xl-6">
        <div className="card p-4 h-100">
          <h2 className="h4">{t("backup.export")}</h2>
          <p>{t("backup.exportHelp")}</p>
          <button type="button" className="btn btn-primary align-self-start" disabled={!!busy} onClick={() => void run("export")}>{t("backup.download")}</button>
        </div>
      </section>}
      {hasPermission(adminPermissions.databaseBackups.restore) && <section className="col-12 col-xl-6">
        <div className="card p-4 h-100">
          <h2 className="h4">{t("backup.restore")}</h2>
          <div className="alert alert-warning">{t("backup.warning")}</div>
          <label className="form-label" htmlFor="backup-archive">{t("backup.file")}</label>
          <input ref={inputRef} id="backup-archive" type="file" accept=".dump" className="form-control mb-3" disabled={!!busy} onChange={event => { setArchive(event.target.files?.[0] ?? null); setConfirmation(""); setError(""); setNotice(""); }} />
          <label className="form-label" htmlFor="backup-confirmation">{t("backup.confirm")}</label>
          <input id="backup-confirmation" className="form-control mb-3" value={confirmation} autoComplete="off" spellCheck={false} disabled={!!busy} onChange={event => setConfirmation(event.target.value)} />
          <button type="button" className="btn btn-danger align-self-start" disabled={!!busy || !archive?.size || confirmation !== "RESTORE"} onClick={() => void run("restore")}>{t("backup.restore")}</button>
        </div>
      </section>}
    </div>
  </div>;
}
