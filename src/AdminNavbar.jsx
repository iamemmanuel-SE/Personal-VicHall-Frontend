import { Link, NavLink, useNavigate } from "react-router-dom";
import "./adminNavbar.css";

export default function AdminNavbar() {
  const navigate = useNavigate();

  return (
    <header className="adminNav">
      <div className="adminNav__brand">vicHall.</div>

      <nav className="adminNav__links">
        <NavLink to="/admin" className={({ isActive }) => (isActive ? "isActive" : "")}>
          Home
        </NavLink>
        <NavLink
          to="/admin/events"
          className={({ isActive }) => (isActive ? "isActive" : "")}
        >
          Events
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) => (isActive ? "isActive" : "")}
        >
          Users
        </NavLink>
      </nav>

      <button className="adminNav__account" type="button" onClick={() => navigate("/account")}>
        Account
      </button>
    </header>
  );
}
