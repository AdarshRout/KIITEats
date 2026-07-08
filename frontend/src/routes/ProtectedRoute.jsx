import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ allowedRole }) {
  const { session, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && session?.role !== allowedRole) {
    return <Navigate to={`/${session.role}`} replace />;
  }
  return <Outlet />;
}
