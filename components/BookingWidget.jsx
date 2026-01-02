import { Calendar, MapPin, ChevronDown, User } from "lucide-react";
import styles from "./BookingWidget.module.css";

const BookingWidget = () => {
  return (
    <div className={styles.widget}>
      {/* Title with Icon */}
      <div className={styles.titleWrapper}>
        <MapPin size={28} />
        <h3 className={styles.title}>Find Events</h3>
      </div>

      {/* Location Group */}
      <div className={styles.locationGroup}>
        <div className={styles.inputLocation}>
          <MapPin size={20} className={styles.iconLeft} />
          <input
            type="text"
            defaultValue="Stoke on Trent"
            className={styles.inputText}
          />
        </div>
      </div>

      {/* Date Group */}
      <div className={styles.dateSection}>
        <div className={styles.dateGroup}>
          <label>Start - Date</label>
          <div className={styles.inputDate}>
            <Calendar size={20} className={styles.iconLeft} />
            <input
              type="text"
              defaultValue="Stoke on Trent"
              className={styles.inputText}
            />
          </div>
        </div>
        <div className={styles.dateGroup}>
          <label>End - Date</label>
          <div className={styles.inputDate}>
            <Calendar size={20} className={styles.iconLeft} />
            <input
              type="text"
              defaultValue="Stoke on Trent"
              className={styles.inputText}
            />
          </div>
        </div>
      </div>

      {/* Artist Group */}
      <div className={styles.artistGroup}>
        <label className={styles.labelArtist}>Artist</label>
        <div className={styles.inputArtist}>
          <div className={styles.userIconWrapper}>
            <User size={16} color="white" />
          </div>
          <span className={styles.artistName}>Ejiro Jacob</span>
          <ChevronDown size={20} className={styles.chevronIcon} />
        </div>
      </div>

      <button className={styles.searchBtn}>Search Event</button>
    </div>
  );
};

export default BookingWidget;
