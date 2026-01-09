import { Link, useNavigate } from "react-router-dom";
import "./adminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="admin-root">
      {/* Top Nav */}
      <header className="admin-nav">
        <div className="admin-brand">vicHall.</div>

        <nav className="admin-links">
          <Link to="/" className="admin-link">
            Home
          </Link>
          <Link to="/events" className="admin-link">
            Events
          </Link>
          <Link to="/users" className="admin-link">
            Users
          </Link>
        </nav>

        <button
          className="admin-account-btn"
          onClick={() => navigate("/account")}
          type="button"
        >
          Account
        </button>
      </header>

      {/* Main Content */}
      <main className="admin-content">
        <section className="admin-shell">
          <h1 className="admin-title">Admin Panel</h1>
          <p className="admin-subtitle">
            Manage bookings, create and remove reservations, delete users, and
            reserve seats — all from one central dashboard.
          </p>

          <div className="admin-inner">
            <div className="admin-actions">
              <button
                className="admin-action-btn"
                type="button"
                onClick={() => navigate("/admin/events")}
              >
                Events
              </button>

              <button
                className="admin-action-btn"
                type="button"
                onClick={() => navigate("/admin/users")}
              >
                Users
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
