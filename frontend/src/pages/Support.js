import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Support() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "" });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoint = isAdmin ? "/support" : "/support/my";
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const res = await api.get(`${endpoint}?${params.toString()}`);
      setTickets(res.data.data.tickets || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const submitTicket = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      setError("Message is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.post("/support", { message: message.trim() });
      setMessage("");
      setToast("Support ticket created");
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create support ticket");
    } finally {
      setSaving(false);
    }
  };

  const resolveTicket = async (id) => {
    setError("");

    try {
      await api.put(`/support/${id}`, { status: "resolved" });
      setToast("Support ticket resolved");
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve support ticket");
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Support</h2>
          <p className="muted">
            {isAdmin ? "Manage all helpcare requests." : "Create and track your own helpcare requests."}
          </p>
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}
      {error && <div className="toast toast-error">{error}</div>}

      {!isAdmin && (
        <section className="panel">
          <h3>Create Ticket</h3>
          <form onSubmit={submitTicket} className="grid-form">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Describe the issue you need help with"
              required
            />
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </section>
      )}

      <section className="panel">
        <h3>{isAdmin ? "All Tickets" : "My Tickets"}</h3>
        <div className="actions" style={{ marginBottom: "0.65rem" }}>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        {loading ? (
          <div className="loader">Loading tickets...</div>
        ) : tickets.length ? (
          <table className="table">
            <thead>
              <tr>
                {isAdmin && <th>User</th>}
                <th>Message</th>
                <th>Status</th>
                <th>Created</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket._id}>
                  {isAdmin && (
                    <td>
                      {ticket.user?.name || "Unknown"}
                      <div className="muted">{ticket.user?.email || ""}</div>
                    </td>
                  )}
                  <td>{ticket.message}</td>
                  <td>{ticket.status}</td>
                  <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                  {isAdmin && (
                    <td>
                      {ticket.status === "open" ? (
                        <button type="button" className="inline-btn" onClick={() => resolveTicket(ticket._id)}>
                          Resolve
                        </button>
                      ) : (
                        <span className="muted">Resolved</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No support tickets found.</p>
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

export default Support;
