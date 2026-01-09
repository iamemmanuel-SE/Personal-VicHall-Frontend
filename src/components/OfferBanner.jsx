import { ArrowRight } from "lucide-react";
import styles from "./OfferBanner.module.css";

const OfferBanner = () => {
  return (
    <section className={styles.banner}>
      <div className={styles.promoTag}>
        Big <br />
        Promo
      </div>
      <div className={styles.left}>
        <h2>
          Limited Time Offer
          <br />
          Book Now and Save
          <br />
          Big!
        </h2>
      </div>
      <div className={styles.right}>
        <p>
          Big Promo Alert! Are you ready for the ultimate adventure at an
          unbeatable price? VicHall is thrilled to announce out latest Big
          Promo, offering you incredible deals on your dream vactions!
        </p>
        <button className={styles.buyBtn}>Book Now</button>
      </div>
    </section>
  );
};

export default OfferBanner;
