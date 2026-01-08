import { Search } from "lucide-react";
import styles from "./Navbar.module.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearSession, isLoggedIn } from "../auth/authStore";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();

  const handleSignOut = () => {
    clearSession();
    navigate("/mainpage");
  };

  const handleAboutScroll = () => {
    // If already on landing page → scroll directly
    if (location.pathname === "/mainpage") {
      const section = document.getElementById("about-us");
      section?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate first, then scroll after render
      navigate("/mainpage", { state: { scrollToAbout: true } });
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div
          className={styles.logo}
          onClick={() => navigate("/mainpage")}
          style={{ cursor: "pointer" }}
        >
          vicHall.
        </div>

        <ul className={styles.navLinks}>
          <li onClick={() => navigate("/mainpage")}>Home</li>

          <li>
            <Link to="/events">Events</Link>
          </li>

          <li onClick={handleAboutScroll} style={{ cursor: "pointer" }}>
            About
          </li>

          <li>
            <Link to="/bookings">Bookings</Link>
          </li>
        </ul>

        <div className={styles.navActions}>
          {!loggedIn ? (
            <>
              <Link to="/login">
                <button className={styles.loginBtn}>
                  <span className={styles.loginInner}>Log in</span>
                </button>
              </Link>

              <Link to="/signup">
                <button className={styles.registerBtn}>Register</button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/account">
                <button className={styles.loginBtn}>
                  <span className={styles.loginInner}>Account</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
