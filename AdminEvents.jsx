import { useMemo, useState } from "react";
import AdminNavbar from "./components/AdminNavbar";
import "./adminEvents.css";

export default function AdminEvents() {
  const [q, setQ] = useState("");

  const events = [
    {
      kind: "header",
      tag: "Date",
      time: "",
      title: "Event name",
      desc: "Event Description.",
    },
    {
      tag: "Today",
      time: "17:00",
      title: "Bergen International Film Festival",
      desc:
        "Films from all over the world gather film enthusiasts for unique moments at the Bergen International Film Festival.",
    },
    {
      tag: "5 Dec",
      time: "18:30",
      title: "Step Into Christmas",
      desc:
        "A festive show celebrating holiday songs and spirit ideal for getting into the Christmas mood.",
    },
    {
      tag: "14 Dec",
      time: "10:00",
      title: "SOT Classics — A Winter Concert",
      desc:
        "A classical orchestral concert featuring timeless works from the Classic FM Hall of Fame.",
    },
    {
      tag: "18 Dec",
      time: "20:00",
      title: "Ross Noble: Cranium of Curiosities",
      desc:
        "Stand-up from Ross Noble, known for his freewheeling, improvisational comedy style.",
    },
    {
      tag: "20 Dec",
      time: "17:00",
      title: "The Nutcracker Ballet",
      desc:
        "A magical retelling of the classic Christmas tale performed by a world-class ballet company.",
    },
  ];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return events;
    return events.filter((e) => {
      if (e.kind === "header") return true;
      return (
        e.title.toLowerCase().includes(term) ||
        e.desc.toLowerCase().includes(term) ||
        e.tag.toLowerCase().includes(term) ||
        e.time.toLowerCase().includes(term)
      );
    });
  }, [q]);

  return (
    <div className="ae-page">
      <AdminNavbar />

      <main className="ae-content">
        {/* Search pill on the left (like Figma) */}
        <div className="ae-searchRow">
          <div className="ae-search">
            <span className="ae-searchIcon">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Event"
            />
          </div>

          <h1 className="ae-title">Upcoming Events - Admin view</h1>
          <div />
        </div>

        <div className="ae-list">
          {filtered.map((e, i) => {
            const isHeader = e.kind === "header";

            return (
              <div className="ae-card" key={i}>
                <div className="ae-datePill">
                  <div className="ae-dateTop">{e.tag}</div>
                  {!!e.time && <div className="ae-time">{e.time}</div>}
                </div>

                <div className="ae-cardText">
                  <h3>{e.title}</h3>
                  <p>{e.desc}</p>
                </div>

                <button
                  className="ae-actionBtn"
                  type="button"
                  onClick={() => {
                    if (isHeader) console.log("Add Event");
                    else console.log("Reserve seats:", e.title);
                  }}
                >
                  {isHeader ? "Add Event" : "Reserve seats"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
