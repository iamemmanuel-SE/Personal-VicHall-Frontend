import { useState } from "react";
import "./auth.css";
import resetImg from "./assets/reset_password.jpg"; 
import { useLocation, useNavigate } from "react-router-dom";
import { canResetPassword, resetPassword } from "./auth/fakeResetApi"; 
import { useEffect } from "react";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const location = useLocation();
  const email = location.state?.email || "";
  const resetToken = location.state?.resetToken || "";

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  if (form.newPassword !== form.confirmPassword) {
    alert("Passwords do not match.");
    return;
  }


  if (form.newPassword.length < 8) {
    alert("Password must be at least 8 characters.");
    return;
  }

  const res = resetPassword(email, resetToken, form.newPassword);
  if (!res.ok) {
    alert(res.error);
    navigate("/forgot-password");
    return;
  }

  alert("Password reset successful (simulated).");
  navigate("/login");
};

  useEffect(() => {
    const gate = canResetPassword(email, resetToken);
    if (!gate.ok) {
      alert(gate.error);
      navigate("/forgot-password");
    }
}, [email, resetToken, navigate]);
  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-visual">
          <img
            src={resetImg}
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
            <h1>Reset Password</h1>
            <p className="auth-subtitle">
              Your new passwords must be different from your previous passwords.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>New Password</label>
              <div className="auth-password-wrapper">
                <input
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowNewPassword((s) => !s)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="auth-password-wrapper">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
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

            <button className="auth-primary-button" type="submit">
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
