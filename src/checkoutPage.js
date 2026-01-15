// CheckoutPage.jsx (your current SeekrPay component updated to use real booking data)
import "./seekrPay.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "./auth/authStore";


const SeekrPay = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  


    // booking passed from TicketPage: navigate("/checkout", { state: { booking: data.booking, loyalty: data.loyalty } })
    const [booking] = useState(state?.booking || null);

    const [event, setEvent] = useState(state?.event || null); // optional if you ever pass it later

  const initialPayForm = {
    cardName: "",
    cardNumber: "",
    exp: "",
    cvv: "",
    country: "",
    address: "",
    city: "",
    phone: "",
  };
  
  const [payForm, setPayForm] = useState(initialPayForm);
  
  const bookingId = booking?._id; // define bookingId
  const setPayField = (k, v) => setPayForm((p) => ({ ...p, [k]: v }));
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // ---------- formatters ----------
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16); // max 16 digits
    return digits.replace(/(\d{4})(?=\d)/g, "$1 "); // group 4-4-4-4
  };


  const formatCVV = (value) => value.replace(/\D/g, "").slice(0, 3);

  const formatExp = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4); // MMYY
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  };

  const isValidCard16 = (card) => card.replace(/\D/g, "").length === 16;

  const isValidCVV = (cvv) => cvv.replace(/\D/g, "").length === 3;

  const isValidExp = (exp) => {
    const digits = exp.replace(/\D/g, ""); // MMYY
    if (digits.length !== 4) return false;
    const mm = parseInt(digits.slice(0, 2), 10);
    const yy = parseInt(digits.slice(2, 4), 10);
    if (mm < 1 || mm > 12) return false;
    // optional: ensure not expired (simple)
    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    const currentMM = now.getMonth() + 1;
    if (yy < currentYY) return false;
    if (yy === currentYY && mm < currentMM) return false;
    return true;
  };

  const isNotEmpty = (v) => String(v || "").trim().length > 0;

  const validatePayForm = (form) => {
    const e = {};
    if (!isNotEmpty(form.cardName)) e.cardName = "Cardholder name is required.";
    if (!isValidCard16(form.cardNumber)) e.cardNumber = "Card number must be 16 digits.";
    if (!isValidExp(form.exp)) e.exp = "Enter a valid expiry (MM / YY).";
    if (!isValidCVV(form.cvv)) e.cvv = "CVV must be 3 digits.";
    if (!isNotEmpty(form.country)) e.country = "Country is required.";
    if (!isNotEmpty(form.address)) e.address = "Address is required.";
    if (!isNotEmpty(form.city)) e.city = "City is required.";
    if (!isNotEmpty(form.phone)) e.phone = "Phone number is required.";
    return e;
  };

    // keep errors in sync while typing (nice UX)
    useEffect(() => {
      setErrors(validatePayForm(payForm));
  }, [payForm]);

  const canPay = Object.keys(errors).length === 0;

  const handleMakePayment = async () => {
    try {
      if (!bookingId) throw new Error("Missing booking id");
  
      setIsProcessingPayment(true);
  
      const token = getToken();
      const res = await fetch("https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/payments/mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ bookingId }),
      });
  
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Payment failed");
  
      // Optional: keep the animation visible briefly (feels real)
      await new Promise((r) => setTimeout(r, 4000));
  
      // Reset the form
      setPayForm(initialPayForm);
  
      // Build payment summary
      const last4 = String(payForm.cardNumber || "").replace(/\D/g, "").slice(-4);
      const paymentSummary = {
        cardName: payForm.cardName || "Cardholder",
        last4: last4 ? `•••• ${last4}` : "•••• ----",
        paidAt: new Date().toISOString(),
        amount: booking?.pricing?.total ?? 0,
        bookingId,
      };
  

      
      // Redirect
      navigate(`/ticket-confirmation/${bookingId}`, {
        state: { booking, event, paymentSummary },
        replace: true, // prevents going back to checkout
      });

      const e = validatePayForm(payForm);
      if (Object.keys(e).length) throw new Error("Please complete all payment fields correctly.");

    } catch (e) {
      alert(e?.message || "Payment failed");
      setIsProcessingPayment(false);
    }
  };
  
  

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

        const res = await fetch(`https://vichall-api-12345-47a91ff28cfc.herokuapp.com/api/events/${booking.event}`);
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
          {isProcessingPayment && (
      <div className="pay-overlay" role="dialog" aria-modal="true">
        <div className="pay-overlay-card">
          <div className="pay-spinner" />
          <div className="pay-overlay-title">Processing payment…</div>
          <div className="pay-overlay-sub">Please do not refresh or close this page.</div>
        </div>
      </div>
)}

      <div className="seekr-shell"> 
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
          <input
            type="text"
            value={payForm.cardName}
            onChange={(e) => setPayField("cardName", e.target.value)}
            onBlur={() => markTouched("cardName")}
            placeholder="Full name"
          />
          {touched.cardName && errors.cardName && <small className="pay-error">{errors.cardName}</small>}
        </div>

        <div className="field">
          <label>Card Number</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={payForm.cardNumber}
            onChange={(e) => setPayField("cardNumber", formatCardNumber(e.target.value))}
            onBlur={() => markTouched("cardNumber")}
            maxLength={19} // 16 digits + 3 spaces
          />
          {touched.cardNumber && errors.cardNumber && <small className="pay-error">{errors.cardNumber}</small>}
        </div>

        <div className="row">
          <div className="field">
            <label>Expiration Date</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM / YY"
              value={payForm.exp}
              onChange={(e) => setPayField("exp", formatExp(e.target.value))}
              onBlur={() => markTouched("exp")}
              maxLength={7} // "MM / YY"
            />
            {touched.exp && errors.exp && <small className="pay-error">{errors.exp}</small>}
          </div>

          <div className="field">
            <label>Security Code</label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="CVV"
              value={payForm.cvv}
              onChange={(e) => setPayField("cvv", formatCVV(e.target.value))}
              onBlur={() => markTouched("cvv")}
              maxLength={3}
            />
            {touched.cvv && errors.cvv && <small className="pay-error">{errors.cvv}</small>}
          </div>

          <div className="cvv-info">
            <span className="card-icon">💳</span>
            <span>3-digits on back of card</span>
          </div>
        </div>

        <div className="field">
          <label>Country</label>
          <input
            type="text"
            placeholder="United Kingdom"
            value={payForm.country}
            onChange={(e) => setPayField("country", e.target.value)}
            onBlur={() => markTouched("country")}
          />
          {touched.country && errors.country && <small className="pay-error">{errors.country}</small>}
        </div>

        <div className="field">
          <label>Address Line</label>
          <input
            type="text"
            placeholder="Street address"
            value={payForm.address}
            onChange={(e) => setPayField("address", e.target.value)}
            onBlur={() => markTouched("address")}
          />
          {touched.address && errors.address && <small className="pay-error">{errors.address}</small>}
        </div>

        <div className="field">
          <label>City</label>
          <input
            type="text"
            placeholder="City"
            value={payForm.city}
            onChange={(e) => setPayField("city", e.target.value)}
            onBlur={() => markTouched("city")}
          />
          {touched.city && errors.city && <small className="pay-error">{errors.city}</small>}
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="+44"
            value={payForm.phone}
            onChange={(e) => setPayField("phone", e.target.value)}
            onBlur={() => markTouched("phone")}
          />
          {touched.phone && errors.phone && <small className="pay-error">{errors.phone}</small>}
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
              
                <span>{categoryCounts.child}</span>

              </div>
            </div>

            <div className="category">
              <span>Senior</span>
              <div className="counter">
             
                <span>{categoryCounts.senior}</span>
           
              </div>
            </div>

            <div className="category">
              <span>Adult</span>
              <div className="counter">
           
                <span>{categoryCounts.adult}</span>
        
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
            disabled={!canPay}
            onClick={() => {
              // if somehow clicked while invalid, reveal all errors
              const e = validatePayForm(payForm);
              if (Object.keys(e).length) {
                setTouched({
                  cardName: true, cardNumber: true, exp: true, cvv: true,
                  country: true, address: true, city: true, phone: true,
                });
                setErrors(e);
                alert("Please complete all payment fields correctly.");
                return;
              }
              handleMakePayment();
            }}
          >
            Make Payment
          </button>

          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SeekrPay;
//MAIN.