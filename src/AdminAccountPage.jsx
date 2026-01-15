import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./account.css";
import { clearSession, getStoredUser, isLoggedIn, setSession, getToken } from "./auth/authStore";
import { fetchMe } from "./auth/userApi";
import AppNavbar from "./components/AppNavbar";


function formatDob(d) {
  if (!d) return "";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const fresh = await fetchMe();
        setUser(fresh);

        // keep local user in sync (token stays the same)
        setSession({ token: getToken(), user: fresh });
      } catch (e) {
        // token invalid or expired
        clearSession();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const displayUser = useMemo(() => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return {
      name: `${firstName} ${lastName}`.trim() || "—",
      dob: formatDob(user?.dob) || "—",
      phone: user?.phone || "—",
      email: user?.email || "—",
    };
  }, [user]);

  const onSignOut = () => {
    clearSession();
    navigate("/mainpage");
  };

  return (
    <div className="acct-root">
     <AppNavbar />
      {/* <header className="acct-nav">
        <div className="acct-nav-inner">
          <div className="acct-brand">vicHall.</div>

          <nav className="admin-links">
          <Link to="/admin" className="admin-link">
            Home
          </Link>
          <Link to="/admin/events" className="admin-link">
            Events
          </Link>
          <Link to="/admin/users" className="admin-link">
            Users
          </Link>
        </nav>

          <div className="acct-nav-spacer" />
        </div>
      </header> */}

      <section className="acct-header">
        <div className="acct-header-inner">
          <h1 className="acct-page-title">VicHall Account</h1>

          <button className="acct-signout" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div className="acct-divider" />
      </section>

      <main className="acct-main">
        <section className="acct-info">
          <h2 className="acct-info-title">Personal Information</h2>
          <p className="acct-info-subtitle">
            View your personal information, such as email address, names, phone number,
            <br className="acct-br" />
            and date of birth here
          </p>

          {loading ? (
            <div style={{ marginTop: 40, color: "rgba(0,0,0,0.6)" }}>Loading...</div>
          ) : (
            <div className="acct-grid">
              <InfoCard label="Name" value={displayUser.name} icon={<UserIcon />} />
              <InfoCard label="Date of Birth" value={displayUser.dob} icon={<CalendarIcon />} />
              <InfoCard label="Phone Number" value={displayUser.phone} icon={<PhoneIcon />} />
              <InfoCard label="Email Address" value={displayUser.email} icon={<SendIcon />} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="acct-card">
      <div className="acct-card-text">
        <div className="acct-card-label">{label}</div>
        <div className="acct-card-value">{value}</div>
      </div>
      <div className="acct-card-icon" aria-hidden="true">{icon}</div>
    </div>
  );
}

/* Icons */
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 8.2h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.8 5.5h10.4c1.27 0 2.3 1.03 2.3 2.3v11.4c0 1.27-1.03 2.3-2.3 2.3H6.8c-1.27 0-2.3-1.03-2.3-2.3V7.8c0-1.27 1.03-2.3 2.3-2.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M7.5 4.5h2l1.2 4-1.6 1.2a14 14 0 0 0 5.8 5.8l1.2-1.6 4 1.2v2c0 1.1-.9 2-2 2h-.5C9.7 21.1 2.9 14.3 2.9 6.4V6c0-1.1.9-2 2-2h2.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
//MAIN