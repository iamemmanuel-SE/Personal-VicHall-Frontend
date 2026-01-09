import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isLoggedIn, getToken } from "./auth/authStore";

import "./ticketPage.css";
import TheatreMap from "./TheatreMap";

export default function TicketPage() {
  const [category, setCategory] = useState("Child");
  const [selectedSeats, setSelectedSeats] = useState([]);

  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventErr, setEventErr] = useState("");


  const mapApiRef = useRef(null);

  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingErr, setBookingErr] = useState("");
  const [isBooking, setIsBooking] = useState(false);


  // const removeSeat = (seatToRemove) => {
  //   setSelectedSeats((prev) =>
  //     prev.filter(
  //       (s) =>
  //         !(
  //           s.section === seatToRemove.section &&
  //           s.row === seatToRemove.row &&
  //           s.seat === seatToRemove.seat
  //         )
  //     )
  //   );
  // };

  useEffect(() => {
    async function fetchEvent() {
      try {
        setLoadingEvent(true);
        setEventErr("");
  
        const res = await fetch(`http://localhost:5001/api/events/${eventId}`);
        if (!res.ok) throw new Error("Failed to load event");
  
        const data = await res.json();
        setEvent(data);
      } catch (e) {
        setEventErr(e.message || "Error loading event");
      } finally {
        setLoadingEvent(false);
      }
    }
  
    if (eventId) fetchEvent();
  }, [eventId]);
  
  
  const totalPrice = selectedSeats.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  
  const handleRemoveSeat = (seat) => {
    setSelectedSeats((prev) => {
      const next = prev.filter(
        (s) =>
          !(
            s.section === seat.section &&
            s.row === seat.row &&
            s.seat === seat.seat
          )
      );
  
      // update the map to match the panel
      mapApiRef.current?.setSelectedSeats?.(next);
  
      return next;
    });
  };

      const buildBookingPayload = () => {
        return {
          eventId,
          tickets: selectedSeats.map((s) => ({
            section: s.section,
            row: s.row,
            seat: s.seat,
            category: s.category || "adult", // THIS is the fix
          })),
        };
      };

      const handleGetTicket = async () => {
        setBookingErr("");
      
        // 1) must select at least 1 seat
        if (selectedSeats.length === 0) {
          setBookingErr("Please select at least one seat.");
          return;
        }
      
        // 2) if not logged in -> show modal
        if (!isLoggedIn()) {
          setShowAuthModal(true);
          return;
        }
      
        // 3) create booking (protected route)
        try {
          setIsBooking(true);
      
          const token = getToken();
          const payload = buildBookingPayload();
      
          const res = await fetch("http://localhost:5001/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
      
          const data = await res.json().catch(() => ({}));
      
          if (!res.ok) {
            setBookingErr(data.message || "Booking failed. Please try again.");
            return;
          }
      
          // booking successful -> move to checkout or confirmation
          // choose one:
          navigate("/checkout", { state: { booking: data } });
          // OR: navigate("/confirmation", { state: { booking: data } });
      
        } catch (e) {
          setBookingErr("Could not connect to server. Please try again.");
        } finally {
          setIsBooking(false);
        }
      };
      
      //change categories on seats
      const handleCategoryChange = (seat, newCategory) => {
        setSelectedSeats((prev) =>
          prev.map((s) => {
            const same =
              s.section === seat.section &&
              s.row === seat.row &&
              s.seat === seat.seat;
      
            return same ? { ...s, category: newCategory } : s;
          })
        );
      };
      
  

  return (
    <div className="ticket-page">
      {/* HERO */}
      <section className="hero">
      <div
        className="hero__img"
        aria-label="Event venue preview image"
        style={
          event?.imageUrl
            ? { backgroundImage: `url(${event.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />


        <div className="hero__content">

        {loadingEvent ? (
          <h1 className="hero__title">Loading...</h1>
        ) : eventErr ? (
          <h1 className="hero__title">{eventErr}</h1>
        ) : (
          <>
            <h1 className="hero__title">{event.title}</h1>

            <div className="hero__meta">
              <div>
                {event.dateLabel ? `${event.dateLabel}, ` : ""}
                {event.timeLabel || ""}
              </div>
              <div>{event.venue || ""}</div>
            </div>
          </>
        )}


          <button className="btn btn--ghost hero__moreInfo" type="button">
            <span className="btn__icon" aria-hidden="true">i</span>
            More info
          </button>
        </div>

        <div className="hero__actions">
          <button className="btn btn--ghost" type="button">
            <span className="btn__icon" aria-hidden="true">i</span>
            Accessibility Ticket
          </button>
        </div>
      </section>

      {/* MAIN */}
      <section className="main">
        {/* LEFT: MAP */}
        <div className="mapWrap">
          <TheatreMap 
          mapApiRef={mapApiRef}
              maxSeats={10}
              onSeatSelect={(seatsArray) => 
                setSelectedSeats(
                  (seatsArray || []).map((s) => ({
                    ...s,
                    category: s.category || "adult", // per-seat category
                  }))
                )
              }
          />

          <div className="mapControls" aria-hidden="true">
            <button
              className="mapControls__btn"
              type="button"
              onClick={() => mapApiRef.current?.reset?.()}
            >
              ⟲
            </button>
            <button
              className="mapControls__btn"
              type="button"
              onClick={() => mapApiRef.current?.zoomIn?.()}
            >
              +
            </button>
            <button
              className="mapControls__btn"
              type="button"
              onClick={() => mapApiRef.current?.zoomOut?.()}
            >
              −
            </button>
          </div>
        </div>

        {/* RIGHT: PANEL (unchanged) */}
        <aside className="panel" aria-label="Your selection panel">
          <div className="panel__header">Your Selection</div>

          <div className="panel__list" aria-label="Selected seats list">
        {selectedSeats.length === 0 ? (
          <div className="panel__empty">No seat selected</div>
        ) : (
          selectedSeats.map((s) => (
            <div
              key={`${s.section}-${s.row}-${s.seat}`}
              className="panel__card"
            >
              <div className="panel__title">VicHall Ticket</div>
              <div className="divider" />

              <div className="panel__subTitle">
                {(s.category || "adult").toUpperCase()} Ticket
              </div>

              <div className="divider divider--thin" />

              <div className="triplet">
                <div className="triplet__item">
                  <div className="triplet__label">Section</div>
                  <div className="triplet__value">{s.section}</div>
                </div>

                <div className="triplet__pipe" aria-hidden="true" />

                <div className="triplet__item">
                  <div className="triplet__label">Row</div>
                  <div className="triplet__value">{s.row}</div>
                </div>

                <div className="triplet__pipe" aria-hidden="true" />

                <div className="triplet__item">
                  <div className="triplet__label">Seat</div>
                  <div className="triplet__value">{s.seat}</div>
                </div>
              </div>

              <div className="divider divider--thin" />

              <div className="categoryRow">
                <div className="categoryRow__label">Choose Category</div>

                <div className="pillGroup">
                  <button
                    type="button"
                    className={`pill ${s.category === "child" ? "pill--active" : ""}`}
                    onClick={() => handleCategoryChange(s, "child")}
                  >
                    Child
                  </button>

                  <button
                    type="button"
                    className={`pill ${s.category === "senior" ? "pill--active" : ""}`}
                    onClick={() => handleCategoryChange(s, "senior")}
                  >
                    Senior
                  </button>

                  <button
                    type="button"
                    className={`pill ${(!s.category || s.category === "adult") ? "pill--active" : ""}`}
                    onClick={() => handleCategoryChange(s, "adult")}
                  >
                    Adult
                  </button>
                </div>
              </div>


              <div className="divider divider--thin" />

              <div className="priceRow">
                <div className="priceRow__price">
                  £{(Number(s.price) || 0).toFixed(2)}
                </div>

                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={() => handleRemoveSeat(s)}
                >
                  <span className="btn__icon" aria-hidden="true">🗑</span>
                  Remove Ticket
                </button>
              </div>
            </div>
          ))
        )}
    </div>


          <div className="panel__footer">
            <div className="qtyChip" aria-label="Ticket quantity">
              <span className="qtyChip__icon" aria-hidden="true">🎟</span>
              <span>{selectedSeats.length}</span>
            </div>
            
            <div className="panel__total">
            {bookingErr && <div style={{ color: "crimson", fontSize: 13 }}>{bookingErr}</div>}
              Total: £{totalPrice.toFixed(2)}
            </div>
            <button
              className="btn btn--primary btn--big"
              type="button"
              onClick={handleGetTicket}
              disabled={isBooking}
            >
              {isBooking ? "Processing..." : "Get Ticket"}
            </button>

          </div>
        </aside>
      </section>

      {/* MODAL TO PROMPT GUEST TO LOGIN OR REGISTER */}
      {showAuthModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "grid",
      placeItems: "center",
      zIndex: 9999,
      padding: 16,
    }}
    onClick={() => setShowAuthModal(false)}
  >
    <div
      style={{
        width: "min(520px, 92vw)",
        background: "#fff",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
        Login required
      </h3>

      <p style={{ marginTop: 8, marginBottom: 16, color: "#444" }}>
        Please log in or create an account to complete your booking.
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn"
          onClick={() => setShowAuthModal(false)}
          style={{
            background: "#eee",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 700,
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => navigate("/login", { state: { from: `/ticket/${eventId}` } })}
          style={{
            background: "#1e1f21",
            color: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 800,
          }}
        >
          Log in
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => navigate("/signup", { state: { from: `/ticket/${eventId}` } })}
          style={{
            background: "#000",
            color: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 800,
          }}
        >
          Register
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
