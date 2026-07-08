import { useContext, useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext.js";
import {
  MoonStar,
  SunMedium,
  ShoppingBasket,
  Leaf,
  PackageCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

// eslint-disable-next-line react/prop-types
const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    getTotalCartItems,
    toggleTheme,
    theme,
    vegOnly,
    toggleVegOnly,
    currentUser,
    logoutUser,
  } = useContext(StoreContext);

  const totalItems = getTotalCartItems();

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

  useEffect(() => {
    if (location.pathname === "/user") {
      setMenu("home");
    } else if (location.pathname.startsWith("/user/vendors")) {
      setMenu("vendors");
    } else if (location.pathname.startsWith("/user/tracking")) {
      setMenu("tracking");
    } else if (location.pathname.startsWith("/user/group-order")) {
      setMenu("group");
    } else if (location.pathname.startsWith("/user/myorder")) {
      setMenu("orders");
    } else if (location.pathname.startsWith("/user/cart")) {
      setMenu("cart");
    }
  }, [location.pathname]);

  const scroll = (delta) => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleLogout = () => {
    logoutUser();
    // Also clear the auth token/session
    localStorage.removeItem("kiitEatsToken");
    localStorage.removeItem("multiRoleSession");
    navigate("/login");
  };

  const handleMenuScroll = (e) => {
    e.preventDefault();
    setMenu("menu");

    if (location.pathname === "/user") {
      const section = document.getElementById("explore-menu");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/user");

      setTimeout(() => {
        const section = document.getElementById("explore-menu");
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
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

      <div className="navbar-inner" ref={navRef}>
        <Link to="/user" className="navbar-brand">
          <img className="logo" src={assets.logo} alt="KIITEats" />
          <div>
            <h2>KIITEats</h2>
            <p>Tap.Eat.Repeat</p>
          </div>
        </Link>

        <ul className="navbar-menu">
          <Link
            to="/user"
            onClick={() => setMenu("home")}
            className={menu === "home" ? "active" : ""}
          >
            Home
          </Link>

          <NavLink
            to="/user/vendors"
            onClick={() => setMenu("vendors")}
            className={menu === "vendors" ? "active" : ""}
          >
            Vendors
          </NavLink>

          <a
            href="#explore-menu"
            onClick={handleMenuScroll}
            className={menu === "menu" ? "active" : ""}
          >
            Menu
          </a>

          <NavLink
            to="/user/tracking"
            onClick={() => setMenu("tracking")}
            className={menu === "tracking" ? "active" : ""}
          >
            Tracking
          </NavLink>

          <NavLink
            to="/user/group-order"
            onClick={() => setMenu("group")}
            className={menu === "group" ? "active" : ""}
          >
            Group order
          </NavLink>

          <button
            className={`toggle-chip ${vegOnly ? "active" : ""}`}
            onClick={toggleVegOnly}
            type="button"
          >
            <Leaf size={16} />
            <span>{vegOnly ? "Veg only" : "Veg mode"}</span>
          </button>
        </ul>

        <div className="navbar-right">
          <button
            className="icon-pill"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === "dark" ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>

          <Link to="/user/myorder" className="icon-pill with-label">
            <PackageCheck size={18} />
            <span>Orders</span>
          </Link>

          <Link
            to="/user/group-order"
            className="icon-pill with-label mobile-hide"
          >
            <Users size={18} />
            <span>Split</span>
          </Link>

          <Link to="/user/cart" className="navbar-search-icon section-card">
            <ShoppingBasket size={20} />
            {totalItems > 0 ? <span className="cart-count">{totalItems}</span> : null}
          </Link>

          {currentUser ? (
            <>
              <button className="signin-btn" type="button">
                Hi, {currentUser.name.split(" ")[0]}
              </button>

              <button
                className="logout-btn"
                onClick={handleLogout}
                type="button"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              className="signin-btn"
              onClick={() => setShowLogin(true)}
              type="button"
            >
              Sign in
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
};

export default Navbar;