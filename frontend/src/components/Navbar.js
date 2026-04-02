import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const homePath = user.role === "viewer" ? "/transactions" : "/dashboard";

  return (
    <header className="nav-shell">
      <div className="nav-content">
        <Link to={homePath} className="brand">
          Finance Lens
        </Link>

        <nav className="nav-links">
          {(user.role === "analyst" || user.role === "admin") && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              Dashboard
            </NavLink>
          )}
          <NavLink
            to="/transactions"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Transactions
          </NavLink>
          <NavLink
            to="/support"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Support
          </NavLink>
          {user.role === "admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              Users
            </NavLink>
          )}
        </nav>

        <div className="nav-meta">
          <span className="role-pill">{user.role}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
