import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    const result = await register({ ...form, status: "active" });

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setFeedback({ type: "success", message: "Registration successful. Please login." });
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="auth-layout">
      <form className="panel" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p className="muted">Register a user account for this finance dashboard.</p>

        {feedback.message && (
          <div className={`toast ${feedback.type === "error" ? "toast-error" : "toast-success"}`}>
            {feedback.message}
          </div>
        )}

        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          minLength={6}
          required
        />

        <label htmlFor="role">Role</label>
        <select id="role" name="role" value={form.role} onChange={handleChange}>
          <option value="viewer">Viewer</option>
          <option value="analyst">Analyst</option>
        </select>

        <p className="helper">Admin access is reserved for the fixed system account.</p>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="helper">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
