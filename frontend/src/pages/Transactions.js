import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const getTodayValue = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  amount: "",
  type: "expense",
  category: "",
  date: getTodayValue(),
  notes: "",
};

function Transactions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    startDate: "",
    endDate: "",
    search: "",
    scope: "all",
    page: 1,
    limit: 10,
  });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });

    return params.toString();
  }, [filters]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = buildQuery();
      const res = await api.get(`/transactions${query ? `?${query}` : ""}`);
      setTransactions(res.data.data.transactions || []);
      setPagination(res.data.data.pagination || { total: 0, page: 1, pages: 1, limit: 10 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = (event) => {
    setDraftFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      ...draftFilters,
      page: 1,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: form.date || getTodayValue(),
      };

      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
        setToast("Transaction updated");
      } else {
        await api.post("/transactions", payload);
        setToast("Transaction created");
      }

      resetForm();
      await loadTransactions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tx) => {
    setEditingId(tx._id);
    setForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date ? tx.date.slice(0, 10) : "",
      notes: tx.notes || "",
    });
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      return;
    }

    try {
      await api.delete(`/transactions/${id}`);
      setToast("Transaction deleted");
      await loadTransactions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete transaction");
    }
  };

  return (
    <div className="stack">
      <h2>Transactions</h2>

      {toast && <div className="toast toast-success">{toast}</div>}
      {error && <div className="toast toast-error">{error}</div>}

      <section className="panel">
        <h3>Filters</h3>
        <form onSubmit={applyFilters} className="grid-form">
          <select name="scope" value={draftFilters.scope} onChange={handleFilterChange}>
            <option value="all">All Transactions</option>
            <option value="my">My Transactions</option>
          </select>
          <select name="type" value={draftFilters.type} onChange={handleFilterChange}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            name="category"
            placeholder="Category"
            value={draftFilters.category}
            onChange={handleFilterChange}
          />
          <input
            name="search"
            placeholder="Search notes or category"
            value={draftFilters.search}
            onChange={handleFilterChange}
          />
          <input
            name="startDate"
            type="date"
            value={draftFilters.startDate}
            onChange={handleFilterChange}
          />
          <input
            name="endDate"
            type="date"
            value={draftFilters.endDate}
            onChange={handleFilterChange}
          />
          <button className="btn" type="submit">
            Apply
          </button>
        </form>
        <p className="helper">Filter by type, category, date range, or keyword search.</p>
      </section>

      {isAdmin && (
        <section className="panel">
          <h3>{editingId ? "Edit Transaction" : "Add Transaction"}</h3>
          <form onSubmit={handleSubmit} className="grid-form">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
            <input
              type="date"
              value={form.date}
              required
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
            <div className="actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <h3>All Transactions</h3>
        {loading ? (
          <div className="loader">Loading transactions...</div>
        ) : transactions.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.category}</td>
                  <td>{tx.type}</td>
                  <td>${Number(tx.amount).toFixed(2)}</td>
                  {isAdmin && (
                    <td>
                      <button type="button" className="inline-btn" onClick={() => handleEdit(tx)}>
                        Edit
                      </button>
                      <button type="button" className="inline-btn danger" onClick={() => handleDelete(tx._id)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">
            {filters.scope === "my"
              ? "No personal transactions found. Showing shared data."
              : "No transactions found."}
          </p>
        )}

        {!isAdmin && <p className="helper">You have read-only access to transaction history.</p>}

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

export default Transactions;
