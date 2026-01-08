import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./EventSection.module.css";
import { resolveEventImage } from "../utils/eventImages";

const API_BASE = "http://localhost:5001";

function normalizeTitle(s = "") {
  return s
    .toLowerCase()
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
}

async function fetchAllEvents() {
  const res = await fetch(`${API_BASE}/api/events`, { credentials: "include" });
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch events");
  return Array.isArray(data) ? data : [];
}

const EventSection = () => {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const events = await fetchAllEvents();

        const targetTitle = normalizeTitle(
          "The Royal Philharmonic Orchestra – Spring Gala"
        );

        const found =
          events.find((e) => normalizeTitle(e.title) === targetTitle) ||
          events.find((e) =>
            normalizeTitle(e.title).includes("royal philharmonic orchestra")
          ) ||
          null;

        if (!alive) return;
        setFeatured(found);
      } catch {
        if (!alive) return;
        setFeatured(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const featuredImg = useMemo(() => resolveEventImage(featured), [featured]);

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
        style={{
          backgroundImage: featuredImg ? `url(${featuredImg})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={styles.content}>
          <h3>
            {featured?.title || "The Royal Philharmonic Orchestra – Spring Gala"}
          </h3>

          <p>
            {featured?.description ||
              "Experience an unforgettable evening of classical music performed by a world-renowned orchestra."}
          </p>

          <button className={styles.shopBtn} type="button">
            Booking Ticket <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventSection;
