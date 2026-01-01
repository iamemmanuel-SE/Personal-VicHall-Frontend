import "./events.css";

const Events = () => {
  const events = [
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
    {
      tag: "22 – 31 Nov",
      time: "10:00",
      title: "Christmas at the Hall — Choir & Candlelight",
      desc:
        "An enchanting evening of carols, choir performances, and candlelit ambience — the perfect way to welcome Christmas.",
    },
  ];

  return (
  

      <main className="vh-content">
        <div className="vh-searchRow">
          <div className="vh-search">
            <span className="vh-searchIcon">⌕</span>
            <input placeholder="Search Event" />
          </div>
        </div>

        <h1 className="vh-title">Upcoming Events</h1>

        <div className="vh-list">
          {events.map((e, i) => (
            <div className="vh-card" key={i}>
              <div className="vh-datePill">
                <div className="vh-dateTop">{e.tag}</div>
                <div className="vh-time">{e.time}</div>
              </div>

              <div className="vh-cardText">
                <h3>{e.title}</h3>
                <p>{e.desc}</p>
              </div>

              <button className="vh-findBtn">Find ticket</button>
            </div>
          ))}
        </div>
      </main>
    
  );
};

export default Events;
