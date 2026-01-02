import styles from "./AboutSection.module.css";
import ballerinaImg from "../assets/about_ballerina.jpg";
import hallImg from "../assets/about_hall.jpg";
import hall2Img from "../assets/about_hall2.jpg";

const AboutSection = () => {
  return (
    <section className={styles.section}>
      <h1 className={styles.bgText}>VicHall.</h1>

      {/* Container for absolute positioning relative to section start */}
      <div className={styles.contentWrapper}>
        <h4 className={styles.aboutTitle}>
          About <br /> Us
        </h4>

        {/* Rectangle 8: Theater Hall */}
        <div className={styles.imageHall}>
          <img src={hallImg} alt="Theater Hall" />
        </div>

        {/* Paragraph Description */}
        <p className={styles.description}>
          At Victoria Hall, we unite people through live theatre, celebrating
          stories, creativity, and shared experiences together
        </p>

        {/* Rectangle 10: Ballerina/Performance */}
        <div className={styles.imageBallerina}>
          <img src={ballerinaImg} alt="Performance Art" />
        </div>

        {/* Rectangle 11: Luxury/Hall 2 */}
        <div className={styles.imageLuxury}>
          <img src={hall2Img} alt="Luxury Hall" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
