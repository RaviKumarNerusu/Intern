import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Support from "./pages/Support";
import Transactions from "./pages/Transactions";
import Users from "./pages/Users";

function PrivateRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === "viewer" ? "/transactions" : "/dashboard"} replace />;
  }

  return children;
}

function LandingRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === "viewer" ? "/transactions" : "/dashboard"} replace />;
}

function AppShell() {
  return (
    <div className="app-root">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={["analyst", "admin"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute allowedRoles={["viewer", "analyst", "admin"]}>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/support"
            element={
              <PrivateRoute allowedRoles={["viewer", "analyst", "admin"]}>
                <Support />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <Users />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<LandingRedirect />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
