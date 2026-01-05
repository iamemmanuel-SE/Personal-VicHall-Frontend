import { Link } from "react-router-dom";
import "./account.css";

export default function AccountPage() {
  // Front-end only: static placeholders (swap for real user data later)
  const user = {
    name: "Rostislav Valev",
    dob: "07/11/2001",
    phone: "+44 7356249681",
    email: "rostislavvalev@gmail.com",
  };

  return (
    <div className="acct-root">
      {/* Top Nav */}
      <header className="acct-nav">
        <div className="acct-nav-inner">
          <div className="acct-brand">vicHall.</div>

          <nav className="acct-links" aria-label="Primary navigation">
            <Link to="/mainpage" className="acct-link">Home</Link>
            <Link to="/events" className="acct-link">Events</Link>
            <Link to="/about" className="acct-link">About</Link>
            <Link to="/bookings" className="acct-link">Bookings</Link>
          </nav>

          {/* right spacer to keep nav centered */}
          <div className="acct-nav-spacer" />
        </div>
      </header>

      {/* Page Header */}
      <section className="acct-header">
        <div className="acct-header-inner">
          <h1 className="acct-page-title">VicHall Account</h1>

          <button className="acct-signout" type="button">
            Sign out
          </button>
        </div>

        <div className="acct-divider" />
      </section>

      {/* Content */}
      <main className="acct-main">
        <section className="acct-info">
          <h2 className="acct-info-title">Personal Information</h2>
          <p className="acct-info-subtitle">
            View your personal information, such as email address, names, phone number,
            <br className="acct-br" />
            and date of birth here
          </p>

          <div className="acct-grid">
            <InfoCard label="Name" value={user.name} icon={<UserIcon />} />
            <InfoCard label="Date of Birth" value={user.dob} icon={<CalendarIcon />} />
            <InfoCard label="Phone Number" value={user.phone} icon={<PhoneIcon />} />
            <InfoCard label="Email Address" value={user.email} icon={<SendIcon />} />
          </div>
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
      <div className="acct-card-icon" aria-hidden="true">
        {icon}
      </div>
    </div>
  );
}

/* --- Simple inline icons (no dependencies) --- */
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v3M17 3v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 8.2h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.8 5.5h10.4c1.27 0 2.3 1.03 2.3 2.3v11.4c0 1.27-1.03 2.3-2.3 2.3H6.8c-1.27 0-2.3-1.03-2.3-2.3V7.8c0-1.27 1.03-2.3 2.3-2.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.5 4.5h2l1.2 4-1.6 1.2a14 14 0 0 0 5.8 5.8l1.2-1.6 4 1.2v2c0 1.1-.9 2-2 2h-.5C9.7 21.1 2.9 14.3 2.9 6.4V6c0-1.1.9-2 2-2h2.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 2 11 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M22 2 15 22l-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
