import { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../services/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const res = await api.get(`/api/users?${params.toString()}`);
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (id, payload) => {
    setError("");

    try {
      await api.put(`/api/users/${id}`, payload);
      setToast("User updated");
      await loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update user"));
    }
  };

  const deleteUser = async (id) => {
    setError("");

    try {
      await api.delete(`/api/users/${id}`);
      setToast("User deleted");
      await loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete user"));
    }
  };

  return (
    <div className="stack">
      <h2>User Management</h2>

      {toast && <div className="toast toast-success">{toast}</div>}
      {error && <div className="toast toast-error">{error}</div>}

      <section className="panel">
        <h3>Filters</h3>
        <form
          className="grid-form"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((prev) => ({ ...prev, page: 1 }));
          }}
        >
          <input
            placeholder="Search name or email"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))}
          >
            <option value="">All Roles</option>
            <option value="viewer">Viewer</option>
            <option value="analyst">Analyst</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn">
            Apply
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Users</h3>
        {loading ? (
          <div className="loader">Loading users...</div>
        ) : users.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>
                    {user.role !== "admin" ? (
                      <>
                        <button
                          type="button"
                          className="inline-btn"
                          onClick={() =>
                            updateUser(user._id, {
                              role: user.role === "viewer" ? "analyst" : "viewer",
                            })
                          }
                        >
                          Toggle Role
                        </button>
                        <button
                          type="button"
                          className="inline-btn"
                          onClick={() =>
                            updateUser(user._id, {
                              status: user.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          Toggle Status
                        </button>
                        <button
                          type="button"
                          className="inline-btn danger"
                          onClick={() => deleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="muted">System admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No users found.</p>
        )}

        <div className="pager">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pagination.page <= 1}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <span className="muted">{pagination.total} total</span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

export default Users;
