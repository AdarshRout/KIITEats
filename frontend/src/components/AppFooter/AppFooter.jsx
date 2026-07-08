import { assets } from "../../user/assets/assets";
import "./AppFooter.css";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner container">
        {/* ── Brand column ────────────────────── */}
        <div className="app-footer-brand">
          <div className="app-footer-logo-row">
            <img src={assets.logo} alt="KIITEats" className="app-footer-logo" />
            <h2>KIITEats</h2>
          </div>
          <p>
            A campus-focused food ordering platform for KIIT University. Browse
            food courts, order with friends, and enjoy a seamless pickup
            experience.
          </p>
          <div className="app-footer-socials">
            <img src={assets.facebook_icon} alt="Facebook" />
            <img src={assets.twitter_icon} alt="Twitter" />
            <img src={assets.linkedin_icon} alt="LinkedIn" />
          </div>
        </div>

        {/* ── Product column ──────────────────── */}
        <div className="app-footer-col">
          <h3>Product</h3>
          <ul>
            <li>Campus vendors</li>
            <li>Group ordering</li>
            <li>Live tracking</li>
            <li>Order history</li>
          </ul>
        </div>

        {/* ── Contact column ──────────────────── */}
        <div className="app-footer-col">
          <h3>Contact</h3>
          <ul>
            <li>+91 98765 43210</li>
            <li>support@kiiteats.in</li>
            <li>KIIT University</li>
            <li>Bhubaneswar, Odisha</li>
          </ul>
        </div>
      </div>

      <div className="app-footer-bottom container">
        <hr />
        <p>© 2026 KIITEats — Built with ❤ for KIIT students.</p>
      </div>
    </footer>
  );
}
