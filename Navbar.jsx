import "./navbar.css";

const Navbar = () => {
  return (
    <header className="vh-topbar">
      <div className="vh-logo">vicHall.</div>

      <nav className="vh-nav">
        <a href="#" className="active">Home</a>
        <a href="#">Events</a>
        <a href="#">About</a>
        <a href="#">Bookings</a>
      </nav>

      <div className="vh-actions">
        <div className="vh-lang">
          <span>EN</span>
        </div>
        <button className="vh-btn vh-btn-ghost">Log in</button>
        <button className="vh-btn vh-btn-solid">Register</button>
      </div>
    </header>
  );
};

export default Navbar;
