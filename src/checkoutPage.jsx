// CheckoutPage.jsx (your current SeekrPay component updated to use real booking data)
import "./seekrPay.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const SeekrPay = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // booking passed from TicketPage: navigate("/checkout", { state: { booking: data.booking, loyalty: data.loyalty } })
  const [booking, setBooking] = useState(state?.booking || null);
  const [event, setEvent] = useState(state?.event || null); // optional if you ever pass it later

  useEffect(() => {
    // If user refreshes /checkout, react-router state is lost
    if (!booking) {
      navigate("/events"); // or "/mainpage"
    }
  }, [booking, navigate]);

  // Fetch event details for the right-side event card (title, image, date, venue)
  useEffect(() => {
    async function fetchEvent() {
      try {
        if (!booking?.event) return;

        const res = await fetch(`/api/events/${booking.event}`);
        if (!res.ok) return;

        const data = await res.json();
        setEvent(data);
      } catch {
        // ignore
      }
    }

    if (!event && booking?.event) fetchEvent();
  }, [booking, event]);

  // Build counts for the UI counters (Child/Senior/Adult)
  const categoryCounts = useMemo(() => {
    const counts = { child: 0, senior: 0, adult: 0 };
    (booking?.tickets || []).forEach((t) => {
      const c = String(t.category || "adult").toLowerCase();
      if (c === "child" || c === "senior" || c === "adult") counts[c] += 1;
    });
    return counts;
  }, [booking]);

  const ticketCount = booking?.partySize ?? (booking?.tickets?.length || 0);

  const subtotal = booking?.pricing?.subtotal ?? 0;
  const discountAmount = booking?.pricing?.discountAmount ?? 0;
  const total = booking?.pricing?.total ?? 0;

  const discountType = booking?.discount?.type || "none"; // "child"|"senior"|"group"|"loyalty"|"none"
  const discountRate = booking?.discount?.rate ?? 0;

  if (!booking) return null;

  return (
    <div className="seekr-page">
      {/* Header */}
      <header className="seekr-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>Seekr. Pay</h1>
        <div />
      </header>

      {/* Main layout */}
      <div className="seekr-container">
        {/* LEFT – Payment Form */}
        <div className="payment-card">
          <div className="field">
            <label>Name of Card</label>
            <input type="text" />
          </div>

          <div className="field">
            <label>Card Number</label>
            <input type="text" />
          </div>

          <div className="row">
            <div className="field">
              <label>Expiration Date</label>
              <input type="text" />
            </div>

            <div className="field">
              <label>Security Code</label>
              <input type="text" />
            </div>

            <div className="cvv-info">
              <span className="card-icon">💳</span>
              <span>3-digits on back of card</span>
            </div>
          </div>

          <div className="field">
            <label>Country</label>
            <input type="text" />
          </div>

          <div className="field">
            <label>Address Line</label>
            <input type="text" />
          </div>

          <div className="field">
            <label>City</label>
            <input type="text" />
          </div>

          <div className="field">
            <label>Phone Number</label>
            <input type="text" />
          </div>
        </div>

        {/* RIGHT – Summary */}
        <div className="summary">
          {/* Event card */}
          <div className="event-card">
            <img
              src={
                event?.imageUrl
                  ? event.imageUrl
                  : "https://images.unsplash.com/photo-1524777313293-86d2ab467344"
              }
              alt="event"
            />
            <div>
              <h2>{event?.title || "Your Event"}</h2>
              <p>
                {event?.dateLabel ? `${event.dateLabel}` : "Date"}{" "}
                {event?.timeLabel ? `, ${event.timeLabel}` : ""}
              </p>
              <p>{event?.venue || "Victoria Hall"}</p>
            </div>
          </div>

          {/* Ticket details */}
          <div className="ticket-card">
            <div className="block">
              <small>TICKET TYPE</small>
              <p>VicHall Ticket</p>
            </div>

            <hr />

            <div className="block">
              <small>BOOKING ID</small>
              <p style={{ wordBreak: "break-word" }}>{booking?._id}</p>
            </div>

            <hr />

            {/* Category counts (real) */}
            <div className="category">
              <span>Child</span>
              <div className="counter">
                <button disabled>-</button>
                <span>{categoryCounts.child}</span>
                <button disabled>+</button>
              </div>
            </div>

            <div className="category">
              <span>Senior</span>
              <div className="counter">
                <button disabled>-</button>
                <span>{categoryCounts.senior}</span>
                <button disabled>+</button>
              </div>
            </div>

            <div className="category">
              <span>Adult</span>
              <div className="counter">
                <button disabled>-</button>
                <span>{categoryCounts.adult}</span>
                <button disabled>+</button>
              </div>
            </div>

            <hr />

            {/* Totals (real) */}
            <div className="cost">
              <span>Ticket x {ticketCount}</span>
              <span>£{Number(subtotal).toFixed(2)}</span>
            </div>

            <div className="cost">
              <span>
                Discount Type | {discountType} | {Math.round(discountRate * 100)}%
              </span>
              <span>-£{Number(discountAmount).toFixed(2)}</span>
            </div>

            <div className="cost total">
              <span>Total</span>
              <span>£{Number(total).toFixed(2)}</span>
            </div>

            <button
              className="pay-btn"
              onClick={() => {
                // Prototype: mark paid / go to confirmation (your choice)
                // navigate("/confirmation", { state: { booking } });
                alert("Payment prototype: connect to Stripe/PayPal later ");
              }}
            >
              Make Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekrPay;
