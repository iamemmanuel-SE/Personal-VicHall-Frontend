import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import loginImg from "./assets/login.jpg";
import { setSession } from "./auth/authStore";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data.message || "Login failed. Please try again.");
        return;
      }

      setSession({ token: data.token, user: data.user });

      // Redirect admins to admin dashboard
      if (data.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/mainpage");
      }
    } catch (err) {
      setFormError("Could not connect to the server. Is your backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-visual">
          <img
            src={loginImg}
            alt="Victoria Hall artwork"
            className="auth-visual-image"
          />
        </div>

        <div className="auth-panel">
          <button
            className="auth-back-button"
            type="button"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          <div className="auth-header">
            <h1>Log in</h1>
            <p className="auth-subtitle">
              Don’t have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => navigate("/signup")}
              >
                Create an Account
              </button>
            </p>
          </div>

          {formError && (
            <div className="auth-error-slot" style={{ marginBottom: 12 }}>
              <span className="auth-error">{formError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-password-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="auth-forgot-wrapper">
                <button
                  type="button"
                  className="auth-link auth-forgot"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password
                </button>
              </div>
            </div>

            <button
              className="auth-primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
//MAIN