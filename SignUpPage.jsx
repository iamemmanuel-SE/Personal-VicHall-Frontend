import { useState } from "react";
import "./auth.css";
import signupImg from "./images/signup.jpg";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dobError, setDobError] = useState("");

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
  };

  

  // Format as DD / MM / YYYY while typing
  const handleDobChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, ""); // only keep digits

    let formatted = "";
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(
        2,
        4
      )} / ${digits.slice(4, 8)}`;
    }

    setForm((prev) => ({ ...prev, dob: formatted }));
    setDobError("");
  };

  // Block keys other than digits, backspace, delete, arrows, tab
  const handleDobKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const isValidDob = (dobStr) => {
    const digits = dobStr.replace(/\D/g, "");
    if (digits.length !== 8) return false;

    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return false;
    }

    return true;
  };

  

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidDob(form.dob)) {
      setDobError("Please enter a valid date of birth (DD / MM / YYYY).");
      return;
    }

    console.log("Sign up form:", form);
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        {/* Image panel */}
        <div className="auth-visual">
          <img
            src={signupImg}
            alt="Victoria Hall artwork"
            className="auth-visual-image"
          />
        </div>

        {/* Right form panel */}
        <div className="auth-panel">
          <button className="auth-back-button" type="button">
            ←
          </button>

          <div className="auth-header">
            <h1>Create an Account</h1>
            <p className="auth-subtitle">
              Already have an account?{" "}
              <button type="button" className="auth-link">
                Log in
              </button>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                name="dob"
                type="text"
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
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+44"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-wrapper">
                <input
                  id="password"
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

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">Re-enter Password</label>
              <div className="auth-password-wrapper">
                <input
                  id="confirmPassword"
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

            <button type="submit" className="auth-primary-button">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
