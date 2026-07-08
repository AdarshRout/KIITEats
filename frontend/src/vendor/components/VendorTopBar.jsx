import { Link } from "react-router-dom";

export default function VendorTopBar({ theme, toggleTheme }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "12px",
        marginBottom: "18px",
        flexWrap: "wrap",
      }}
    >
      <Link
        to="/user"
        className="secondary-btn"
        style={{ textDecoration: "none" }}
      >
        User App
      </Link>

      <button className="secondary-btn" onClick={toggleTheme} type="button">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>
    </div>
  );
}