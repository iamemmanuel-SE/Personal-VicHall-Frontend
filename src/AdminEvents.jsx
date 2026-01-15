import { useEffect, useMemo, useState, useRef } from "react";
import AdminNavbar from "./components/AdminNavbar";
import "./adminEvents.css";
import { getToken } from "./auth/authStore";
import AdminReserveSeatModal from "./components/AdminReserveSeatModal";

/* ================= API ================= */

async function fetchEvents() {
  const res = await fetch("https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/events");
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data.message || "Failed to fetch events");
  return Array.isArray(data) ? data : [];
}

async function deleteEventApi(eventId) {
  const token = getToken();
  if (!token) throw new Error("Missing auth token.");

  const res = await fetch(`https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to delete event.");
  return data; // { ok: true, eventId, message }
}

/* ================= MODAL (unchanged) ================= */

function AddEventModal({ open, onClose, onCreated }) {

  
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

  //Preview locally (works immediately)
  const previewUrl = URL.createObjectURL(file);
    setField("imageUrl", previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Event title is required.");
    if (!form.description.trim()) return setError("Event description is required.");
    if (!form.date) return setError("Event date is required.");
    if (!form.time) return setError("Event time is required.");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      venue: form.venue.trim() || "Victoria Hall",
      imageUrl: form.imageUrl,
      dateLabel: form.date, // keep as you currently do
      timeLabel: form.time,
      startDateTime: new Date(`${form.date}T${form.time}`).toISOString(),
      status: "published",
    };

    try {
      setSubmitting(true);
      const token = getToken();
  
      // CREATE FORMDATA
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("venue", form.venue.trim() || "Victoria Hall");
      fd.append("dateLabel", form.date);
      fd.append("timeLabel", form.time);
      fd.append(
        "startDateTime",
        new Date(`${form.date}T${form.time}`).toISOString()
      );
      fd.append("status", "published");
  
      // APPEND IMAGE FILE (if selected)
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        fd.append("image", file);
      }
  
      // SEND MULTIPART REQUEST
      const res = await fetch("https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/events/postevent", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ❗ DO NOT set Content-Type
        },
        credentials: "include",
        body: fd,
      });
  
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create event.");
  
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  //   try {
  //     setSubmitting(true);
  //     const token = getToken();

  //     const res = await fetch("/api/events/postevent", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       credentials: "include",
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json().catch(() => ({}));
  //     if (!res.ok) throw new Error(data.message || "Failed to create event.");

  //     onCreated?.(data);
  //     onClose();
  //   } catch (err) {
  //     setError(err?.message || "Failed to create event.");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  

  return (
    <div
      className="aem-overlay"
      onMouseDown={(e) => e.target.classList.contains("aem-overlay") && onClose()}
    >
      <div className="aem-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="aem-close" onClick={onClose}>
          ×
        </button>

        <h2 className="aem-title">Add New Event</h2>
        <p className="aem-subtitle">Make sure you fill all forms before proceeding</p>

        <form onSubmit={handleSubmit} className="aem-form">
          <div className="aem-grid">
            <div className="aem-field">
              <label>Event title</label>
              <input value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </div>

            <div className="aem-field">
              <label>Venue</label>
              <input value={form.venue} onChange={(e) => setField("venue", e.target.value)} />
            </div>

            <div className="aem-field">
              <label>Event Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="aem-upload" onClick={() => fileInputRef.current?.click()}>
            {form.imageUrl ? (
              <img className="aem-uploadPreview" src={form.imageUrl} alt="Cover preview" />
            ) : (
              <div className="aem-uploadText">Upload a cover photo</div>
            )}
          </div>


            {/* <div className="aem-upload" onClick={() => fileInputRef.current.click()}>
              <div className="aem-uploadText">Upload a cover photo</div>
            </div> */}

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleImagePick}
            />

            <div className="aem-row3">
              <div className="aem-field aem-small">
                <label>Event Date</label>
                <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
              </div>

              <div className="aem-field aem-small">
                <label>Event Time</label>
                <input type="time" value={form.time} onChange={(e) => setField("time", e.target.value)} />
              </div>
            </div>
          </div>

          {error && <div className="aem-error">{error}</div>}

          <div className="aem-actions">
            <button className="aem-submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Event"}
            </button>
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
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    fetchEvents().then(setEvents).catch((e) => setPageError(e?.message || "Failed to load events."));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return events;
    return events.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      const date = (e.dateLabel || "").toLowerCase();
      const time = (e.timeLabel || "").toLowerCase();
      return title.includes(term) || desc.includes(term) || date.includes(term) || time.includes(term);
    });
  }, [q, events]);

  const handleDelete = async (evt, eventId, title) => {
    evt.preventDefault();
    evt.stopPropagation();

    setPageError("");

    const ok = window.confirm(`Delete "${title}"?\nThis cannot be undone.`);
    if (!ok) return;

    const prev = events;
    setDeletingId(eventId);

    // optimistic remove
    setEvents((cur) => cur.filter((x) => x._id !== eventId));

    try {
      await deleteEventApi(eventId);
    } catch (e) {
      // rollback if failed
      setEvents(prev);
      setPageError(e?.message || "Failed to delete event.");
    } finally {
      setDeletingId("");
    }
  };
    // 1) Open modal when you click "Reserve seats"
    const openReserveModal = (evtObj) => {
      setSelectedEvent(evtObj);
      setReserveOpen(true);
    };

  const closeReserve = () => {
    setReserveOpen(false);
    setSelectedEvent(null);
  };

  const handleReserveSeats = async ({ row, from, to, section }) => {
    const token = getToken();
    if (!token) throw new Error("Missing auth token.");
  
    const res = await fetch(
      `https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/admin/events/${selectedEvent._id}/reserve-seat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ row, from, section }),
      }
    );
  
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to reserve seat.");
  
    // optional: update the event list locally so UI reflects new reserved seats
    setEvents((prev) =>
      prev.map((ev) => (ev._id === selectedEvent._id ? { ...ev, reservedSeats: data.reservedSeats } : ev))
    );
  
    return data;
  };
  

  return (
    <div className="ae-page">
      <AdminNavbar />

      <main className="ae-content">
        <div className="ae-searchRow">
          <div className="ae-search">
            <span className="ae-searchIcon">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Event" />
          </div>

          <h1 className="ae-title">Upcoming Events</h1>
          <div />
        </div>

        {pageError && <div className="ae-errorBanner">{pageError}</div>}

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

            {/* Right side in Figma: trash + button.
               Header row only has Add Event. Keep spacing consistent. */}
            <div className="ae-actionsRight">
              <button className="ae-actionBtn" onClick={() => setShowAdd(true)}>
                Add Event
              </button>
            </div>
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

              {/* Trash + Reserve seats */}
              <div className="ae-actionsRight">
                <button
                  type="button"
                  className="ae-trashBtn"
                  title="Delete event"
                  aria-label="Delete event"
                  onClick={(evt) => handleDelete(evt, e._id, e.title)}
                  disabled={deletingId === e._id}
                >
                  {/* inline trash icon (no extra deps) */}
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path
                      d="M9 3h6m-8 4h10m-9 0 1 14h6l1-14M10 11v7m4-7v7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button className="ae-actionBtn" type="button" onClick={() => openReserveModal(e)}>
                  Reserve seats
                </button>

              </div>
            </div>
          ))}
        </div>
      </main>

      <AddEventModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(created) => {
          // prepend and keep sorted by startDateTime if you want
          setEvents((cur) => [created, ...cur]);
        }}
      />
          <AdminReserveSeatModal
          open={reserveOpen}
          onClose={closeReserve}
          event={
            selectedEvent
              ? {
                  ...selectedEvent,
                  dateText:
                    selectedEvent?.dateLabel && selectedEvent?.timeLabel
                      ? `${selectedEvent.dateLabel}, ${selectedEvent.timeLabel}`
                      : selectedEvent?.dateText,
                  venueText: selectedEvent?.venue || selectedEvent?.venueText,
                }
              : null
          }
          onReserve={handleReserveSeats}
        />


    </div>
  );
}
//MAIN