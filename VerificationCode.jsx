import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import verifyImg from "./assets/verification.jpg"; 

export default function VerificationCode() {
  const navigate = useNavigate();

  // Example email displayed like the design
  const email = useMemo(() => ".....Dev@gmail.com", []);


  const [code, setCode] = useState(["", "", "", ""]); 
  const inputsRef = useRef([]);

  
  const [secondsLeft, setSecondsLeft] = useState(30); 

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 0) return 30; 
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => String(s).padStart(2, "0");

  const handleChange = (idx, value) => {
    // Keep it digit-only (still just UI)
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });

    // Auto move to next box for a nice UX (optional)
    if (digit && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && inputsRef.current[idx - 1]) {
      inputsRef.current[idx - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Verify code:", code.join(""));
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-visual">
          <img
            src={verifyImg}
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
            <h1>Verification code</h1>
            <p className="auth-subtitle auth-subtitle--verify">
              We sent a verification code to{" "}
              <span className="auth-verify-email">{email}</span>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-otp-row">
              {code.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  className={`auth-otp-input ${idx === 0 ? "is-active" : ""}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Verification digit ${idx + 1}`}
                />
              ))}
            </div>

            <div className="auth-resend-line">
              <span>Resend Code in</span>{" "}
              <span className="auth-resend-time">00:{formatTime(secondsLeft)}</span>
            </div>

            <button className="auth-primary-button" type="submit">
              Verify Code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
