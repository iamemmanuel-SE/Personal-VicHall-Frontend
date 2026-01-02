import { ArrowRight } from "lucide-react";
import styles from "./EventSection.module.css";
import eventBg from "../assets/event_circus.jpg";

const EventSection = () => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Best Event For 2025</h2>
        <p>
          At Victoria Hall, we unite people through live theatre, celebrating
          stories, creativity.
        </p>
      </div>

      <div
        className={styles.banner}
        style={{ backgroundImage: `url(${eventBg})` }}
      >
        <div className={styles.content}>
          <h3>
            Cranium
            <br />
            Curiosities
          </h3>
          <p>
            Experiencing The Famous Spectacle
            <br />
            Live In The Heart Of London.
          </p>
          <button className={styles.shopBtn}>
            Shop Now <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventSection;
