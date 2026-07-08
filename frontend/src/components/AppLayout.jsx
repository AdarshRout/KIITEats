import AppHeader from "./AppHeader/AppHeader";
import AppFooter from "./AppFooter/AppFooter";

/**
 * Shared layout wrapper used by User, Vendor, and Admin modules.
 * Provides a consistent AppHeader + AppFooter around the module content.
 *
 * @param {Object[]} navLinks  - Array of { to, label, icon? } for the AppHeader nav
 * @param {React.ReactNode} actions - Optional action buttons passed to AppHeader (cart, veg toggle, etc.)
 * @param {React.ReactNode} children - Module content
 */
export default function AppLayout({ navLinks = [], tabLinks = [], actions, centerNav, children }) {
  return (
    <div className="app-layout">
      <AppHeader navLinks={navLinks} tabLinks={tabLinks} actions={actions} centerNav={centerNav} />
      <main className="app-layout-main">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
