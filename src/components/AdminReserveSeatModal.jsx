import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import styles from "./AdminReserveSeatModal.module.css";


function clampInt(v, min, max) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return "";
  return Math.max(min, Math.min(max, n));
}

export default function AdminReserveSeatModal({
  open,
  onClose,
  event,
  onReserve, // async ({ row, from, to, section }) => void
}) {
  const [row, setRow] = useState("C");
  const [fromSeat, setFromSeat] = useState(24);
  const [toSeat, setToSeat] = useState(28);
  const [section, setSection] = useState("STALLS");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
  
    const sec = String(section || "").toUpperCase();
    const rows = Object.keys(SECTION_SEATS[sec] || {});
  
    // If current row isn't valid for this section, set to the first valid row
    if (rows.length && !rows.includes(String(row || "").toUpperCase())) {
      const firstRow = rows[0];
      setRow(firstRow);
  
      const seats = SECTION_SEATS[sec][firstRow] || [];
      if (seats.length) setFromSeat(seats[0]); // pick first valid seat
      return;
    }
  
    // If current seat isn't valid for this section+row, set to first valid seat
    const seats = SECTION_SEATS?.[sec]?.[String(row || "").toUpperCase()] || [];
    if (seats.length && !seats.includes(Number(fromSeat))) {
      setFromSeat(seats[0]);
    }
  }, [open, section, row, fromSeat]);
  

  // reset when opening / event changes
  useEffect(() => {
    if (!open) return;
    setRow("C");
    setFromSeat(24);
    setToSeat(28);
    setSection("STALLS");
    setSubmitting(false);
  }, [open, event?._id]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

      //Section -> Rows -> Seat numbers (exactly as you described)
    const SECTION_SEATS = {
      STALLS: {
        A: [30, 31],
        B: [1, 2],
      },
      LBAL: {
        A: [4, 2, 3],
      },
      RBAL: {
        A: [5, 3, 4],
      },
      BAL: {
        H: [2, 1],
      },
    };

    // available rows for the currently selected section
    const availableRows = useMemo(() => {
      const sec = String(section || "").toUpperCase();
      return Object.keys(SECTION_SEATS[sec] || {});
    }, [section]);

    // available seats for the currently selected section + row
    const availableSeats = useMemo(() => {
      const sec = String(section || "").toUpperCase();
      const r = String(row || "").toUpperCase();
      return SECTION_SEATS?.[sec]?.[r] || [];
    }, [section, row]);


  const previewText = useMemo(() => {
    const r = (row || "").toString().trim().toUpperCase();
    const f = Number(fromSeat);
    const valid = r && Number.isFinite(f) && f >= 1;
  
    if (!valid) return `${section} —`;
    return `${section} ${r}${f}`;
  }, [row, fromSeat, section]);
  


  const VALID_SEATS = [5, 4, 3, 2, 30, 31, 1];

  const canSubmit = useMemo(() => {
    const sec = String(section || "").toUpperCase();
    const r = String(row || "").trim().toUpperCase();
    const seats = SECTION_SEATS?.[sec]?.[r] || [];
  
    return (
      r.length === 1 &&
      /[A-Za-z]/.test(r) &&
      seats.includes(Number(fromSeat)) &&
      sec &&
      !submitting
    );
  }, [row, fromSeat, section, submitting]);
  

  if (!open) return null;

  

  const handleReserve = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onReserve?.({
        row: row.trim().toUpperCase(),
        from: Number(fromSeat),
        to: Number(toSeat),
        section,
      });
      onClose?.();
    } catch (e) {
      // keep it simple: show a basic alert (swap to toast later)
      alert(e?.message || "Failed to reserve seats");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      {/* click outside closes */}
      <button className={styles.backdrop} onClick={onClose} aria-label="Close modal" />

      <div className={styles.modal}>
        <div className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={onClose} aria-label="Back">
            <ArrowLeft size={26} />
          </button>

          {/* <h2 className={styles.title}>Reserve Seats</h2> */}
          <div className={styles.headerSpacer} />
        </div>

        <div className={styles.content}>
          {/* Event hero card */}
          <div className={styles.heroCard}>
            <div className={styles.heroImageWrap}>
              <img
                className={styles.heroImage}
                src={event?.imageUrl || event?.image || "/placeholder-event.jpg"}
                alt={event?.title || "Event"}
              />
            </div>

            <div className={styles.heroInfo}>
              <div className={styles.heroName}>{event?.title || "Step Into Christmas"}</div>
              <div className={styles.heroMeta}>
                {event?.dateText || "Sun, 3 May 2026, 19:00"}
                <br />
                {event?.venueText || "O2 City Hall Newcastle, Newcastle Upon Tyne"}
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className={styles.formCard}>
            <div className={styles.formTitle}>Reserve Seat</div>

            {/* Row (dropdown) */}
            <div className={styles.fieldRow}>
              <div className={styles.label}>Row</div>
              <select
                className={styles.select}
                value={row}
                onChange={(e) => setRow(e.target.value.slice(0, 1))}
              >
                {availableRows.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

            </div>

            {/* Seat from (dropdown) */}
       {/* Seat (dropdown) */}
        <div className={styles.fieldRow}>
          <div className={styles.label}>Seat</div>
          <select
            className={styles.select}
            value={fromSeat}
            onChange={(e) => setFromSeat(clampInt(e.target.value, 1, 999))}
          >
            {availableSeats.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

        </div>


            {/* Seat to (dropdown)
            <div className={styles.fieldRow}>
              <div className={styles.label}>Seat to</div>
              <select
                className={styles.select}
                value={toSeat}
                onChange={(e) => setToSeat(clampInt(e.target.value, 1, 999))}
              >
                {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div> */}

            {/* Section (dropdown) */}
            <div className={styles.fieldRow}>
              <div className={styles.label}>Section</div>
              <select
                className={styles.select}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                {["STALLS", "LBAL", "RBAL", "BAL"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

            </div>

            {/* Preview (own line) */}
            <div className={styles.previewRow}>
              <div className={styles.label}>Preview</div>
              <div className={styles.previewText}>{previewText}</div>
            </div>

            {/* Button (full width, no scroll needed) */}
            <button
              type="button"
              className={styles.reserveBtn}
              onClick={handleReserve}
              disabled={!canSubmit}
            >
              {submitting ? "Reserving..." : "Reserve Seat"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
