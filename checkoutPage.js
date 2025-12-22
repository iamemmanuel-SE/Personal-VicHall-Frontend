import "./seekrPay.css";

const SeekrPay = () => {
  return (
    <div className="seekr-page">
      {/* Header */}
      <header className="seekr-header">
        <button className="back-btn">←</button>
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
              src="https://images.unsplash.com/photo-1524777313293-86d2ab467344"
              alt="event"
            />
            <div>
              <h2>Step into Christmas</h2>
              <p>Sun, 3 May 2026, 19:00</p>
              <p>O2 City Hall Newcastle, Newcastle Upon Tyne</p>
            </div>
          </div>

          {/* Ticket details */}
          <div className="ticket-card">
            <div className="block">
              <small>TICKET TYPE</small>
              <p>Full Priced Ticket</p>
            </div>

            <hr />

            <div className="block">
              <small>SECTION</small>
              <p>Ticket</p>
            </div>

            <hr />

            <div className="category">
              <span>Child</span>
              <div className="counter">
                <button>-</button>
                <span>2</span>
                <button>+</button>
              </div>
            </div>

            <div className="category">
              <span>Senior</span>
              <div className="counter">
                <button>-</button>
                <span>2</span>
                <button>+</button>
              </div>
            </div>

            <div className="category">
              <span>Adult</span>
              <div className="counter">
                <button>-</button>
                <span>2</span>
                <button>+</button>
              </div>
            </div>

            <hr />

            <div className="cost">
              <span>Ticket x 3</span>
              <span>£48.73</span>
            </div>

            <div className="cost">
              <span>Discount Type | children |</span>
              <span>-£10.73</span>
            </div>

            <div className="cost total">
              <span>Total</span>
              <span>£38.00</span>
            </div>

            <button className="pay-btn">Make Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekrPay;
