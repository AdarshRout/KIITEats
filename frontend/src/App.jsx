import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Login from "./auth/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import UserApp from "./user/UserApp";
import VendorApp from "./vendor/VendorApp";
import AdminApp from "./admin/AdminApp";

function HomeRedirect() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={`/${session.role}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRole="user" />}>
        <Route path="/user/*" element={<UserApp />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="vendor" />}>
        <Route path="/vendor" element={<VendorApp />} />
      </Route>

      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin" element={<AdminApp />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
