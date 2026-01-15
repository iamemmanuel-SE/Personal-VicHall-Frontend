import "./bookingsPage.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "./auth/authStore";

/**
 * Uses booking.event.dateLabel + timeLabel (best)
 * Falls back to event.date (ISO) if you ever add it
 * Otherwise falls back to booking.createdAt
 */
function parseEventDateTime(ev, booking) {
  // 1) If backend ever provides a real ISO date field
  if (ev?.date) {
    const d = new Date(ev.date);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // 2) Use dateLabel + timeLabel (your UI data)
  // Example: dateLabel = "2026-02-14", timeLabel = "19:00"
  if (ev?.dateLabel) {
    const dateStr = String(ev.dateLabel).trim();

    // timeLabel might be "19:00" or "7:00 PM"
    const timeStr = String(ev?.timeLabel || "00:00").trim();

    // Try ISO-like first: "YYYY-MM-DDTHH:mm"
    // If timeLabel is "19:00", this works great.
    let isoCandidate = `${dateStr}T${timeStr}`;
    let dt = new Date(isoCandidate);
    if (!Number.isNaN(dt.getTime())) return dt;

    // If timeLabel is "7:00 PM", above might fail in some browsers.
    // Try "YYYY-MM-DD 7:00 PM"
    dt = new Date(`${dateStr} ${timeStr}`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  // 3) Fallback: booking creation time
  if (booking?.createdAt) {
    const dt = new Date(booking.createdAt);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return null;
}

export default function BookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // "upcoming" | "past"
  const [tab, setTab] = useState("past");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const token = getToken();
        if (!token) throw new Error("You must be logged in to view bookings.");

        const res = await fetch("https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/bookings/paid", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load bookings.");

        const list = Array.isArray(data) ? data : data.bookings || [];
        setBookings(list);
      } catch (e) {
        setErr(e?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Split bookings by event date compared to now
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();

    const enriched = bookings
      .map((b) => {
        const ev = b?.event && typeof b.event === "object" ? b.event : null;
        const dt = parseEventDateTime(ev, b);
        return { booking: b, event: ev, dt };
      })
      .filter((x) => x.booking); // safety

    const upcoming = [];
    const past = [];

    for (const x of enriched) {
      // If we can't parse date, treat it as past (so it still shows somewhere)
      if (!x.dt) {
        past.push(x);
        continue;
      }

      if (x.dt.getTime() >= now.getTime()) upcoming.push(x);
      else past.push(x);
    }

    // Sort:
    // - Upcoming: soonest first
    upcoming.sort((a, b) => (a.dt?.getTime() || 0) - (b.dt?.getTime() || 0));
    // - Past: most recent first
    past.sort((a, b) => (b.dt?.getTime() || 0) - (a.dt?.getTime() || 0));

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  const upcomingCount = upcomingBookings.length;
  const pastCount = pastBookings.length;

  // Optional: auto-switch to Upcoming if there are upcoming bookings and Past is empty
  useEffect(() => {
    if (!loading && !err) {
      if (tab === "past" && pastCount === 0 && upcomingCount > 0) setTab("upcoming");
      if (tab === "upcoming" && upcomingCount === 0 && pastCount > 0) setTab("past");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, err, upcomingCount, pastCount]);

  if (loading) {
    return (
      <div className="bk-page">
        <div className="bk-shell">
          <div className="bk-title-skel" />
          <div className="bk-sub-skel" />
          <div className="bk-card-skel" />
          <div className="bk-card-skel" />
        </div>
      </div>
    );
  }

  const activeList = tab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div className="bk-page">
      <div className="bk-shell">
        {/* Back arrow */}
        <button className="bk-back" type="button" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>

        <h1 className="bk-title">Bookings</h1>
        <p className="bk-subtitle">View your past bookings and ticket history.</p>

        {/* Tabs */}
        <div className="bk-tabs">
          <button
            className={`bk-tab ${tab === "upcoming" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("upcoming")}
          >
            Upcoming <span className="bk-badge">{upcomingCount}</span>
          </button>

          <button
            className={`bk-tab ${tab === "past" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("past")}
          >
            Past <span className="bk-badge">{pastCount}</span>
          </button>

          <div className="bk-tab-line" />
        </div>

        <h2 className="bk-section-title">
          {tab === "upcoming" ? "Upcoming Bookings" : "Booking History"}
        </h2>

        {err && (
          <div className="bk-alert">
            <div className="bk-alert-title">Couldn’t load your bookings</div>
            <div className="bk-alert-text">{err}</div>
            <button className="bk-alert-btn" onClick={() => navigate("/login")}>
              Go to login
            </button>
          </div>
        )}

        {!err && bookings.length === 0 && (
          <div className="bk-empty">
            <div className="bk-empty-title">No paid bookings yet</div>
            <div className="bk-empty-text">
              Once you complete a payment, your bookings will show here.
            </div>
            <button className="bk-empty-btn" onClick={() => navigate("/events")}>
              Browse events
            </button>
          </div>
        )}

        {!err && bookings.length > 0 && activeList.length === 0 && (
          <div className="bk-empty">
            <div className="bk-empty-title">
              {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            </div>
            <div className="bk-empty-text">
              {tab === "upcoming"
                ? "Your future paid tickets will appear here."
                : "Your attended bookings will appear here after the event date."}
            </div>
            <button className="bk-empty-btn" onClick={() => navigate("/events")}>
              Browse events
            </button>
          </div>
        )}

        <div className="bk-list">
          {activeList.map(({ booking: b, event: ev, dt }) => {
            const title = ev?.title || "Victoria Hall Event";
            const venue = ev?.venue || "Stoke-on-Trent Victoria Hall";
            const dateLine =
              ev?.dateLabel && ev?.timeLabel
                ? `${ev.dateLabel} at ${ev.timeLabel}`
                : dt
                ? dt.toLocaleString()
                : "—";

            const total = Number(b?.pricing?.total ?? 0);
            const currency = b?.pricing?.currency || "GBP";

            const counts = (b?.tickets || []).reduce(
              (acc, t) => {
                const c = String(t.category || "adult").toLowerCase();
                if (c === "child") acc.child += 1;
                else if (c === "senior") acc.senior += 1;
                else acc.adult += 1;
                return acc;
              },
              { adult: 0, child: 0, senior: 0 }
            );

            const thumb =
              ev?.imageUrl ||
              "https://images.unsplash.com/photo-1524777313293-86d2ab467344?auto=format&fit=crop&w=900&q=60";

            // ✅ Status depends on tab
            const statusLabel = tab === "past" ? "Attended" : "Upcoming";

            return (
              <div className="bk-card" key={b._id}>
                {/* LEFT */}
                <div className="bk-left">
                  <img className="bk-thumb" src={thumb} alt={title} />
                  <div className="bk-mini">
                    <div className="bk-mini-top">VicHall Ticket</div>
                    <div className="bk-mini-row">
                      <span>
                        Adult × {counts.adult + counts.child + counts.senior}
                      </span>
                      <span className="bk-mini-muted">PM:24</span>
                    </div>
                  </div>
                </div>

                {/* MIDDLE */}
                <div className="bk-mid">
                  <div className="bk-mid-top">
                    <div>
                      <div className="bk-event-title">{title}</div>
                      <div className="bk-event-meta">{dateLine}</div>
                      <div className="bk-event-meta">{venue}</div>
                    </div>

                    <div className={`bk-status ${tab === "upcoming" ? "upcoming" : ""}`}>
                      <span className="bk-status-dot">✓</span>
                      {statusLabel}
                    </div>
                  </div>

                  <div className="bk-strip">
                    <div className="bk-strip-left">
                      <div className="bk-strip-row">
                        <strong>Booking ID :</strong>{" "}
                        <span className="bk-mono">{b._id}</span>
                      </div>

                      {counts.adult > 0 && (
                        <div className="bk-strip-row">
                          <span className="bk-ico">👤</span> Adult × {counts.adult}
                        </div>
                      )}

                      {counts.child > 0 && (
                        <div className="bk-strip-row">
                          <span className="bk-ico">👤</span> Child × {counts.child}
                        </div>
                      )}

                      {counts.senior > 0 && (
                        <div className="bk-strip-row">
                          <span className="bk-ico">👤</span> Senior × {counts.senior}
                        </div>
                      )}
                    </div>

                    <div className="bk-strip-right">
                      <div className="bk-strip-price">
                        {currency === "GBP" ? "£" : ""}
                        {total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="bk-right">
                  <div className="bk-right-price">
                    {currency === "GBP" ? "£" : ""}
                    {total.toFixed(2)}
                  </div>

                  <div className="bk-qr">
                    <div className="bk-qr-inner" />
                  </div>

                  <button
                    className="bk-btn"
                    type="button"
                    onClick={() =>
                      navigate(`/ticket-confirmation/${b._id}`, {
                        state: { booking: b, event: ev },
                      })
                    }
                  >
                    View Ticket
                  </button>

                  <button
                    className="bk-link"
                    type="button"
                    onClick={() => alert("PDF download coming next ✅")}
                  >
                    ⬇ Download PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
//MAIN
