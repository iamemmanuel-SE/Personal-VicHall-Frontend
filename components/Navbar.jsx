import { Search } from "lucide-react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>vicHall.</div>

        <ul className={styles.navLinks}>
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#events">Events</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#bookings">Bookings</a>
          </li>
        </ul>

        <div className={styles.navActions}>
          <button className={styles.loginBtn}>
            <span className={styles.loginInner}>Log in</span>
          </button>
          <button className={styles.registerBtn}>Register</button>
        </div>
      </div>
      {/* Search Bar - Nested in Navbar as requested */}
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
