"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import {
  accessControlApi,
  groupPermissions,
  parseRoleSnapshot,
  type AccessControlAudit,
  type AccessRole,
  type PermissionDefinition,
  type RoleSecurityRevision,
  type RoleUserSummary,
  type UserRoleSummary,
} from "@/lib/admin-access-control";

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Access-control request failed.";
  return message.toLowerCase().includes("changed by another request")
    ? "This role changed on the server. Your unsaved draft was preserved; reload the role before retrying."
    : message;
}

function dateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function RolesAdmin() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(adminPermissions.roles.create);
  const canUpdate = hasPermission(adminPermissions.roles.update);
  const canDelete = hasPermission(adminPermissions.roles.delete);
  const canRestore = hasPermission(adminPermissions.roles.restore);
  const canReadPermissions = hasPermission(adminPermissions.rolePermissions.read);
  const canUpdatePermissions = hasPermission(adminPermissions.rolePermissions.update);
  const canReadAssignments = hasPermission(adminPermissions.userRoles.read);
  const canUpdateAssignments = hasPermission(adminPermissions.userRoles.update);
  const canReadUsers = hasPermission(adminPermissions.users.read);

  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [catalog, setCatalog] = useState<PermissionDefinition[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState<AccessRole | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDisabled, setDraftDisabled] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [history, setHistory] = useState<RoleSecurityRevision[]>([]);
  const [roleUsers, setRoleUsers] = useState<RoleUserSummary[]>([]);
  const [users, setUsers] = useState<UserRoleSummary[]>([]);
  const [audit, setAudit] = useState<AccessControlAudit[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const groupedCatalog = useMemo(() => groupPermissions(catalog), [catalog]);
  const assignedIds = useMemo(() => new Set(roleUsers.map((user) => user.id)), [roleUsers]);
  const assignableUsers = useMemo(() => users.filter((user) => !assignedIds.has(user.id)), [users, assignedIds]);

  const loadRoles = useCallback(async (preferredId?: string) => {
    const next = await accessControlApi.roles();
    setRoles(next);
    setSelectedId((current) => {
      const wanted = preferredId ?? current;
      return next.some((role) => role.id === wanted) ? wanted : (next[0]?.id ?? "");
    });
  }, []);

  const loadSelected = useCallback(async (roleId: string) => {
    if (!roleId) { setSelected(null); return; }
    const requests: Promise<unknown>[] = [accessControlApi.role(roleId)];
    if (canReadPermissions) requests.push(accessControlApi.permissions());
    if (canReadAssignments) requests.push(accessControlApi.roleUsers(roleId));
    if (canReadUsers && canUpdateAssignments) requests.push(accessControlApi.users());
    requests.push(accessControlApi.history(roleId));
    requests.push(accessControlApi.audit(roleId));

    const results = await Promise.all(requests);
    const role = results[0] as AccessRole;
    let index = 1;
    setSelected(role);
    setDraftName(role.name);
    setDraftDisabled(role.isDisabled);
    setDraftPermissions([...role.permissions]);
    if (canReadPermissions) setCatalog(results[index++] as PermissionDefinition[]); else setCatalog([]);
    if (canReadAssignments) setRoleUsers(results[index++] as RoleUserSummary[]); else setRoleUsers([]);
    if (canReadUsers && canUpdateAssignments) setUsers(results[index++] as UserRoleSummary[]); else setUsers([]);
    setHistory(results[index++] as RoleSecurityRevision[]);
    setAudit(results[index] as AccessControlAudit[]);
  }, [canReadAssignments, canReadPermissions, canReadUsers, canUpdateAssignments]);

  useEffect(() => { void loadRoles().catch((reason) => setError(errorMessage(reason))); }, [loadRoles]);
  useEffect(() => { setError(""); setMessage(""); void loadSelected(selectedId).catch((reason) => setError(errorMessage(reason))); }, [loadSelected, selectedId]);

  const run = async (operation: () => Promise<void>, success: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await operation(); setMessage(success); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  };

  const replaceSelected = async (role: AccessRole, success: string) => {
    setSelected(role); setDraftName(role.name); setDraftDisabled(role.isDisabled); setDraftPermissions([...role.permissions]);
    await loadRoles(role.id); await loadSelected(role.id); setMessage(success);
  };

  const togglePermission = (permissionId: string) => {
    if (!canReadPermissions || !canUpdatePermissions) return;
    setDraftPermissions((current) => current.includes(permissionId) ? current.filter((value) => value !== permissionId) : [...current, permissionId].sort());
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div><h1 className="h3 mb-1">Roles & permissions</h1><p className="text-muted mb-0">Manage custom roles, effective grants, assignments, history and audit records.</p></div>
      </div>
      <div aria-live="polite">{error ? <div className="alert alert-danger">{error}</div> : null}{message ? <div className="alert alert-success">{message}</div> : null}</div>

      {canCreate ? <form className="card card-body mb-3" onSubmit={(event) => { event.preventDefault(); const name = newRoleName.trim(); if (!name) return; void run(async () => { const created = await accessControlApi.createRole(name, []); setNewRoleName(""); await loadRoles(created.id); setSelectedId(created.id); }, "Role created."); }}>
        <label className="form-label" htmlFor="new-role-name">Create custom role</label>
        <div className="d-flex flex-column flex-md-row gap-2"><input id="new-role-name" className="form-control" value={newRoleName} maxLength={256} onChange={(event) => setNewRoleName(event.target.value)} placeholder="e.g. Content Editor" disabled={busy} /><button className="btn btn-primary" type="submit" disabled={busy || !newRoleName.trim()}>Create role</button></div>
      </form> : null}

      <div className="row g-3">
        <div className="col-12 col-xl-3"><section className="card h-100"><div className="card-header fw-semibold">Roles</div><div className="list-group list-group-flush">
          {roles.map((role) => <button type="button" className={`list-group-item list-group-item-action text-start${role.id === selectedId ? " active" : ""}`} key={role.id} onClick={() => setSelectedId(role.id)}><span className="d-flex justify-content-between gap-2"><span>{role.name}</span><span className="badge text-bg-secondary">{role.userCount}</span></span><small className={role.id === selectedId ? "text-white-50" : "text-muted"}>{role.isSystem ? "System role" : role.isDisabled ? "Disabled" : "Custom role"}</small></button>)}
          {!roles.length ? <div className="p-3 text-muted">No roles available.</div> : null}
        </div></section></div>

        <div className="col-12 col-xl-9">{!selected ? <div className="card card-body text-muted">Select a role.</div> : <div className="d-grid gap-3">
          <section className="card card-body">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><div><h2 className="h5 mb-1">Role settings</h2><div className="text-muted small">Version {selected.version} · {selected.userCount} assigned user(s)</div></div>{selected.isSystem ? <span className="badge text-bg-warning align-self-start">Protected system role</span> : null}</div>
            <div className="row g-3 align-items-end"><div className="col-12 col-md-7"><label className="form-label" htmlFor="role-name">Name</label><input id="role-name" className="form-control" value={draftName} onChange={(event) => setDraftName(event.target.value)} disabled={!canUpdate || selected.isSystem || busy} /></div><div className="col-12 col-md-5"><div className="form-check"><input id="role-disabled" className="form-check-input" type="checkbox" checked={draftDisabled} onChange={(event) => setDraftDisabled(event.target.checked)} disabled={!canUpdate || selected.isSystem || busy} /><label className="form-check-label" htmlFor="role-disabled">Disable this role</label></div></div></div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              {canUpdate ? <button className="btn btn-primary" type="button" disabled={busy || selected.isSystem || !draftName.trim()} onClick={() => void run(async () => { const updated = await accessControlApi.updateRole(selected.id, draftName.trim(), draftDisabled, selected.version); await replaceSelected(updated, "Role settings saved."); }, "Role settings saved.")}>Save settings</button> : null}
              {canDelete ? <button className="btn btn-outline-danger" type="button" disabled={busy || selected.isSystem || selected.userCount > 0} onClick={() => { if (!window.confirm(`Delete role “${selected.name}”?`)) return; void run(async () => { await accessControlApi.deleteRole(selected.id, selected.version); setSelected(null); setSelectedId(""); await loadRoles(); }, "Role deleted."); }}>Delete role</button> : null}
            </div>
          </section>

          {canReadPermissions ? <section className="card card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h2 className="h5 mb-1">Permissions</h2><div className="text-muted small">{draftPermissions.length} effective catalog grant(s) selected</div></div>{canUpdatePermissions ? <button className="btn btn-primary" type="button" disabled={busy || selected.isSystem} onClick={() => void run(async () => { const updated = await accessControlApi.replacePermissions(selected.id, draftPermissions, selected.version); await replaceSelected(updated, "Permissions saved."); }, "Permissions saved.")}>Save permissions</button> : null}</div>
            <div className="row g-3">{groupedCatalog.map((group) => <div className="col-12 col-md-6 col-xxl-4" key={group.resource}><fieldset className="border rounded p-3 h-100"><legend className="float-none w-auto px-1 fs-6 text-capitalize">{group.resource.replaceAll("_", " ")}</legend>{group.permissions.map((permission) => <div className="form-check" key={permission.id}><input className="form-check-input" id={`permission-${permission.id}`} type="checkbox" checked={draftPermissions.includes(permission.id)} disabled={!canUpdatePermissions || selected.isSystem || busy} onChange={() => togglePermission(permission.id)} /><label className="form-check-label" htmlFor={`permission-${permission.id}`} title={permission.description}>{permission.operation}</label></div>)}</fieldset></div>)}</div>
          </section> : canUpdatePermissions ? <div className="alert alert-warning mb-0">Editing grants requires both <code>role_permissions.read</code> and <code>role_permissions.update</code>.</div> : null}

          {canReadAssignments ? <section className="card card-body">
            <h2 className="h5">Assigned users</h2>
            {canUpdateAssignments && canReadUsers ? <div className="d-flex flex-column flex-md-row gap-2 mb-3"><label className="visually-hidden" htmlFor="assign-role-user">User</label><select id="assign-role-user" className="form-select" value={assignUserId} onChange={(event) => setAssignUserId(event.target.value)} disabled={busy}><option value="">Select a user…</option>{assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.userName}{user.email ? ` · ${user.email}` : ""}</option>)}</select><button className="btn btn-primary" type="button" disabled={busy || !assignUserId} onClick={() => void run(async () => { await accessControlApi.assignUser(selected.id, assignUserId); setAssignUserId(""); await loadSelected(selected.id); }, "User assigned.")}>Assign</button></div> : null}
            <div className="table-responsive"><table className="table table-sm align-middle mb-0"><thead><tr><th>User</th><th>Email</th><th className="text-end">Action</th></tr></thead><tbody>{roleUsers.map((user) => <tr key={user.id}><td>{user.userName}</td><td>{user.email ?? "—"}</td><td className="text-end">{canUpdateAssignments ? <button className="btn btn-sm btn-outline-danger" type="button" disabled={busy} onClick={() => void run(async () => { await accessControlApi.revokeUser(selected.id, user.id); await loadSelected(selected.id); }, "Role assignment removed.")}>Remove</button> : null}</td></tr>)}{!roleUsers.length ? <tr><td colSpan={3} className="text-muted">No users assigned.</td></tr> : null}</tbody></table></div>
          </section> : null}

          <section className="card card-body"><h2 className="h5">History</h2><div className="table-responsive"><table className="table table-sm align-middle mb-0"><thead><tr><th>Version</th><th>Action</th><th>Actor</th><th>Time</th><th>Snapshot</th><th /></tr></thead><tbody>
            {history.map((revision) => { const snapshot = parseRoleSnapshot(revision.snapshot); return <tr key={`${revision.version}-${revision.createdAtUtc}`}><td>{revision.version}</td><td>{revision.action}</td><td>{revision.actor}</td><td>{dateTime(revision.createdAtUtc)}</td><td>{snapshot ? `${snapshot.name} · ${snapshot.permissions.length} permissions${snapshot.isDisabled ? " · disabled" : ""}` : "Stored snapshot"}</td><td className="text-end">{canRestore ? <button className="btn btn-sm btn-outline-secondary" type="button" disabled={busy || selected.isSystem} onClick={() => void run(async () => { const restored = await accessControlApi.restore(selected.id, revision.version, selected.version); await replaceSelected(restored, `Restored revision ${revision.version}.`); }, `Restored revision ${revision.version}.`)}>Restore</button> : null}</td></tr>; })}
            {!history.length ? <tr><td colSpan={6} className="text-muted">No history yet.</td></tr> : null}
          </tbody></table></div></section>

          <section className="card card-body"><h2 className="h5">Audit</h2><div className="table-responsive"><table className="table table-sm align-middle mb-0"><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th></tr></thead><tbody>{audit.map((entry) => <tr key={entry.id}><td>{dateTime(entry.createdAtUtc)}</td><td>{entry.action}</td><td>{entry.actor}</td><td>{entry.targetUserName ?? entry.targetRoleName ?? "—"}</td></tr>)}{!audit.length ? <tr><td colSpan={4} className="text-muted">No audit entries for this role.</td></tr> : null}</tbody></table></div></section>
        </div>}</div>
      </div>
    </div>
  );
}
