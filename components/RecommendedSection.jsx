import styles from "./RecommendedSection.module.css";
import posterCranium from "../assets/poster_cranium.png";
import posterRuss from "../assets/poster_russ.png";
import posterSot from "../assets/poster_sot.png";
import posterXmas from "../assets/poster_xmas.png";
import { ChevronDown, ArrowRight } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Cranium Curiosities",
    desc: "Ross Noble brings Cranium of Curiosities to Victoria Hall, Stoke-on-Trent, November 6, 2025",
    img: posterCranium,
  },
  {
    id: 2,
    title: "Ross Noble",
    desc: "Stand-up from Ross Noble, known for his freewheeling, improvisational style",
    img: posterRuss,
  },
  {
    id: 3,
    title: "SOT Classics",
    desc: "A classical orchestral concert featuring favorite works from the Classic FM Hall of Fame",
    img: posterSot,
  },
  {
    id: 4,
    title: "Step Into Christmas",
    desc: "A festive show celebrating holiday songs and spirit — ideal for getting into the Christmas mood",
    img: posterXmas,
  },
];

const RecommendedSection = () => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Recommended For You</h2>
        <p className={styles.subtitle}>
          I hope you find these recommendations enjoyable!
        </p>
      </div>

      <div className={styles.grid}>
        {events.map((event) => (
          <div key={event.id} className={styles.card}>
            <img src={event.img} alt={event.title} className={styles.cardBg} />
            <div className={styles.cardContent}>
              <h3>{event.title}</h3>
              <p>{event.desc}</p>
            </div>
            <button className={styles.bookBtn}>
              Booking Ticket <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedSection;
