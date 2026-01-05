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
          <li>
            <a href="#home">Home</a>
          </li>
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

      <div className={styles.searchBar}>
        <div className={styles.searchBg}></div>
        <div className={styles.searchIconWrapper}>
          <Search size={16} className={styles.searchIcon} />
        </div>
        <span className={styles.searchText}>Search Event</span>
      </div>
    </nav>
  );
};

export default Navbar;
