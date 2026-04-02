import { useEffect, useState } from "react";
import api from "../services/api";

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatMonth = (month, year) => {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date);
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: { totalIncome: 0, totalExpense: 0, totalExpenses: 0, netBalance: 0 },
    categoryTotals: [],
    monthlyTrends: [],
    recentTransactions: [],
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/dashboard");
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="loader">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="toast toast-error">{error}</div>;
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Dashboard Summary</h2>
          <p className="muted">Live finance metrics and recent activity.</p>
        </div>
      </div>

      <section className="cards">
        <article className="card income">
          <h3>Total Income</h3>
          <p>{formatMoney(data.summary.totalIncome)}</p>
        </article>

        <article className="card expense">
          <h3>Total Expense</h3>
          <p>{formatMoney(data.summary.totalExpense ?? data.summary.totalExpenses)}</p>
        </article>

        <article className="card balance">
          <h3>Net Balance</h3>
          <p>{formatMoney(data.summary.netBalance)}</p>
        </article>
      </section>

      <section className="panel">
        <h3>Category Totals</h3>

        {data.categoryTotals?.length ? (
          <table className="table dashboard-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Income</th>
                <th>Expense</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {data.categoryTotals.map((item) => (
                <tr key={item.category}>
                  <td>{item.category}</td>
                  <td>{formatMoney(item.income)}</td>
                  <td>{formatMoney(item.expense)}</td>
                  <td>{item.totalTransactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No category data available yet.</p>
        )}
      </section>

      <section className="panel">
        <h3>Monthly Trends</h3>

        {data.monthlyTrends?.length ? (
          <table className="table dashboard-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Income</th>
                <th>Expense</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTrends.map((item) => (
                <tr key={`${item.year}-${item.month}`}>
                  <td>{formatMonth(item.month, item.year)}</td>
                  <td>{formatMoney(item.income)}</td>
                  <td>{formatMoney(item.expense)}</td>
                  <td>{formatMoney(item.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No monthly trend data available yet.</p>
        )}
      </section>

      <section className="panel">
        <h3>Recent Transactions</h3>

        {data.recentTransactions?.length ? (
          <ul className="tx-list">
            {data.recentTransactions.map((tx) => (
              <li key={tx._id}>
                <strong>{tx.category}</strong>
                <span>{tx.type}</span>
                  <span>{formatMoney(tx.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No transactions found.</p>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
