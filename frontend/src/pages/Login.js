import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    if (user?.role === "viewer") {
      return <Navigate to="/transactions" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await login(email, password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const nextRole = result.data.user.role;
    navigate(nextRole === "viewer" ? "/transactions" : "/dashboard");
  };

  return (
    <div className="auth-layout">
      <form className="panel" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <p className="muted">Sign in to access your finance workspace.</p>

        {error && <div className="toast toast-error">{error}</div>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="helper">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
