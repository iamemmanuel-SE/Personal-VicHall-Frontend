import { useEffect, useRef, useState } from "react";
import "./auth.css";
import verifyImg from "./assets/verification.jpg";
import { useLocation, useNavigate } from "react-router-dom";
import { resendResetCode, verifyResetCode } from "./auth/resetApi";

export default function VerificationCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", ""]);
  const inputsRef = useRef([]);

  const [secondsLeft, setSecondsLeft] = useState(30);

  // timer refs
  const timerRef = useRef(null);

  // ✅ NEW: only resend after we've ticked down at least once (prevents initial resend)
  const hasTickedRef = useRef(false);

  // ✅ Prevent multiple resends during the same "30" state
  const hasResentThisCycleRef = useRef(false);

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  // Single setTimeout loop instead of setInterval
  useEffect(() => {
    if (!email) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [secondsLeft, email]);

  // Mark that we have ticked at least once (i.e., we left 30 and started counting)
  useEffect(() => {
    if (secondsLeft < 30) {
      hasTickedRef.current = true;
    }

    // reset cycle lock when we are not at 30
    if (secondsLeft !== 30) {
      hasResentThisCycleRef.current = false;
    }
  }, [secondsLeft]);

  // ✅ Auto-resend ONLY when timer resets to 30 AFTER at least one tick happened
  useEffect(() => {
    if (!email) return;

    // If we haven't ticked down yet, this is the initial 30 on page load → DO NOTHING
    if (!hasTickedRef.current) return;

    // When it resets to 30 (after reaching 1), resend exactly once
    if (secondsLeft === 30 && !hasResentThisCycleRef.current) {
      hasResentThisCycleRef.current = true;

      resendResetCode(email)
        .then((res) => {
          if (res.devCode) {
            console.log(`[DEV] Resent code for ${email}: ${res.devCode}`);
          }
        })
        .catch((err) => console.log(err.message));
    }
  }, [secondsLeft, email]);

  const formatTime = (s) => String(s).padStart(2, "0");

  const handleChange = (idx, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });

    if (digit && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !code[idx] && inputsRef.current[idx - 1]) {
      inputsRef.current[idx - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const codeStr = code.join("");
    if (codeStr.length !== 4) return;

    try {
      const res = await verifyResetCode(email, codeStr);
      navigate("/reset-password", { state: { email, resetToken: res.resetToken } });
    } catch (err) {
      alert(err.message);
    }
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
//MAIN