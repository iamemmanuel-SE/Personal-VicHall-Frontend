import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import signupImg from "./assets/signup.jpg";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [dobError, setDobError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleDobChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");

    let formatted = "";
    if (digits.length <= 2) formatted = digits;
    else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(
        4,
        8
      )}`;
    }

    setForm((prev) => ({ ...prev, dob: formatted }));
    setDobError("");
    setFormError("");
  };

  const handleDobKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const isValidDob = (dobStr) => {
    const digits = dobStr.replace(/\D/g, "");
    if (digits.length !== 8) return false;

    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);

    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setDobError("");

    // DOB validation
    if (!isValidDob(form.dob)) {
      setDobError("Please enter a valid date of birth (DD / MM / YYYY).");
      return;
    }

    // Password match validation
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    // Password length validation
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      
      const res = await fetch("https://personal-vic-hall-frontend.vercel.apphttps://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data.message || "Registration failed. Please try again.");
        return;
      }

      // Successful registration opens the login page
      navigate("/login");
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
            src={signupImg}
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
            <h1>Create an Account</h1>
            <p className="auth-subtitle">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </p>
          </div>

          {/* General form error slot */}
          {formError && (
            <div className="auth-error-slot" style={{ marginBottom: 12 }}>
              <span className="auth-error">{formError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-row">
              <div className="auth-field">
                <label>First Name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Date of Birth</label>
              <input
                name="dob"
                value={form.dob}
                onChange={handleDobChange}
                onKeyDown={handleDobKeyDown}
                placeholder="DD / MM / YYYY"
                maxLength={14}
                required
              />
              <div className="auth-error-slot">
                {dobError && <span className="auth-error">{dobError}</span>}
              </div>
            </div>

            <div className="auth-field">
              <label>Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+44"
              />
            </div>

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
                  placeholder="Create a password"
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
            </div>

            <div className="auth-field">
              <label>Re-enter Password</label>
              <div className="auth-password-wrapper">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              className="auth-primary-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
//MAIN