import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import loginImg from "./images/login.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login form:", form);
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
                <button type="button" className="auth-link auth-forgot">
                  Forgot password
                </button>
              </div>
            </div>

            <button className="auth-primary-button" type="submit">
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
