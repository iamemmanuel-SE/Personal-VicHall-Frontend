import React, { useRef, useState } from "react";
import "./ticketPage.css";
import TheatreMap from "./TheatreMap";

export default function TicketPage() {
  const [category, setCategory] = useState("Child");
  const [selectedSeats, setSelectedSeats] = useState([]);

  const mapApiRef = useRef(null);

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
  

  return (
    <div className="ticket-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero__img" aria-label="Event venue preview image" />

        <div className="hero__content">
          <h1 className="hero__title">Step Into Christmas</h1>

          <div className="hero__meta">
            <div>Sun, 3 May 2026, 19:00</div>
            <div>O2 City Hall Newcastle, Newcastle Upon Tyne</div>
          </div>

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
          <TheatreMap mapApiRef={mapApiRef}
              maxSeats={10}
              onSeatSelect={(seatsArray) => setSelectedSeats(seatsArray || [])}
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

              <div className="panel__subTitle">{category} Ticket</div>
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
              Total: £{totalPrice.toFixed(2)}
            </div>
            <button className="btn btn--primary btn--big" type="button">
              Get Ticket
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
