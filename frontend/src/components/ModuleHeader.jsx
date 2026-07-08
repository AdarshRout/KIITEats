import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { StoreContext } from "../user/Context/StoreContext";

export default function ModuleHeader({ title, subtitle, links = [] }) {
  const { session, logout } = useAuth();
  const { logoutUser } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="module-header section-card">
      <div>
        <div className="module-badge">{session?.role?.toUpperCase()} PANEL</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="module-header-actions">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="module-link">{link.label}</Link>
        ))}
        <button
          className="module-link module-link-primary"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
