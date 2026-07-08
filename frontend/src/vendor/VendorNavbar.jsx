import { useRef, useState, useEffect } from "react";
import { SunMedium, MoonStar, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { assets } from "../user/assets/assets";
import "../user/components/Navbar/Navbar.css"; // Reuse identical layout css

export default function VendorNavbar({ active, setActive, theme, toggleTheme, onLogout }) {
  const tabs = ["Home", "Orders", "Menu", "My Profile"];
  const navRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const nav = navRef.current;
    if (!nav) return;
    setCanScrollLeft(nav.scrollLeft > 10);
    setCanScrollRight(nav.scrollLeft + nav.clientWidth + 10 < nav.scrollWidth);
  };

  useEffect(() => {
    updateScrollButtons();
    const nav = navRef.current;
    if (!nav) return;

    nav.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      nav.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  const scroll = (delta) => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="navbar">
      <button
        className={`nav-scroll nav-scroll-left ${canScrollLeft ? "visible" : ""}`}
        onClick={() => scroll(-220)}
        aria-label="Scroll left"
        type="button"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="navbar-inner" ref={navRef} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "0" }}>
        <div className="navbar-brand" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setActive("Home")}>
          <img className="logo" src={assets.logo} alt="KIITEats" />
          <div>
            <h2>KIITEats</h2>
            <p>Vendor App</p>
          </div>
        </div>

        <ul className="navbar-menu" style={{ flex: 1, justifyContent: "flex-end", paddingRight: "10px", border: "none", background: "transparent" }}>
          {tabs.map((tab) => (
            <a
              key={tab}
              href={`#${tab}`}
              className={active === tab ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setActive(tab);
              }}
            >
              {tab}
            </a>
          ))}
        </ul>

        <div className="navbar-right">
          {toggleTheme && (
            <button
              className="icon-pill"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              type="button"
            >
              {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
            </button>
          )}

          {onLogout && (
            <button
              className="logout-btn"
              onClick={onLogout}
              type="button"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      <button
        className={`nav-scroll nav-scroll-right ${canScrollRight ? "visible" : ""}`}
        onClick={() => scroll(220)}
        aria-label="Scroll right"
        type="button"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}