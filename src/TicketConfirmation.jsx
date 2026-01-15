import "./ticketConfirm.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";


const TicketConfirmation = () => {
  const { state } = useLocation();
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(state?.booking || null);
  const [event, setEvent] = useState(state?.event || null);
  const [paymentSummary, setPaymentSummary] = useState(state?.paymentSummary || null);

  // If user refreshes confirmation page, state is lost → fetch booking + event
  useEffect(() => {
    const load = async () => {
      // if we already have booking from state, no need to refetch
      if (booking) return;

      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error("Failed to load booking");
        const data = await res.json();

        const loadedBooking = data.booking || data;
        setBooking(loadedBooking);

        // fetch event if needed
        const eventId = loadedBooking?.event;
        if (eventId) {
          const er = await fetch(`/api/events/${eventId}`);
          if (er.ok) setEvent(await er.json());
        }

        // fallback payment summary on refresh (no real card details available)
        setPaymentSummary({
          cardName: "Cardholder",
          last4: "•••• ----",
          paidAt: new Date().toISOString(),
          amount: loadedBooking?.pricing?.total ?? 0,
          bookingId,
        });
      } catch {
        navigate("/events");
      }
    };

    load();
  }, [booking, bookingId, navigate]);

  // Derived values MUST be outside useEffect so JSX can use them
  const total = useMemo(() => booking?.pricing?.total ?? 0, [booking?.pricing?.total]);

  const dateText = useMemo(() => {
    if (event?.dateLabel && event?.timeLabel) {
      return `${event.dateLabel} | ${event.timeLabel}`;
    }
    if (paymentSummary?.paidAt) {
      const paidAt = new Date(paymentSummary.paidAt);
      if (!Number.isNaN(paidAt.getTime())) {
        return `${paidAt.toLocaleDateString()} | ${paidAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
    }
    return "—";
  }, [event?.dateLabel, event?.timeLabel, paymentSummary?.paidAt]);

  return (
    <div className="seekr-page ticket-page">
      {/* Header */}
      <header className="seekr-header ticket-header">
      <button className="back-btn" onClick={() => navigate("/events")}>
        ←
      </button>

        <h1 className="ticket-title" aria-label=" ">
          {/* keep the structure - title intentionally blank */}
        </h1>
        <div />
      </header>

      {/* Main layout */}
      <div className="ticket-confirmation-wrap">
        <div className="ticket-card-ui">
          <div className="ticket-top">
            <div className="ticket-emoji" aria-hidden="true">
              🎉
            </div>
            <h2 className="ticket-thanks">Thank you!</h2>
            <p className="ticket-sub">Your ticket has been issued successfully</p>
          </div>

          <div className="ticket-perf-line" />

          <div className="ticket-meta">
            <div className="ticket-meta-col">
              <small className="ticket-label">BOOKING ID</small>
              <div className="ticket-value">{booking?._id || bookingId || "—"}</div>
            </div>

            <div className="ticket-meta-col right">
              <small className="ticket-label">TOTAL PAID</small>
              <div className="ticket-value">£{Number(total).toFixed(2)}</div>
            </div>

            <div className="ticket-meta-col wide">
              <small className="ticket-label">EVENT DATE & TIME</small>
              <div className="ticket-value">{dateText}</div>
            </div>
          </div>

          <div className="ticket-payrow">
            <div className="mc-icon" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="payrow-text">
              <div className="payrow-name">{paymentSummary?.cardName || "Cardholder"}</div>
              <div className="payrow-mask">{paymentSummary?.last4 || "•••• ----"}</div>
            </div>
          </div>

          <div className="ticket-bottom-perf" />

          <div className="ticket-barcode" aria-hidden="true">
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketConfirmation;
//MAIN