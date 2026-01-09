import BookingWidget from "./BookingWidget";
import styles from "./Hero.module.css";
import heroBg from "../assets/hero_bg.png";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div
        className={styles.heroBackground}
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className={`container ${styles.heroContainer}`}>
          <h1 className={styles.headline}>
            Where Elegance Meets
            <br />
            Performance and Every Scene
            <br />
            Captures the Soul of True
            <br />
            Artistry.
          </h1>

          <div className={styles.widgetWrapper}>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
