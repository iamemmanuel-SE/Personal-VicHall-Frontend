import "./ticketConfirm.css";

const TicketConfirmation = () => {
  return (
    <div className="seekr-page ticket-page">
      {/* Header */}
      <header className="seekr-header ticket-header">
        <button className="back-btn" onClick={() => window.history.back()}>
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
              <small className="ticket-label">TICKET ID</small>
              <div className="ticket-value">0120034399434</div>
            </div>

            <div className="ticket-meta-col right">
              <small className="ticket-label">TICKET ID</small>
              <div className="ticket-value">£38.00</div>
            </div>

            <div className="ticket-meta-col wide">
              <small className="ticket-label">TICKET ID</small>
              <div className="ticket-value">19 Jun 2025 | 10:15</div>
            </div>
          </div>

          <div className="ticket-payrow">
            <div className="mc-icon" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="payrow-text">
              <div className="payrow-name">Liana Tudakova</div>
              <div className="payrow-mask">•••• 8237</div>
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
