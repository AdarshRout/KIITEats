import { useContext, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { StoreContext } from "../user/Context/StoreContext";
import api from "../vendor/apiClient";
import { food_list } from "../user/assets/assets";
import "./Login.css";

const roleContent = {
  user: {
    title: "KIIT Eats: Skip the Queue 🚀",
    text: "Order directly from class, bypass the billing lines, and pick up your food whenever you're ready. Group orders fully supported!",
    badge: "Student Portal",
  },
  vendor: {
    title: "Vendor Hub 👨‍🍳",
    text: "Review incoming orders in real-time and manage digital pickups to eliminate food court congestion.",
    badge: "Vendor Portal",
  },
  admin: {
    title: "KIIT Administration ⚙️",
    text: "Oversee the queue-less KIIT food ecosystem, monitor quality, and handle vendor support.",
    badge: "Admin Portal",
  },
};

const CREDENTIALS = {
  user: { email: "student@kiit.ac.in", password: "pass123" },
  vendor: { email: "vendor@kiitvendor.ac.in", password: "pass123" },
  admin: { email: "admin@kiitadmin.ac.in", password: "pass123" }
};

export default function Login() {
  const [role, setRole] = useState("user");
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("student@kiit.ac.in");
  const [password, setPassword] = useState("pass123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { loginUser } = useContext(StoreContext);
  const navigate = useNavigate();

  const current = roleContent[role];

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    if (!isSignup) {
      setEmail(CREDENTIALS[selectedRole].email);
      setPassword(CREDENTIALS[selectedRole].password);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (isSignup) {
      if (!name.trim()) {
        setError("Name is required for signup.");
        setLoading(false);
        return;
      }
      try {
        await api.post("/auth/signup", {
          name,
          email,
          password,
          role: role === "user" ? "student" : role,
        });
      } catch (err) {
        setError(err.message || "Signup failed.");
        setLoading(false);
        return;
      }
    }

    const result = await login({ role, email, password });

    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    loginUser({
      email,
      role: role === 'user' ? 'student' : role,
      name: name || email.split("@")[0],
    });

    setError("");
    setLoading(false);
    navigate(result.redirectTo, { replace: true });
  };

  return (
    <div className="theme-root">
      <div className="app login-shell">
        <div className="login-card section-card">
          <section className="login-showcase" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${food_list[22].food_image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 className="login-title">{current.title}</h1>
              <p className="login-subtitle">{current.text}</p>
            </div>

            <div className="login-visuals" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', marginBottom: 'auto', padding: '40px 0' }}>
              <img src="https://upload.wikimedia.org/wikipedia/en/e/ef/KIIT_logo.svg" alt="KIIT Logo" style={{ width: '240px', height: 'auto', display: 'block', filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.7))' }} />
            </div>

            <div className="login-points" style={{ position: 'relative', zIndex: 1 }}>
              <div className="login-point">
                Exclusive access for KIIT Students, Faculties, and Staff.
              </div>
              <div className="login-point">
                Skip long queues, place group orders, and pay instantly within the app.
              </div>
              <div className="login-point">
                Pick up your hot order at your own convenience without the wait!
              </div>
            </div>
          </section>

          <section className="login-form-wrap">
            <form className="login-form section-card" onSubmit={handleSubmit}>
              <h2>{isSignup ? "Sign Up" : "Login"}</h2>
              <p>Choose a role and {isSignup ? "create a new account" : "sign in with credentials"} below.</p>

              <div className="role-tabs">
                {["user", "vendor", "admin"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`role-tab ${role === item ? "active" : ""}`}
                    onClick={() => handleRoleChange(item)}
                  >
                    {item === "user" ? "Student" : item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>

              <div className="login-fields">
                {isSignup && (
                  <div className="login-field">
                    <label>Name</label>
                    <input
                      className="input-surface"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                )}

                <div className="login-field">
                  <label>Email</label>
                  <input
                    className="input-surface"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="login-field">
                  <label>Password</label>
                  <div className="password-container">
                    <input
                      className="input-surface"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>
              </div>

              {role !== 'user' && (
                <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#b45309', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  {role === 'vendor'
                    ? '⚠ Vendor accounts require an @kiitvendor.ac.in email'
                    : '⚠ Admin accounts require an @kiitadmin.ac.in email'}
                </div>
              )}

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (isSignup ? "Signing up…" : "Logging in…") : (isSignup ? "Sign Up" : "Login")}
              </button>

              <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--muted)" }}>
                  {isSignup ? "Already have an account? " : "Don't have an account? "}
                </span>
                <span
                  style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError("");
                  }}
                >
                  {isSignup ? "Login instead" : "Sign up here"}
                </span>
              </div>

              {error ? <div className="login-error">{error}</div> : null}

              <div className="login-demo">
                <div>
                  <strong>Student:</strong>{" "}
                  <code>student@kiit.ac.in / pass123</code>
                </div>
                <div>
                  <strong>Vendor:</strong>{" "}
                  <code>vendor@kiitvendor.ac.in / pass123</code>
                </div>
                <div>
                  <strong>Admin:</strong>{" "}
                  <code>admin@kiitadmin.ac.in / pass123</code>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}