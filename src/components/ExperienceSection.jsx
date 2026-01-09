import { Calendar } from "lucide-react";
import styles from "./ExperienceSection.module.css";
import bgImage from "../assets/expereince.png";

const ExperienceSection = () => {
  return (
    <section
      className={styles.section}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className={styles.content}>
        <h2>
          <span className={styles.line1}>
            Ready for your next unforgettable
          </span>
          <br />
          <span className={styles.line2}>
            experience? Book your tickets with Victoria
          </span>
          <br />
          <span className={styles.line3}>
            Hall today and be part of the show!
          </span>
        </h2>
        <button className={styles.bookingBtn}>
          <div className={styles.iconCircle}>
            <Calendar size={16} color="black" />
          </div>
          <span>Booking Now</span>
        </button>
      </div>
    </section>
  );
};

export default ExperienceSection;
