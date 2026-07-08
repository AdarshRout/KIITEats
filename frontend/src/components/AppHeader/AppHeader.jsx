import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useContext, useState } from "react";
import { assets } from "../../user/assets/assets";
import { StoreContext } from "../../user/Context/StoreContext";
import "./AppHeader.css";

/**
 * Shared AppHeader.
 * @param {Object[]} navLinks - Array of { to, label, icon? }
 * @param {Object[]} tabLinks - Array of { id, label, icon?, onClick, active? } for tab-based nav
 * @param {React.ReactNode} actions - Optional slot for module-specific action buttons (cart, veg toggle, etc.)
 */
export default function AppHeader({ navLinks = [], tabLinks = [], actions, centerNav }) {
  const { session, logout } = useAuth();
  const { logoutUser, theme, toggleTheme } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    logout();
    navigate("/login", { replace: true });
  };

  const roleBadge = session?.role?.toUpperCase();

  // Check if a nav link is active based on current path
  const isActive = (to) => {
    if (to === `/${session?.role}` || to === "/user") {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  return (
    <header className="app-header">
      <div className="app-header-inner container">
        {/* ── Brand ──────────────────────────── */}
        <Link to={`/${session?.role || ""}`} className="app-header-brand">
          <img src={assets.logo} alt="KIITEats" className="app-header-logo" />
          <div className="app-header-brand-text">
            <h1 className="app-header-title">KIITEats</h1>
            <span className="app-header-tagline">Tap · Eat · Repeat</span>
          </div>
        </Link>

        {/* ── Desktop Navigation ─────────────── */}
        <nav className={`app-header-nav${centerNav ? ' has-center-nav' : ''}`}>
          {centerNav ? (
            centerNav
          ) : (
            <>
              {roleBadge && (
                <span className="app-header-badge">{roleBadge}</span>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`app-header-link ${isActive(link.to) ? "active" : ""}`}
                >
                  {link.icon && <span className="app-header-link-icon">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              {tabLinks.map((tab) => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  className={`app-header-link ${tab.active ? "active" : ""}`}
                >
                  {tab.icon && <span className="app-header-link-icon">{tab.icon}</span>}
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* ── Right side ─────────────────────── */}
        <div className="app-header-right">
          {/* Module-specific actions (cart, veg toggle, etc.) */}
          {actions && (
            <div className="app-header-actions">
              {actions}
            </div>
          )}

          {/* Theme toggle */}
          <button
            className="app-header-theme-toggle"
            onClick={toggleTheme}
            type="button"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {session && (
            <span className="app-header-greeting">
              Hi, <strong>{session.username?.split(" ")[0]}</strong>
            </span>
          )}
          <button className="app-header-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* ── Mobile toggle ────────────────── */}
          <button
            className="app-header-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────── */}
      {mobileOpen && (
        <div className="app-header-mobile-menu fade-in">
          {centerNav ? (
            <div className="app-header-mobile-centernav">{centerNav}</div>
          ) : (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`app-header-mobile-link ${isActive(link.to) ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.icon && <span className="app-header-link-icon">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
              {tabLinks.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    tab.onClick();
                    setMobileOpen(false);
                  }}
                  className={`app-header-mobile-link ${tab.active ? "active" : ""}`}
                >
                  {tab.icon && <span className="app-header-link-icon">{tab.icon}</span>}
                  {tab.label}
                </button>
              ))}
            </>
          )}
          {actions && (
            <div className="app-header-mobile-actions">
              {actions}
            </div>
          )}
          <button className="app-header-mobile-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
