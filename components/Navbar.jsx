import { Search } from "lucide-react";
import styles from "./Navbar.module.css";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, isLoggedIn } from "../auth/authStore";

const Navbar = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleSignOut = () => {
    clearSession();
    navigate("/mainpage");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>vicHall.</div>

        <ul className={styles.navLinks}>
          <Link to="/mainpage">
            <li>Home</li>
          </Link>
          <li>
            <Link to="/events">Events</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
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
