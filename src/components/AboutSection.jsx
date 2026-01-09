import styles from "./AboutSection.module.css";
import ballerinaImg from "../assets/about_ballerina.jpg";
import hallImg from "../assets/about_hall.jpg";
import hall2Img from "../assets/about_hall2.jpg";

const AboutSection = () => {
  return (
    <section id="about-us" className={styles.section}>
      {/* Section Heading (missing in your screenshot) */}
      <h2 className={styles.sectionHeading}>About Us</h2>

      <h1 className={styles.bgText}>VicHall.</h1>

      <div className={styles.contentWrapper}>
        {/* This is the small internal label from your design */}
        <h4 className={styles.aboutTitle}>
          About <br /> Us
        </h4>

        <div className={styles.imageHall}>
          <img src={hallImg} alt="Theater Hall" />
        </div>

        <p className={styles.description}>
          At Victoria Hall, we unite people through live theatre, celebrating
          stories, creativity, and shared experiences together
        </p>

        <div className={styles.imageBallerina}>
          <img src={ballerinaImg} alt="Performance Art" />
        </div>

        <div className={styles.imageLuxury}>
          <img src={hall2Img} alt="Luxury Hall" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
