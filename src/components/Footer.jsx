import styles from "./Footer.module.css";
import { ArrowUpRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.logoSection}>
        <h1 className={styles.bigLogo}>VicHall.</h1>
        <button className={styles.bookingBtn}>
          <ArrowUpRight size={16} className={styles.arrow} />
          Booking now
        </button>
      </div>

      <div className={styles.container}>
        {/* Column 1: VicHall Info */}
        <div className={styles.column}>
          <h4>VicHall</h4>
          <p className={styles.description}>
            At Victoria Hall, we believe every event is a chance to celebrate
            creativity, culture, and connection.
          </p>
        </div>

        {/* Column 2: Tools */}
        <div className={styles.column}>
          <h4>Tools</h4>
          <ul>
            <li>
              <a href="#">Gift Vouchers</a>
            </li>
            <li>
              <a href="#">Group Bookings</a>
            </li>
            <li>
              <a href="#">Venue Hire</a>
            </li>
            <li>
              <a href="#">Accessibility</a>
            </li>
          </ul>
        </div>

        {/* Column 3: Explore */}
        <div className={styles.column}>
          <h4>Explore</h4>
          <ul>
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Events</a>
            </li>
            <li>
              <a href="#">Bookings</a>
            </li>
            <li>
              <a href="#">About Us</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Visit Us */}
        <div className={styles.column}>
          <h4>Visit Us</h4>
          <ul>
            <li>Victoria Hall</li>
            <li>Birch Terrace, Stoke on Trent</li>
            <li>ST1 3BP</li>
          </ul>
        </div>

        {/* Column 5: Contact */}
        <div className={styles.column}>
          <h4>Contact</h4>
          <ul>
            <li>hello@victoriahall.co.uk</li>
            <li>+44 (0)1782 213 800</li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>© Victoria Hall 2025</span>
        <div className={styles.bottomLinks}>
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
