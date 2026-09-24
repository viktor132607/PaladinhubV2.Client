"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { adminPermissions } from "@/auth/adminPermissions";
import {
  accessControlApi,
  type AccessRole,
  type UserRoleSummary,
} from "@/lib/admin-access-control";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "User-role request failed.";
}

export default function UsersAdmin() {
  const { user: currentUser, refresh, hasPermission } = useAuth();
  const canReadRoles = hasPermission(adminPermissions.roles.read);
  const canUpdateAssignments = hasPermission(adminPermissions.userRoles.update);
  const [users, setUsers] = useState<UserRoleSummary[]>([]);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [nextUsers, nextRoles] = await Promise.all([
      accessControlApi.users(query),
      canReadRoles ? accessControlApi.roles() : Promise.resolve([] as AccessRole[]),
    ]);
    setUsers(nextUsers);
    setRoles(nextRoles);
  }, [canReadRoles, query]);

  useEffect(() => {
    setError("");
    void load().catch((reason) => setError(errorMessage(reason)));
  }, [load]);

  const activeRoles = useMemo(
    () => roles.filter((role) => !role.isDisabled),
    [roles],
  );

  const mutate = async (
    key: string,
    operation: () => Promise<void>,
    success: string,
    targetUserId: string,
  ) => {
    setBusyKey(key);
    setError("");
    setMessage("");
    try {
      await operation();
      await load();
      if (currentUser?.id === targetUserId) await refresh();
      setMessage(success);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="admin-users-header mb-3">
        <div>
          <h1 className="h3 mb-1">Users & role assignments</h1>
          <p className="text-muted mb-0">Search existing Identity users and manage their current role memberships.</p>
        </div>
        <form
          className="admin-users-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <label className="visually-hidden" htmlFor="access-user-search">Search users</label>
          <input
            id="access-user-search"
            className="form-control"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Username or email"
          />
          <button className="btn btn-primary" type="submit">Search</button>
          {query ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setSearch(""); setQuery(""); }}>Clear</button> : null}
        </form>
      </div>

      <div aria-live="polite">
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {message ? <div className="alert alert-success">{message}</div> : null}
      </div>

      {!canReadRoles && canUpdateAssignments ? (
        <div className="alert alert-warning">Role assignment controls require both <code>user_roles.update</code> and <code>roles.read</code> so the client can resolve stable role IDs.</div>
      ) : null}

      <div className="row g-3">
        {users.map((account) => {
          const availableRoles = activeRoles.filter((role) => !account.roles.some((name) => name.toLowerCase() === role.name.toLowerCase()));
          const selectedRole = selectedRoleByUser[account.id] ?? "";
          return (
            <div className="col-12 col-xl-6" key={account.id}>
              <article className="card h-100">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                    <div>
                      <h2 className="h5 mb-1">{account.userName}</h2>
                      <div className="text-muted small">{account.email ?? "No email"}</div>
                    </div>
                    {currentUser?.id === account.id ? <span className="badge text-bg-info align-self-start">Current session</span> : null}
                  </div>

                  <h3 className="h6">Assigned roles</h3>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {account.roles.map((roleName) => {
                      const role = roles.find((candidate) => candidate.name.toLowerCase() === roleName.toLowerCase());
                      const key = `${account.id}:${role?.id ?? roleName}`;
                      return (
                        <span className="badge text-bg-secondary d-inline-flex align-items-center gap-2" key={roleName}>
                          {roleName}
                          {canUpdateAssignments && role ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-white p-0 text-decoration-none"
                              aria-label={`Remove ${roleName} from ${account.userName}`}
                              disabled={Boolean(busyKey)}
                              onClick={() => void mutate(
                                key,
                                () => accessControlApi.revokeUser(role.id, account.id),
                                `${roleName} removed from ${account.userName}.`,
                                account.id,
                              )}
                            >
                              ×
                            </button>
                          ) : null}
                        </span>
                      );
                    })}
                    {!account.roles.length ? <span className="text-muted small">No roles assigned.</span> : null}
                  </div>

                  {canUpdateAssignments && canReadRoles ? (
                    <div className="d-flex flex-column flex-sm-row gap-2">
                      <label className="visually-hidden" htmlFor={`role-for-${account.id}`}>Assign role</label>
                      <select
                        id={`role-for-${account.id}`}
                        className="form-select"
                        value={selectedRole}
                        disabled={Boolean(busyKey) || !availableRoles.length}
                        onChange={(event) => setSelectedRoleByUser((current) => ({ ...current, [account.id]: event.target.value }))}
                      >
                        <option value="">{availableRoles.length ? "Select role…" : "No available roles"}</option>
                        {availableRoles.map((role) => <option value={role.id} key={role.id}>{role.name}{role.isSystem ? " · system" : ""}</option>)}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={Boolean(busyKey) || !selectedRole}
                        onClick={() => {
                          const role = roles.find((candidate) => candidate.id === selectedRole);
                          if (!role) return;
                          void mutate(
                            `${account.id}:${role.id}`,
                            () => accessControlApi.assignUser(role.id, account.id),
                            `${role.name} assigned to ${account.userName}.`,
                            account.id,
                          ).then(() => setSelectedRoleByUser((current) => ({ ...current, [account.id]: "" })));
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>
          );
        })}
        {!users.length ? <div className="col-12"><div className="card card-body text-muted">No users matched the current search.</div></div> : null}
      </div>
    </div>
  );
}
