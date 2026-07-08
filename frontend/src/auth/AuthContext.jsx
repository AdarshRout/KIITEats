import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("multiRoleSession");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async ({ role, email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, message: err.detail || "Login failed" };
      }

      const data = await res.json();
      // data = { access_token, token_type, user: { _id, name, email, role, ... } }

      localStorage.setItem("kiitEatsToken", data.access_token);

      const nextSession = {
        role: data.user.role === "student" ? "user" : data.user.role,
        username: data.user.name,
        email: data.user.email,
        userId: data.user.id,
      };
      setSession(nextSession);
      localStorage.setItem("multiRoleSession", JSON.stringify(nextSession));

      const routeMap = { student: "/user", user: "/user", vendor: "/vendor", admin: "/admin" };
      return { ok: true, redirectTo: routeMap[data.user.role] || "/user" };
    } catch (err) {
      return { ok: false, message: "Network error. Is the backend running?" };
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("multiRoleSession");
    localStorage.removeItem("kiitEatsToken");
  };

  const value = useMemo(
    () => ({ session, login, logout, isAuthenticated: Boolean(session) }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
