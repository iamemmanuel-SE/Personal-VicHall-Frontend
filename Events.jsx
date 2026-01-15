import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./events.css";
import Navbar from "./components/Navbar";

async function fetchEventsApi() {
  const res = await fetch("https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/events");
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data.message || "Failed to fetch events.");
  return Array.isArray(data) ? data : [];
}

export default function Events() {
  
  const [q, setQ] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const handleFindTicket = (id) => {
    navigate(`/ticket/${id}`);
  };


  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await fetchEventsApi();
        if (!alive) return;
        setEvents(data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load events.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return events;

    return events.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      const date = (e.dateLabel || "").toLowerCase();
      const time = (e.timeLabel || "").toLowerCase();
      const venue = (e.venue || "").toLowerCase();

      return (
        title.includes(term) ||
        desc.includes(term) ||
        date.includes(term) ||
        time.includes(term) ||
        venue.includes(term)
      );
    });
  }, [q, events]);

  return (
    <div className="vh-page vh-eventsPage">
      <Navbar />

      <main className="vh-content">

        <div className="vh-searchRow">
          <div className="vh-search">
            <span className="vh-searchIcon">⌕</span>
            <input
              placeholder="Search Event"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <h1 className="vh-title">Upcoming Events</h1>

        {loading && <p className="vh-hint">Loading events...</p>}
        {err && <p className="vh-error">{err}</p>}

        <div className="vh-list">
          {filtered.map((e) => (
            <div className="vh-card" key={e._id}>
              <div className="vh-datePill">
                <div className="vh-dateTop">{e.dateLabel}</div>
                <div className="vh-time">{e.timeLabel}</div>
              </div>

              <div className="vh-cardText">
                <h3>{e.title}</h3>
                <p>{e.description}</p>
              </div>

              <button
               className="vh-findBtn"
                type="button"
                onClick={() => handleFindTicket(e._id)}
                >
                Find ticket
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
//original