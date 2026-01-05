import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import forgotImg from "./assets/forgot_password.jpg";
import { startPasswordReset } from "./auth/resetApi";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "" });
  const [loading, setLoading] = useState(false);

  // Prevent double-submit (React 18 StrictMode + fast double clicks)
  const inFlightRef = useRef(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // hard guard
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await startPasswordReset(form.email);

      // DEV ONLY: show code if backend returns it
      if (res.devCode) {
        console.log(`[DEV] Reset code for ${form.email}: ${res.devCode}`);
      }

      navigate("/verify", { state: { email: form.email } });
    } catch (err) {
      alert(err.message);
      inFlightRef.current = false;
      setLoading(false);
    }
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
                disabled={loading}
              />
            </div>

            <button className="auth-primary-button" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
