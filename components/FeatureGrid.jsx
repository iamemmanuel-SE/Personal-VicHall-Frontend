import { ArrowRight, ArrowUpRight, ToggleRight } from "lucide-react";
import styles from "./FeatureGrid.module.css";
import kidsImg from "../assets/feature_kids.png";
import quoteImg from "../assets/feature_quote.png";
import ticketImg from "../assets/feature_ticket.png";

const FeatureGrid = () => {
  return (
    <section className={styles.grid}>
      {/* Card 1: Young Star Saver */}
      <div className={`${styles.card} ${styles.cardStarSaver}`}>
        <div className={styles.starSaverContent}>
          <h3>Young Star Saver</h3>
          <button className={styles.iconBtn}>
            <ArrowUpRight size={20} color="black" />
          </button>
        </div>
      </div>

      {/* Card 2: Live Golden Moments */}
      <div className={`${styles.card} ${styles.cardGoldenMoments}`}>
        <div className={styles.cardHeader}>
          <h3>
            Live
            <br />
            Golden
            <br />
            Moments
          </h3>
          <div className={styles.toggleWrapper}>
            <div className={styles.toggleCircle}></div>
          </div>
        </div>
        <p className={styles.cardText}>
          Celebrate the beauty of every age with unforgettable experiences. Our
          Over 70 Discount honors your journey with moments that shine. Live
          your golden moment — and make every day a joyful memory.
        </p>
      </div>

      {/* Card 3: Group Bookings */}
      <div className={`${styles.card} ${styles.cardGroupBookings}`}>
        <p className={styles.groupText}>
          Experience the magic of the stage side by side. Share the laughter,
          the drama, and the applause. Book 10 or more seats and enjoy 15% off
          your total
        </p>
        <div className={styles.groupFooter}>
          <h3>Group Bookings</h3>
          <button className={styles.iconBtn}>
            <ArrowUpRight size={20} color="black" />
          </button>
        </div>
      </div>

      {/* Card 4: Loyal Card Members */}
      <div className={`${styles.card} ${styles.cardLoyal}`}>
        <div className={styles.loyalContent}>
          <button className={styles.iconBtn}>
            <ArrowUpRight size={20} color="black" />
          </button>
          <h3>Loyal Card Members</h3>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
