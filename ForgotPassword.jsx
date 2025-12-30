import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import forgotImg from "./images/forgot_password.jpg"; 

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Forgot password:", form);
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-visual">
          <img
            src={forgotImg}
            alt="Victoria Hall artwork"
            className="auth-visual-image"
          />
        </div>

        <div className="auth-panel">
          <button
            className="auth-back-button"
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="auth-header">
            <h1>Forgot password</h1>
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

            <button className="auth-primary-button" type="submit">
              Send Verification Code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
