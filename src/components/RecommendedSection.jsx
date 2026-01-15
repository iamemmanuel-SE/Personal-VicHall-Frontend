import { useEffect, useMemo, useState } from "react";
import styles from "./RecommendedSection.module.css";
import { ArrowRight } from "lucide-react";
import { resolveEventImage } from "../utils/eventImages";

// const API_BASE = "http://localhost:5001";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchAllEvents() {
  const res = await fetch(`/api/events`, { credentials: "include" });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch events");
  return Array.isArray(data) ? data : [];
}

const RecommendedSection = () => {
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr("");
        const all = await fetchAllEvents();
        if (!alive) return;
        setEvents(all);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load recommendations.");
        setEvents([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);


  const picks = useMemo(() => {
    const list = events.filter((e) => e?.title && e?.description);
    return shuffle(list).slice(0, 4);
  }, [events]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Recommended For You</h2>
        <p className={styles.subtitle}>
          I hope you find these recommendations enjoyable!
        </p>
      </div>

      {err ? (
        <p style={{ opacity: 0.7 }}>{err}</p>
      ) : (
        <div className={styles.grid}>
          {picks.map((event) => {
            const img = resolveEventImage(event);

            return (
              <div key={event._id} className={styles.card}>
                
                {img ? (
                  <img src={img} alt={event.title} className={styles.cardBg} />
                ) : (
                  <div className={styles.cardBg} style={{ background: "#111" }} />
                )}

                <div className={styles.cardContent}>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>

                <button className={styles.bookBtn} type="button">
                  Booking Ticket <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecommendedSection;
