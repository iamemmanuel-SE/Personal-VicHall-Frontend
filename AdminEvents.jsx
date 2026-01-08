import { useEffect, useMemo, useState, useRef } from "react";
import AdminNavbar from "./components/AdminNavbar";
import "./adminEvents.css";
import { getToken } from "./auth/authStore";

/* ================= API ================= */

async function fetchEvents() {
  const token = getToken();
  if (!token) throw new Error("Missing auth token.");

  const res = await fetch("http://localhost:5001/api/events", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch events");
  return data;
}

/* ================= MODAL (unchanged) ================= */

function AddEventModal({ open, onClose }) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    venue: "",
    description: "",
    imageUrl: "",
    date: "",
    time: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setField("imageUrl", `/assets/${file.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      venue: form.venue.trim() || "Victoria Hall",
      imageUrl: form.imageUrl,
      dateLabel: form.date, // backend already stores formatted label
      timeLabel: form.time,
      startDateTime: new Date(`${form.date}T${form.time}`).toISOString(),
      status: "published",
    };

    try {
      setSubmitting(true);
      const token = getToken();

      await fetch("http://localhost:5001/api/events/postevent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      onClose();
    } catch (err) {
      setError("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aem-overlay" onMouseDown={(e) => e.target.classList.contains("aem-overlay") && onClose()}>
      <div className="aem-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="aem-close" onClick={onClose}>×</button>

        <h2 className="aem-title">Add New Event</h2>
        <p className="aem-subtitle">Make sure you fill all forms before proceeding</p>

        <form onSubmit={handleSubmit} className="aem-form">
          <div className="aem-grid">
            <div className="aem-field">
              <label>Event title</label>
              <input onChange={(e) => setField("title", e.target.value)} />
            </div>

            <div className="aem-field">
              <label>Venue</label>
              <input onChange={(e) => setField("venue", e.target.value)} />
            </div>

            <div className="aem-field">
              <label>Event Description</label>
              <textarea onChange={(e) => setField("description", e.target.value)} />
            </div>

            <div className="aem-upload" onClick={() => fileInputRef.current.click()}>
              <div className="aem-uploadText">Upload a cover photo</div>
            </div>

            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImagePick} />

            <div className="aem-row3">
              <div className="aem-field aem-small">
                <label>Event Date</label>
                <input type="date" onChange={(e) => setField("date", e.target.value)} />
              </div>

              <div className="aem-field aem-small">
                <label>Event Time</label>
                <input type="time" onChange={(e) => setField("time", e.target.value)} />
              </div>
            </div>
          </div>

          {error && <div className="aem-error">{error}</div>}

          <div className="aem-actions">
            <button className="aem-submit">{submitting ? "Creating..." : "Create Event"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminEvents() {
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents().then(setEvents).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term)
    );
  }, [q, events]);

  return (
    <div className="ae-page">
      <AdminNavbar />

      <main className="ae-content">
        <div className="ae-searchRow">
          <div className="ae-search">
            <span className="ae-searchIcon">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Event" />
          </div>

          <h1 className="ae-title">Upcoming Events – Admin view</h1>
          <div />
        </div>

        <div className="ae-list">
          {/* ===== HEADER ROW (FIGMA) ===== */}
          <div className="ae-card">
            <div className="ae-datePill">
              <div className="ae-dateTop">Date</div>
            </div>

            <div className="ae-cardText">
              <h3>Event name</h3>
              <p>Event Description.</p>
            </div>

            <button className="ae-actionBtn" onClick={() => setShowAdd(true)}>
              Add Event
            </button>
          </div>

          {/* ===== EVENTS FROM MONGODB ===== */}
          {filtered.map((e) => (
            <div className="ae-card" key={e._id}>
              <div className="ae-datePill">
                <div className="ae-dateTop">{e.dateLabel}</div>
                <div className="ae-time">{e.timeLabel}</div>
              </div>

              <div className="ae-cardText">
                <h3>{e.title}</h3>
                <p>{e.description}</p>
              </div>

              <button className="ae-actionBtn">Reserve seats</button>
            </div>
          ))}
        </div>
      </main>

      <AddEventModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
