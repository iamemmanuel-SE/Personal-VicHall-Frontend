// TheatreMap.jsx
import { useEffect, useRef, useMemo, useState } from "react";
import "./theatreMap.css";

export default function TheatreMap({ onSeatSelect, mapApiRef, maxSeats = Infinity, reservedSeats = [] }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);

  //multi-select + tooltip
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [tooltip, setTooltip] = useState(null); // { x, y, text }

  // progressive detail
  const [mode, setMode] = useState("sections"); // "sections" | "seats"
  const SEATS_ZOOM_THRESHOLD = 2.2;

  // zoom/pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const seatKey = (s) => `${s.section}-${s.row}-${s.seat}`;

      // reserved seats lookup (fast)
    const reservedSet = useMemo(() => {
      const arr = Array.isArray(reservedSeats) ? reservedSeats : [];
      return new Set(
        arr.map((s) => {
          const sec = String(s.section || "").toUpperCase();
          const r = String(s.row || "").toUpperCase();
          const n = Number(s.seat);
          return `${sec}-${r}-${n}`;
        })
      );
    }, [reservedSeats]);

    const isReserved = (seat) =>
      reservedSet.has(
        `${String(seat.section || "").toUpperCase()}-${String(seat.row || "").toUpperCase()}-${Number(seat.seat)}`
      );


  const isSeatCircle = (el) =>
    el &&
    el.tagName === "circle" &&
    el.dataset &&
    el.dataset.section &&
    el.dataset.row &&
    el.dataset.seat;

  // convert mouse point -> SVG viewBox coords
  const getSvgPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const vbW = 1472;
    const vbH = 1050;

    return {
      x: ((clientX - rect.left) / rect.width) * vbW,
      y: ((clientY - rect.top) / rect.height) * vbH,
    };
  };

  

  // zoom towards a specific viewBox point
  const zoomToPoint = (pt, nextZoom) => {
    setZoom((currentZoom) => {
      const nz = nextZoom;

      const contentX = (pt.x - pan.x) / currentZoom;
      const contentY = (pt.y - pan.y) / currentZoom;

      const newPanX = pt.x - contentX * nz;
      const newPanY = pt.y - contentY * nz;

      setPan({ x: newPanX, y: newPanY });

      if (nz >= SEATS_ZOOM_THRESHOLD) setMode("seats");
      if (nz < SEATS_ZOOM_THRESHOLD) setMode("sections");

      return nz;
    });
  };

  // zoom into a section group when clicked
  const zoomToElement = (element, desiredZoom = 3.2) => {
    try {
      const bbox = element.getBBox();
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      const vbW = 1472;
      const vbH = 1050;

      const z = Math.min(6, Math.max(1, desiredZoom));
      const newPanX = vbW / 2 - cx * z;
      const newPanY = vbH / 2 - cy * z;

      setZoom(z);
      setPan({ x: newPanX, y: newPanY });
      setMode("seats");
    } catch (e) {
      // ignore
    }
  };

  // expose API for parent buttons
  useEffect(() => {
    if (!mapApiRef) return;

    mapApiRef.current = {
      zoomIn: () =>
        zoomToPoint({ x: 736, y: 525 }, Math.min(6, +(zoom + 0.25).toFixed(2))),
      zoomOut: () =>
        zoomToPoint({ x: 736, y: 525 }, Math.max(1, +(zoom - 0.25).toFixed(2))),
      reset: () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setMode("sections");

        // clear state + DOM selection marks
        setSelectedSeats([]);
        onSeatSelect?.([]); 

        const svg = svgRef.current;
        if (svg) {
          svg.querySelectorAll('circle[data-selected="true"]').forEach((c) => {
            c.removeAttribute("data-selected");
          });
        }

        setTooltip(null);
      },
      
      showSeats: () => setMode("seats"),
      showSections: () => setMode("sections"),

      setSelectedSeats: (nextSeats) => {
        setSelectedSeats(Array.isArray(nextSeats) ? nextSeats : []);
      },
  
      //NEW: parent can remove one seat and map updates
      removeSeat: (seatToRemove) => {
        setSelectedSeats((prev) =>
          prev.filter(
            (s) =>
              !(
                s.section === seatToRemove.section &&
                s.row === seatToRemove.row &&
                s.seat === seatToRemove.seat
              )
          )
        );
      },
    
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapApiRef, zoom, pan, mode]);

  // keep DOM data-selected in sync (useful after rerenders)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // clear all
    svg.querySelectorAll('circle[data-selected="true"]').forEach((c) => {
      c.removeAttribute("data-selected");
    });

    // re-apply for selectedSeats
    selectedSeats.forEach((s) => {
      const selector = `circle[data-section="${s.section}"][data-row="${s.row}"][data-seat="${s.seat}"]`;
      const el = svg.querySelector(selector);
      if (el) el.setAttribute("data-selected", "true");
    });
  }, [selectedSeats]);

      // mark reserved seats in the SVG DOM so they are styled + blocked
      useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
      
        // clear previous reserved marks
        svg.querySelectorAll('circle[data-reserved="true"]').forEach((c) => {
          c.removeAttribute("data-reserved");
          if (c.dataset.status === "reserved") c.dataset.status = "available";
        });
      
        // mark all reserved seats
        reservedSet.forEach((key) => {
          const [section, row, seatNumStr] = key.split("-");
          const seatNum = Number(seatNumStr);
      
          // grab circles that match section + row, then compare seat as Number()
          const candidates = svg.querySelectorAll(
            `circle[data-section="${section}"][data-row="${row}"]`
          );
      
          candidates.forEach((el) => {
            if (Number(el.dataset.seat) === seatNum) {
              el.setAttribute("data-reserved", "true");
              el.dataset.status = "reserved";
            }
          });
        });
      }, [reservedSet]);
      


  // click handler (sections -> zoom OR seats multi-select)
  const handleSvgClick = (e) => {
    const el = e.target;

    // sections → seats transition
    const sectionHit = el?.closest?.('[data-map="section"]');
    if (mode === "sections" && sectionHit) {
      zoomToElement(sectionHit, 3.2);
      return;
    }

    // seat selection only in seats mode
    if (mode !== "seats") return;
    if (!isSeatCircle(el)) return;

    const { section, row, seat, status, price, currency} = el.dataset;
    if (!section || !row || !seat) return;
    if (status === "unavailable" || status === "reserved") return;

    const seatObj = { 
        section, 
        row, 
        seat, 
        status: status || "available",
        price: price != null && price !== "" ? Number(price) : 0,
        currency: currency || "£",
     };
    const key = seatKey(seatObj);

    setSelectedSeats((prev) => {
      const exists = prev.some((s) => seatKey(s) === key);

      // remove if exists
      if (exists) {
        const next = prev.filter((s) => seatKey(s) !== key);
        onSeatSelect?.(next);
        return next;
      }

      // enforce max
      if (prev.length >= maxSeats) return prev;

      const next = [...prev, seatObj];
      onSeatSelect?.(next);
      return next;
    });
  };

  //wheel zoom (towards mouse)
  const handleWheel = (e) => {
    e.preventDefault();
    const pt = getSvgPoint(e.clientX, e.clientY);

    const dir = e.deltaY > 0 ? -1 : 1;
    const next = zoom + dir * 0.18;
    const nextZoom = Math.min(6, Math.max(1, +next.toFixed(2)));

    zoomToPoint(pt, nextZoom);
  };

  // drag pan
  const onMouseDown = (e) => {
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startPanX = pan.x;
    dragRef.current.startPanY = pan.y;
  };

  const onMouseMovePan = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({
      x: dragRef.current.startPanX + dx,
      y: dragRef.current.startPanY + dy,
    });
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
  };

  // tooltip helpers
  const getSeatFromTarget = (target) => {
    const circle = target?.closest?.('circle[data-section]');
    if (!circle) return null;

    const { section, row, seat, status, price, currency } = circle.dataset || {};
    if (!section || !row || !seat) return null;

    return { 
        circle, 
        section,
        row, 
        seat, 
        status: status || "available",
        price: price ? Number(price) : null,
        currency: currency || "£", 
    };
  };

  const showTooltipAtMouse = (e, seat) => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const priceText =
    seat.price != null ? ` • £${seat.price.toFixed(2)}` : "";

    const text = `${seat.section} • Row ${seat.row} • Seat ${seat.seat}${priceText}${
      seat.status === "reserved"
      ? " (Reserved)"
      : seat.status === "unavailable"
      ? " (Unavailable)"
      : ""
    
      }`;

    setTooltip({ x, y, text });
  };

  const handleMouseMoveHover = (e) => {
    // only show tooltips when in seats mode
    if (mode !== "seats") {
      if (tooltip) setTooltip(null);
      return;
    }

    const seat = getSeatFromTarget(e.target);
    if (!seat) {
      if (tooltip) setTooltip(null);
      return;
    }

    showTooltipAtMouse(e, seat);
  };

  const handleMouseLeaveSvg = () => {
    setTooltip(null);
  };

  return (
    <div className="mapWrap" ref={wrapRef}>
      {tooltip && (
        <div className="seatTooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

    
      <svg
        ref={svgRef}
        className="theatreSvg"
        width="1472"
        height="1050"
        viewBox="0 0 1472 1050"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        data-mode={mode}
        onClick={handleSvgClick}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        // onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        // onMouseLeave={endDrag}
        // onMouseMove={handleMouseMoveHover}
        // onMouseLeave={handleMouseLeaveSvg}
        onMouseMove={(e) => {
            onMouseMovePan(e);          // pan if dragging
            handleMouseMoveHover(e); // tooltip hover
          }}
          onMouseLeave={(e) => {
            endDrag();
            handleMouseLeaveSvg();
          }}
          

      >
        {/* Apply zoom/pan to everything */}
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          
        
        

          {/* =========================
              2) SEATS layer (details)
             ========================= */}
          <g id="LAYER_SEATS" className="layer layer--seats">
            {/* PUT YOUR EXISTING: StageBase + stage + seats circles here
                (or only seats if you prefer)
            */}
            <g id="StageBase">
                <path id="stageBase" d="M16 138.5L131.5 13H695.5L1456 201V844L695.5 1037H131.5L16 908.5V138.5Z" fill="#D8D8D8"/>
                <rect id="LBase" x="166" y="841" width="469" height="182" fill="white"/>
                <path id="Bfront" d="M1244.5 239H1440V797H1236.5L1176 662.352L1189.44 634.976V405.907L1170 373L1244.5 239Z" fill="white"/>
                <rect id="Rbase" x="166" y="29" width="469" height="182" fill="white"/>
                <rect id="stallsBase" x="300" y="232" width="870" height="586" fill="white"/>
                </g>

                <g id="stage">
                <rect width="265" height="586" transform="translate(31 232)" fill="#A6A6A6"/>
                <text
                id="STAGE"
                transform="matrix(0 -1 1 0 103 691)"
                fill="white"
                xmlSpace="preserve"                 
                style={{ whiteSpace: "pre" }}       
                fontFamily="Inter"                  
                fontSize="100"                      
                fontWeight="bold"                   
                letterSpacing="0em"                
                >
                <tspan x="0" y="96.8636">STAGE</tspan>
                </text>

            </g>

            <g id="seats">
                <circle id="RBAL_A_05"
                data-section="RBAL"
                data-row="A"
                data-seat="05"
                data-price="28.73" 
                cx="194" cy="81" r="6" fill="#2648CE"/>
                <circle id="RBAL_A_04"
                data-section="RBAL"
                data-row="A"
                data-seat="04"
                data-status="available"
                data-price="28.73"  
                cx="194" cy="107" r="6" fill="#2648CE"/>
                <circle id="RBAL_A_03"
                data-section="RBAL"
                data-row="A"
                data-seat="03"
                data-status="available"
                data-price="28.73"  
                cx="194" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 26" cx="209" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 54" cx="209" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 82" cx="209" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 110" cx="209" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 228" cx="208.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 27" cx="224" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 55" cx="224" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 83" cx="224" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 111" cx="224" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 220" cx="223.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 205" cx="223.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 28" cx="239" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 56" cx="239" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 84" cx="239" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 112" cx="239" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 229" cx="238.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 217" cx="238.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 29" cx="254" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 57" cx="254" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 85" cx="254" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 245" cx="253.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 239" cx="253.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 203" cx="253.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 30" cx="269" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 58" cx="269" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 86" cx="269" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 246" cx="268.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 235" cx="268.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 219" cx="268.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 31" cx="284" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 59" cx="284" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 87" cx="284" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 115" cx="284" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 238" cx="283.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 202" cx="283.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 32" cx="299" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 60" cx="299" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 88" cx="299" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 116" cx="299" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 230" cx="298.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 206" cx="298.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 33" cx="314" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 61" cx="314" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 89" cx="314" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 117" cx="314" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 232" cx="313.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 211" cx="313.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 34" cx="329" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 62" cx="329" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 90" cx="329" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 118" cx="329" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 233" cx="328.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 198" cx="328.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 35" cx="344" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 63" cx="344" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 91" cx="344" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 119" cx="344" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 237" cx="343.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 209" cx="343.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 247" cx="358.5" cy="54.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 64" cx="359" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 250" cx="358.5" cy="106.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 249" cx="358.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 252" cx="358.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 201" cx="358.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 194" cx="373.5" cy="54.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 65" cx="374" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 251" cx="373.5" cy="106.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 253" cx="373.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 248" cx="373.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 208" cx="373.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 39" cx="404" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 67" cx="404" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 95" cx="404" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 271" cx="403.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 240" cx="403.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 212" cx="403.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 40" cx="419" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 68" cx="419" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 96" cx="419" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 272" cx="418.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 226" cx="418.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 200" cx="418.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 41" cx="434" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 69" cx="434" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 97" cx="434" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 273" cx="433.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 241" cx="433.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 213" cx="433.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 42" cx="449" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 70" cx="449" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 98" cx="449" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 274" cx="448.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 225" cx="448.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 199" cx="448.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 43" cx="464" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 71" cx="464" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 99" cx="464" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 275" cx="463.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 227" cx="463.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 214" cx="463.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 44" cx="479" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 72" cx="479" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 100" cx="479" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 128" cx="479" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 224" cx="478.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 197" cx="478.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 45" cx="494" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 73" cx="494" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 101" cx="494" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 129" cx="494" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 242" cx="493.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 215" cx="493.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 46" cx="509" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 74" cx="509" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 102" cx="509" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 130" cx="509" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 221" cx="508.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 196" cx="508.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 47" cx="524" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 259" cx="523.5" cy="80.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 277" cx="524" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 260" cx="524" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 236" cx="523.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 216" cx="523.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 48" cx="539" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 76" cx="539" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 104" cx="539" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 132" cx="539" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 223" cx="538.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 204" cx="538.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 49" cx="554" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 77" cx="554" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 105" cx="554" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 133" cx="554" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 243" cx="553.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 218" cx="553.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 50" cx="569" cy="55" r="6" fill="#2648CE"/>
            <circle id="Ellipse 78" cx="569" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 276" cx="568.5" cy="106.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 134" cx="569" cy="133" r="6" fill="#2648CE"/>
            <circle id="Ellipse 222" cx="568.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 195" cx="568.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 254" cx="583.5" cy="54.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 79" cx="584" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 107" cx="584" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 256" cx="583.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 244" cx="583.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 207" cx="583.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 255" cx="598.5" cy="54.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 80" cx="599" cy="81" r="6" fill="#2648CE"/>
            <circle id="Ellipse 108" cx="599" cy="107" r="6" fill="#2648CE"/>
            <circle id="Ellipse 257" cx="598.5" cy="132.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 193" cx="598.5" cy="158.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 210" cx="598.5" cy="184.5" r="5.5" fill="#B7B7B7"/>
            <circle id="LBAL_A_04"
                data-section="LBAL"
                data-row="A"
                data-seat="04"
                data-status="available"
                data-price="28.73" 
                cx="194" cy="919" r="6" fill="#2648CE"/>
            <circle id="LBAL_A_03"
                data-section="LBAL"
                data-row="A"
                data-seat="03"
                data-status="available"
                data-price="38.73" 
                cx="194" cy="945" r="6" fill="#2648CE"/>
            <circle id="LBAL_A_02"
                data-section="LBAL"
                    data-row="A"
                    data-seat="02"
                    data-status="available"
                    data-price="28.73" 
                cx="194" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 54_2" cx="209" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 82_2" cx="209" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 110_2" cx="209" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 297" cx="209" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 55_2" cx="224" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 83_2" cx="224" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 111_2" cx="224" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 307" cx="224" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 205_2" cx="223.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 283" cx="238.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 56_2" cx="239" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 84_2" cx="239" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 112_2" cx="239" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 308" cx="239" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 217_2" cx="238.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 284" cx="253.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 57_2" cx="254" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 85_2" cx="254" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 245_2" cx="253.5" cy="944.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 303" cx="254" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 203_2" cx="253.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 281" cx="268.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 58_2" cx="269" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 294" cx="268.5" cy="918.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 246_2" cx="268.5" cy="944.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 306" cx="269" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 219_2" cx="268.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 280" cx="283.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 287" cx="283.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 295" cx="283.5" cy="918.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 115_2" cx="284" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 301" cx="284" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 202_2" cx="283.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 285" cx="298.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 289" cx="298.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 88_2" cx="299" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 116_2" cx="299" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 304" cx="299" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 206_2" cx="298.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 278" cx="313.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 290" cx="313.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 89_2" cx="314" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 117_2" cx="314" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 300" cx="314" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 211_2" cx="313.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 279" cx="328.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 292" cx="328.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 90_2" cx="329" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 118_2" cx="329" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 305" cx="329" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 198_2" cx="328.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 277_2" cx="343.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 291" cx="343.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 91_2" cx="344" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 119_2" cx="344" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 299" cx="344" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 209_2" cx="343.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 247_2" cx="358.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 293" cx="358.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 250_2" cx="358.5" cy="918.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 249_2" cx="358.5" cy="944.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 302" cx="359" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 201_2" cx="358.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 194_2" cx="373.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 288" cx="373.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 251_2" cx="373.5" cy="918.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 253_2" cx="373.5" cy="944.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 298" cx="374" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 208_2" cx="373.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 359" cx="403.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 366" cx="403.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 346" cx="403.5" cy="918.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 338" cx="404" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 333" cx="404" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 317" cx="404" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 356" cx="418.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 365" cx="418.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 347" cx="418.5" cy="918.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 340" cx="419" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 332" cx="419" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 319" cx="419" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 358" cx="433.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 368" cx="433.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 97_2" cx="434" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 339" cx="434" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 334" cx="434" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 311" cx="434" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 351" cx="448.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 367" cx="448.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 98_2" cx="449" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 342" cx="449" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 328" cx="449" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 318" cx="449" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 357" cx="463.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 371" cx="463.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 99_2" cx="464" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 341" cx="464" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 335" cx="464" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 315" cx="464" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 354" cx="478.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 369" cx="478.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 100_2" cx="479" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 128_2" cx="479" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 329" cx="479" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 309" cx="479" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 353" cx="493.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 372" cx="493.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 101_2" cx="494" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 129_2" cx="494" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 336" cx="494" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 312" cx="494" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 350" cx="508.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 370" cx="508.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 102_2" cx="509" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 130_2" cx="509" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 326" cx="509" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 316" cx="509" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 355" cx="523.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 360" cx="524" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 362" cx="524" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 260_2" cx="524" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 331" cx="524" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 320" cx="524" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 349" cx="538.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 76_2" cx="539" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 104_2" cx="539" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 132_2" cx="539" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 325" cx="539" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 310" cx="539" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 352" cx="553.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 77_2" cx="554" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 105_2" cx="554" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 133_2" cx="554" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 327" cx="554" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 321" cx="554" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 348" cx="568.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 78_2" cx="569" cy="893" r="6" fill="#2648CE"/>
            <circle id="Ellipse 361" cx="569" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 134_2" cx="569" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 324" cx="569" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 314" cx="569" cy="997" r="6" fill="#2648CE"/>
            <circle id="Ellipse 254_2" cx="583.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 363" cx="583.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 107_2" cx="584" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 343" cx="584" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 330" cx="584" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 345" cx="583.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 255_2" cx="598.5" cy="866.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 364" cx="598.5" cy="892.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 108_2" cx="599" cy="919" r="6" fill="#2648CE"/>
            <circle id="Ellipse 337" cx="599" cy="945" r="6" fill="#2648CE"/>
            <circle id="Ellipse 323" cx="599" cy="971" r="6" fill="#2648CE"/>
            <circle id="Ellipse 344" cx="598.5" cy="996.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362" cx="1119.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363" cx="1071.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364" cx="1072" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365" cx="1096" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366" cx="1096" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367" cx="1119.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368" cx="1072" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369" cx="1096" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370" cx="1119.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371" cx="1071.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372" cx="1096" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373" cx="1119.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374" cx="1071.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375" cx="1096" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376" cx="1119.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377" cx="1071.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378" cx="1096" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379" cx="1119.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380" cx="1071.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381" cx="1096" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382" cx="1119.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383" cx="1071.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384" cx="1095.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385" cx="1119.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386" cx="1071.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387" cx="1095.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388" cx="1119.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389" cx="1071.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390" cx="1095.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391" cx="1119.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392" cx="1071.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393" cx="1095.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394" cx="1119.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395" cx="1071.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396" cx="1095.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397" cx="1119.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398" cx="1071.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399" cx="1095.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400" cx="1119.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401" cx="1071.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402" cx="1095.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403" cx="1119.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404" cx="1071.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405" cx="1095.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406" cx="1119.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407" cx="1071.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408" cx="1095.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409" cx="1119.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410" cx="1071.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411" cx="1095.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412" cx="1119.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413" cx="1071.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414" cx="1095.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415" cx="1119.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416" cx="1071.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417" cx="1095.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418" cx="1119.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419" cx="1071.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420" cx="1095.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421" cx="1119.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422" cx="1071.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423" cx="1095.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424" cx="1119.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425" cx="1071.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426" cx="1095.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427" cx="1119.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428" cx="1071.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429" cx="1095.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430" cx="1119.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431" cx="1071.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432" cx="1095.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433" cx="1119.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434" cx="1071.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435" cx="1095.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436" cx="1119.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437" cx="1071.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438" cx="1095.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439" cx="1119.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440" cx="1071.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441" cx="1095.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442" cx="1119.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443" cx="1071.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444" cx="1095.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445" cx="1119.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446" cx="1071.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447" cx="1095.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448" cx="1119.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449" cx="1071.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450" cx="1095.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451" cx="1119.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452" cx="1071.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453" cx="1096" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454" cx="1119.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455" cx="1071.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456" cx="1096" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457" cx="1119.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_2" cx="1047.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_2" cx="999.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_2" cx="1000" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_2" cx="1024" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_2" cx="1024" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_2" cx="1047.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_2" cx="1000" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_2" cx="1024" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_2" cx="1047.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_2" cx="999.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_2" cx="1024" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_2" cx="1047.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_2" cx="999.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_2" cx="1024" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_2" cx="1047.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_2" cx="999.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_2" cx="1024" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_2" cx="1047.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_2" cx="999.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_2" cx="1024" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_2" cx="1047.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_2" cx="999.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_2" cx="1023.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_2" cx="1047.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_2" cx="999.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_2" cx="1023.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_2" cx="1047.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_2" cx="999.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_2" cx="1023.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_2" cx="1047.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_2" cx="999.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_2" cx="1023.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_2" cx="1047.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_2" cx="999.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_2" cx="1023.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_2" cx="1047.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_2" cx="999.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_2" cx="1023.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_2" cx="1047.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_2" cx="999.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_2" cx="1023.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_2" cx="1047.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_2" cx="999.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_2" cx="1023.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_2" cx="1047.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_2" cx="999.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_2" cx="1023.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_2" cx="1047.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_2" cx="999.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_2" cx="1023.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_2" cx="1047.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_2" cx="999.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_2" cx="1023.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_2" cx="1047.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_2" cx="999.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_2" cx="1023.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_2" cx="1047.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_2" cx="999.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_2" cx="1023.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_2" cx="1047.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_2" cx="999.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_2" cx="1023.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_2" cx="1047.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_2" cx="999.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_2" cx="1023.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_2" cx="1047.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_2" cx="999.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_2" cx="1023.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_2" cx="1047.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_2" cx="999.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_2" cx="1023.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_2" cx="1047.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_2" cx="999.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_2" cx="1023.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_2" cx="1047.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_2" cx="999.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_2" cx="1023.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_2" cx="1047.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_2" cx="999.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_2" cx="1023.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_2" cx="1047.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_2" cx="999.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_2" cx="1023.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_2" cx="1047.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_2" cx="999.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_2" cx="1023.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_2" cx="1047.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_2" cx="999.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_2" cx="1023.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_2" cx="1047.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_2" cx="999.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_2" cx="1024" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_2" cx="1047.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_2" cx="999.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_2" cx="1024" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_2" cx="1047.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_3" cx="975.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_3" cx="927.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_3" cx="928" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_3" cx="952" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_3" cx="952" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_3" cx="975.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_3" cx="928" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_3" cx="952" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_3" cx="975.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_3" cx="927.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_3" cx="952" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_3" cx="975.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_3" cx="927.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_3" cx="952" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_3" cx="975.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_3" cx="927.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_3" cx="952" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_3" cx="975.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_3" cx="927.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_3" cx="952" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_3" cx="975.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_3" cx="927.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_3" cx="951.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_3" cx="975.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_3" cx="927.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_3" cx="951.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_3" cx="975.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_3" cx="927.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_3" cx="951.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_3" cx="975.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_3" cx="927.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_3" cx="951.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_3" cx="975.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_3" cx="927.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_3" cx="951.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_3" cx="975.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_3" cx="927.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_3" cx="951.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_3" cx="975.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_3" cx="927.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_3" cx="951.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_3" cx="975.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_3" cx="927.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_3" cx="951.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_3" cx="975.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_3" cx="927.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_3" cx="951.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_3" cx="975.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_3" cx="927.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_3" cx="951.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_3" cx="975.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_3" cx="927.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_3" cx="951.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_3" cx="975.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_3" cx="927.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_3" cx="951.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_3" cx="975.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_3" cx="927.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_3" cx="951.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_3" cx="975.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_3" cx="927.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_3" cx="951.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_3" cx="975.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_3" cx="927.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_3" cx="951.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_3" cx="975.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_3" cx="927.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_3" cx="951.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_3" cx="975.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_3" cx="927.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_3" cx="951.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_3" cx="975.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_3" cx="927.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_3" cx="951.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_3" cx="975.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_3" cx="927.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_3" cx="951.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_3" cx="975.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_3" cx="927.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_3" cx="951.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_3" cx="975.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_3" cx="927.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_3" cx="951.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_3" cx="975.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_3" cx="927.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_3" cx="951.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_3" cx="975.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_3" cx="927.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_3" cx="951.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_3" cx="975.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_3" cx="927.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_3" cx="952" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_3" cx="975.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_3" cx="927.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_3" cx="952" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_3" cx="975.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_4" cx="903.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_4" cx="855.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_4" cx="856" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_4" cx="880" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_4" cx="880" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_4" cx="903.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_4" cx="856" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_4" cx="880" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_4" cx="903.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_4" cx="855.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_4" cx="880" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_4" cx="903.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_4" cx="855.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_4" cx="880" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_4" cx="903.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_4" cx="855.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_4" cx="880" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_4" cx="903.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_4" cx="855.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_4" cx="880" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_4" cx="903.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_4" cx="855.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_4" cx="879.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_4" cx="903.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_4" cx="855.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_4" cx="879.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_4" cx="903.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_4" cx="855.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_4" cx="879.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_4" cx="903.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_4" cx="855.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_4" cx="879.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_4" cx="903.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_4" cx="855.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_4" cx="879.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_4" cx="903.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_4" cx="855.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_4" cx="879.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_4" cx="903.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_4" cx="855.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_4" cx="879.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_4" cx="903.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_4" cx="855.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_4" cx="879.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_4" cx="903.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_4" cx="855.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_4" cx="879.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_4" cx="903.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_4" cx="855.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_4" cx="879.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_4" cx="903.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_4" cx="855.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_4" cx="879.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_4" cx="903.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_4" cx="855.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_4" cx="879.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_4" cx="903.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_4" cx="855.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_4" cx="879.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_4" cx="903.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_4" cx="855.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_4" cx="879.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_4" cx="903.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_4" cx="855.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_4" cx="879.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_4" cx="903.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_4" cx="855.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_4" cx="879.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_4" cx="903.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_4" cx="855.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_4" cx="879.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_4" cx="903.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_4" cx="855.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_4" cx="879.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_4" cx="903.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_4" cx="855.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_4" cx="879.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_4" cx="903.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_4" cx="855.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_4" cx="879.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_4" cx="903.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_4" cx="855.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_4" cx="879.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_4" cx="903.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_4" cx="855.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_4" cx="879.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_4" cx="903.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_4" cx="855.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_4" cx="879.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_4" cx="903.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_4" cx="855.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_4" cx="880" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_4" cx="903.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_4" cx="855.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_4" cx="880" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_4" cx="903.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_5" cx="831.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_5" cx="783.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_5" cx="784" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_5" cx="808" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_5" cx="808" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_5" cx="831.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_5" cx="784" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_5" cx="808" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_5" cx="831.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_5" cx="783.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_5" cx="808" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_5" cx="831.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_5" cx="783.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_5" cx="808" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_5" cx="831.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_5" cx="783.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_5" cx="808" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_5" cx="831.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_5" cx="783.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_5" cx="808" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_5" cx="831.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_5" cx="783.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_5" cx="807.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_5" cx="831.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_5" cx="783.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_5" cx="807.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_5" cx="831.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_5" cx="783.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_5" cx="807.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_5" cx="831.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_5" cx="783.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_5" cx="807.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_5" cx="831.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_5" cx="783.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_5" cx="807.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_5" cx="831.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_5" cx="783.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_5" cx="807.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_5" cx="831.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_5" cx="783.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_5" cx="807.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_5" cx="831.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_5" cx="783.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_5" cx="807.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_5" cx="831.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_5" cx="783.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_5" cx="807.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_5" cx="831.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_5" cx="783.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_5" cx="807.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_5" cx="831.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_5" cx="783.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_5" cx="807.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_5" cx="831.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_5" cx="783.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_5" cx="807.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_5" cx="831.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_5" cx="783.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_5" cx="807.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_5" cx="831.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_5" cx="783.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_5" cx="807.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_5" cx="831.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_5" cx="783.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_5" cx="807.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_5" cx="831.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_5" cx="783.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_5" cx="807.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_5" cx="831.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_5" cx="783.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_5" cx="807.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_5" cx="831.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_5" cx="783.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_5" cx="807.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_5" cx="831.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_5" cx="783.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_5" cx="807.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_5" cx="831.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_5" cx="783.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_5" cx="807.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_5" cx="831.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_5" cx="783.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_5" cx="807.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_5" cx="831.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_5" cx="783.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_5" cx="807.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_5" cx="831.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_5" cx="783.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_5" cx="807.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_5" cx="831.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_5" cx="783.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_5" cx="808" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_5" cx="831.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_5" cx="783.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_5" cx="808" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_5" cx="831.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_6" cx="759.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_6" cx="711.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_6" cx="712" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_6" cx="736" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_6" cx="736" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_6" cx="759.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_6" cx="712" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_6" cx="736" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_6" cx="759.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_6" cx="711.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_6" cx="736" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_6" cx="759.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_6" cx="711.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_6" cx="736" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_6" cx="759.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_6" cx="711.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_6" cx="736" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_6" cx="759.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_6" cx="711.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_6" cx="736" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_6" cx="759.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_6" cx="711.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_6" cx="735.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_6" cx="759.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_6" cx="711.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_6" cx="735.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_6" cx="759.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_6" cx="711.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_6" cx="735.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_6" cx="759.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_6" cx="711.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_6" cx="735.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_6" cx="759.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_6" cx="711.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_6" cx="735.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_6" cx="759.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_6" cx="711.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_6" cx="735.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_6" cx="759.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_6" cx="711.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_6" cx="735.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_6" cx="759.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_6" cx="711.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_6" cx="735.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_6" cx="759.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_6" cx="711.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_6" cx="735.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_6" cx="759.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_6" cx="711.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_6" cx="735.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_6" cx="759.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_6" cx="711.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_6" cx="735.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_6" cx="759.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_6" cx="711.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_6" cx="735.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_6" cx="759.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_6" cx="711.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_6" cx="735.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_6" cx="759.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_6" cx="711.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_6" cx="735.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_6" cx="759.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_6" cx="711.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_6" cx="735.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_6" cx="759.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_6" cx="711.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_6" cx="735.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_6" cx="759.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_6" cx="711.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_6" cx="735.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_6" cx="759.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_6" cx="711.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_6" cx="735.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_6" cx="759.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_6" cx="711.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_6" cx="735.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_6" cx="759.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_6" cx="711.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_6" cx="735.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_6" cx="759.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_6" cx="711.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_6" cx="735.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_6" cx="759.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_6" cx="711.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_6" cx="735.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_6" cx="759.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_6" cx="711.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_6" cx="735.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_6" cx="759.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_6" cx="711.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_6" cx="736" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_6" cx="759.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_6" cx="711.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_6" cx="736" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_6" cx="759.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_7" cx="687.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_7" cx="639.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_7" cx="640" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_7" cx="664" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_7" cx="664" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_7" cx="687.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_7" cx="640" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_7" cx="664" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_7" cx="687.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_7" cx="639.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_7" cx="664" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_7" cx="687.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_7" cx="639.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_7" cx="664" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_7" cx="687.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_7" cx="639.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_7" cx="664" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_7" cx="687.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_7" cx="639.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_7" cx="664" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_7" cx="687.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_7" cx="639.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_7" cx="663.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_7" cx="687.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_7" cx="639.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_7" cx="663.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_7" cx="687.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_7" cx="639.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_7" cx="663.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_7" cx="687.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_7" cx="639.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_7" cx="663.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_7" cx="687.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_7" cx="639.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_7" cx="663.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_7" cx="687.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_7" cx="639.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_7" cx="663.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_7" cx="687.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_7" cx="639.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_7" cx="663.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_7" cx="687.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_7" cx="639.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_7" cx="663.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_7" cx="687.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_7" cx="639.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_7" cx="663.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_7" cx="687.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_7" cx="639.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_7" cx="663.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_7" cx="687.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_7" cx="639.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_7" cx="663.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_7" cx="687.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_7" cx="639.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_7" cx="663.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_7" cx="687.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_7" cx="639.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_7" cx="663.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_7" cx="687.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_7" cx="639.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_7" cx="663.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_7" cx="687.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_7" cx="639.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_7" cx="663.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_7" cx="687.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_7" cx="639.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_7" cx="663.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_7" cx="687.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_7" cx="639.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_7" cx="663.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_7" cx="687.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_7" cx="639.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_7" cx="663.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_7" cx="687.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_7" cx="639.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_7" cx="663.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_7" cx="687.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_7" cx="639.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_7" cx="663.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_7" cx="687.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_7" cx="639.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_7" cx="663.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_7" cx="687.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_7" cx="639.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_7" cx="663.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_7" cx="687.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_7" cx="639.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_7" cx="663.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_7" cx="687.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_7" cx="639.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_7" cx="664" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_7" cx="687.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_7" cx="639.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_7" cx="664" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_7" cx="687.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_8" cx="615.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_8" cx="567.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_8" cx="568" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_8" cx="592" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_8" cx="592" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_8" cx="615.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_8" cx="568" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_8" cx="592" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_8" cx="615.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_8" cx="567.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_8" cx="592" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_8" cx="615.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_8" cx="567.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_8" cx="592" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_8" cx="615.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_8" cx="567.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_8" cx="592" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_8" cx="615.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_8" cx="567.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_8" cx="592" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_8" cx="615.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_8" cx="567.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_8" cx="591.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_8" cx="615.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_8" cx="567.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_8" cx="591.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_8" cx="615.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_8" cx="567.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_8" cx="591.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_8" cx="615.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_8" cx="567.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_8" cx="591.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_8" cx="615.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_8" cx="567.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_8" cx="591.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_8" cx="615.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_8" cx="567.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_8" cx="591.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_8" cx="615.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_8" cx="567.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_8" cx="591.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_8" cx="615.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_8" cx="567.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_8" cx="591.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_8" cx="615.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_8" cx="567.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_8" cx="591.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_8" cx="615.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_8" cx="567.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_8" cx="591.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_8" cx="615.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_8" cx="567.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_8" cx="591.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_8" cx="615.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_8" cx="567.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_8" cx="591.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_8" cx="615.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_8" cx="567.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_8" cx="591.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_8" cx="615.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_8" cx="567.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_8" cx="591.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_8" cx="615.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_8" cx="567.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_8" cx="591.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_8" cx="615.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_8" cx="567.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_8" cx="591.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_8" cx="615.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_8" cx="567.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_8" cx="591.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_8" cx="615.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_8" cx="567.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_8" cx="591.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_8" cx="615.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_8" cx="567.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_8" cx="591.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_8" cx="615.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_8" cx="567.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_8" cx="591.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_8" cx="615.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_8" cx="567.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_8" cx="591.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_8" cx="615.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_8" cx="567.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_8" cx="591.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_8" cx="615.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_8" cx="567.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_8" cx="591.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_8" cx="615.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_8" cx="567.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_8" cx="592" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_8" cx="615.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_8" cx="567.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_8" cx="592" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_8" cx="615.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_9" cx="543.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_9" cx="495.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_9" cx="496" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_9" cx="520" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_9" cx="520" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_9" cx="543.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_9" cx="496" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_9" cx="520" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_9" cx="543.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_9" cx="495.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_9" cx="520" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_9" cx="543.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_9" cx="495.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_9" cx="520" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_9" cx="543.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_9" cx="495.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_9" cx="520" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_9" cx="543.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_9" cx="495.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_9" cx="520" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_9" cx="543.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_9" cx="495.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_9" cx="519.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_9" cx="543.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_9" cx="495.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_9" cx="519.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_9" cx="543.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_9" cx="495.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_9" cx="519.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_9" cx="543.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_9" cx="495.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_9" cx="519.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_9" cx="543.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_9" cx="495.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_9" cx="519.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_9" cx="543.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_9" cx="495.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_9" cx="519.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_9" cx="543.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_9" cx="495.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_9" cx="519.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_9" cx="543.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_9" cx="495.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_9" cx="519.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_9" cx="543.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_9" cx="495.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_9" cx="519.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_9" cx="543.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_9" cx="495.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_9" cx="519.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_9" cx="543.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_9" cx="495.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_9" cx="519.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_9" cx="543.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_9" cx="495.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_9" cx="519.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_9" cx="543.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_9" cx="495.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_9" cx="519.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_9" cx="543.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_9" cx="495.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_9" cx="519.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_9" cx="543.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_9" cx="495.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_9" cx="519.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_9" cx="543.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_9" cx="495.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_9" cx="519.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_9" cx="543.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_9" cx="495.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_9" cx="519.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_9" cx="543.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_9" cx="495.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_9" cx="519.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_9" cx="543.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_9" cx="495.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_9" cx="519.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_9" cx="543.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_9" cx="495.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_9" cx="519.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_9" cx="543.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_9" cx="495.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_9" cx="519.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_9" cx="543.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_9" cx="495.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_9" cx="519.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_9" cx="543.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_9" cx="495.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_9" cx="519.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_9" cx="543.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_9" cx="495.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_9" cx="520" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_9" cx="543.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_9" cx="495.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_9" cx="520" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_9" cx="543.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_10" cx="471.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_10" cx="423.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1364_10" cx="424" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_10" cx="448" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_10" cx="448" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_10" cx="471.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1368_10" cx="424" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_10" cx="448" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_10" cx="471.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_10" cx="423.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_10" cx="448" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_10" cx="471.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_10" cx="423.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_10" cx="448" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_10" cx="471.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_10" cx="423.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_10" cx="448" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_10" cx="471.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_10" cx="423.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_10" cx="448" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_10" cx="471.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_10" cx="423.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_10" cx="447.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_10" cx="471.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_10" cx="423.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_10" cx="447.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_10" cx="471.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_10" cx="423.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_10" cx="447.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_10" cx="471.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_10" cx="423.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_10" cx="447.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_10" cx="471.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_10" cx="423.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_10" cx="447.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_10" cx="471.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_10" cx="423.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_10" cx="447.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_10" cx="471.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_10" cx="423.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_10" cx="447.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_10" cx="471.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_10" cx="423.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_10" cx="447.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_10" cx="471.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_10" cx="423.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_10" cx="447.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_10" cx="471.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_10" cx="423.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_10" cx="447.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_10" cx="471.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_10" cx="423.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_10" cx="447.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_10" cx="471.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_10" cx="423.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_10" cx="447.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_10" cx="471.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_10" cx="423.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_10" cx="447.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_10" cx="471.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_10" cx="423.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_10" cx="447.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_10" cx="471.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_10" cx="423.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_10" cx="447.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_10" cx="471.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_10" cx="423.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_10" cx="447.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_10" cx="471.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_10" cx="423.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_10" cx="447.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_10" cx="471.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_10" cx="423.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_10" cx="447.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_10" cx="471.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_10" cx="423.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_10" cx="447.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_10" cx="471.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_10" cx="423.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_10" cx="447.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_10" cx="471.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_10" cx="423.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_10" cx="447.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_10" cx="471.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_10" cx="423.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_10" cx="447.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_10" cx="471.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_10" cx="423.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_10" cx="447.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_10" cx="471.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_10" cx="423.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1453_10" cx="448" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_10" cx="471.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1455_10" cx="423.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1456_10" cx="448" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_10" cx="471.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1362_11" cx="399.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1363_11" cx="351.5" cy="278.5" r="5.5" fill="#B7B7B7"/>
            <circle id="STALLS_A_31"
                data-section="STALLS"
                data-row="A"
                data-seat="31"
                data-status="available"
                data-price="25.13" 
                cx="352" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1365_11" cx="376" cy="294" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1366_11" cx="376" cy="279" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1367_11" cx="399.5" cy="293.5" r="5.5" fill="#B7B7B7"/>
            <circle id="STALLS_A_30"
                data-section="STALLS"
                data-row="A"
                data-seat="30"
                data-status="available"
                data-price="25.13"  
                cx="352" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1369_11" cx="376" cy="309" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1370_11" cx="399.5" cy="308.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1371_11" cx="351.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1372_11" cx="376" cy="324" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1373_11" cx="399.5" cy="323.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1374_11" cx="351.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1375_11" cx="376" cy="339" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1376_11" cx="399.5" cy="338.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1377_11" cx="351.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1378_11" cx="376" cy="354" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1379_11" cx="399.5" cy="353.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1380_11" cx="351.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1381_11" cx="376" cy="369" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1382_11" cx="399.5" cy="368.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1383_11" cx="351.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1384_11" cx="375.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1385_11" cx="399.5" cy="383.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1386_11" cx="351.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1387_11" cx="375.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1388_11" cx="399.5" cy="398.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1389_11" cx="351.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1390_11" cx="375.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1391_11" cx="399.5" cy="428.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1392_11" cx="351.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1393_11" cx="375.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1394_11" cx="399.5" cy="443.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1395_11" cx="351.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1396_11" cx="375.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1397_11" cx="399.5" cy="458.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1398_11" cx="351.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1399_11" cx="375.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1400_11" cx="399.5" cy="473.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1401_11" cx="351.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1402_11" cx="375.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1403_11" cx="399.5" cy="488.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1404_11" cx="351.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1405_11" cx="375.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1406_11" cx="399.5" cy="503.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1407_11" cx="351.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1408_11" cx="375.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1409_11" cx="399.5" cy="518.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1410_11" cx="351.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1411_11" cx="375.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1412_11" cx="399.5" cy="533.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1413_11" cx="351.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1414_11" cx="375.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1415_11" cx="399.5" cy="548.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1416_11" cx="351.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1417_11" cx="375.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1418_11" cx="399.5" cy="563.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1419_11" cx="351.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1420_11" cx="375.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1421_11" cx="399.5" cy="578.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1422_11" cx="351.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1423_11" cx="375.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1424_11" cx="399.5" cy="593.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1425_11" cx="351.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1426_11" cx="375.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1427_11" cx="399.5" cy="608.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1428_11" cx="351.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1429_11" cx="375.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1430_11" cx="399.5" cy="623.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1431_11" cx="351.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1432_11" cx="375.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1433_11" cx="399.5" cy="653.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1434_11" cx="351.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1435_11" cx="375.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1436_11" cx="399.5" cy="668.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1437_11" cx="351.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1438_11" cx="375.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1439_11" cx="399.5" cy="683.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1440_11" cx="351.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1441_11" cx="375.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1442_11" cx="399.5" cy="698.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1443_11" cx="351.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1444_11" cx="375.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1445_11" cx="399.5" cy="713.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1446_11" cx="351.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1447_11" cx="375.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1448_11" cx="399.5" cy="728.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1449_11" cx="351.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1450_11" cx="375.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1451_11" cx="399.5" cy="743.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1452_11" cx="351.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="STALLS_B_02"
                data-section="STALLS"
                data-row="B"
                data-seat="02"
                data-status="available"
                data-price="25.23"   
                cx="376" cy="759" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1454_11" cx="399.5" cy="758.5" r="5.5" fill="#B7B7B7"/>
            <circle id="notAvailable" cx="351.5" cy="774.5" r="5.5" fill="#B7B7B7"/>
            <circle id="STALLS_B_01"
                    data-section="STALLS"
                    data-row="B"
                    data-seat="01"
                    data-status="available" 
                    data-price="25.23" 
                cx="376" cy="774" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1457_11" cx="399.5" cy="773.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 272_2" cx="1423.5" cy="279.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1171" cx="1375.5" cy="279.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 306_2" cx="1376" cy="295" r="6" fill="#2648CE"/>
            <circle id="Ellipse 313" cx="1400" cy="295" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1170" cx="1400" cy="280" r="6" fill="#2648CE"/>
            <circle id="Ellipse 273_2" cx="1423.5" cy="294.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 78_3" cx="1376" cy="310" r="6" fill="#2648CE"/>
            <circle id="Ellipse 311_2" cx="1400" cy="310" r="6" fill="#2648CE"/>
            <circle id="Ellipse 274_2" cx="1423.5" cy="309.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 207_2" cx="1375.5" cy="324.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 310_2" cx="1400" cy="325" r="6" fill="#2648CE"/>
            <circle id="Ellipse 275_2" cx="1423.5" cy="324.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 208_3" cx="1375.5" cy="339.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 308_2" cx="1400" cy="340" r="6" fill="#2648CE"/>
            <circle id="Ellipse 276_2" cx="1423.5" cy="339.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 209_3" cx="1375.5" cy="354.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 312_2" cx="1400" cy="355" r="6" fill="#2648CE"/>
            <circle id="Ellipse 277_3" cx="1423.5" cy="354.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 210_2" cx="1375.5" cy="369.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 309_2" cx="1400" cy="370" r="6" fill="#2648CE"/>
            <circle id="Ellipse 278_2" cx="1423.5" cy="369.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 211_3" cx="1375.5" cy="384.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 245_3" cx="1399.5" cy="384.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 279_2" cx="1423.5" cy="384.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 212_2" cx="1375.5" cy="399.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 246_3" cx="1399.5" cy="399.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 280_2" cx="1423.5" cy="399.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 214_2" cx="1375.5" cy="429.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 248_2" cx="1399.5" cy="429.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 282" cx="1423.5" cy="429.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 215_2" cx="1375.5" cy="444.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 249_3" cx="1399.5" cy="444.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 283_2" cx="1423.5" cy="444.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 216_2" cx="1375.5" cy="459.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 250_3" cx="1399.5" cy="459.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 284_2" cx="1423.5" cy="459.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 217_3" cx="1375.5" cy="474.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 251_3" cx="1399.5" cy="474.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 285_2" cx="1423.5" cy="474.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 218_2" cx="1375.5" cy="489.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 252_2" cx="1399.5" cy="489.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 286" cx="1423.5" cy="489.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 219_3" cx="1375.5" cy="504.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 253_3" cx="1399.5" cy="504.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 287_2" cx="1423.5" cy="504.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 220_2" cx="1375.5" cy="519.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 254_3" cx="1399.5" cy="519.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 288_2" cx="1423.5" cy="519.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 221_2" cx="1375.5" cy="534.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 255_3" cx="1399.5" cy="534.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 289_2" cx="1423.5" cy="534.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 222_2" cx="1375.5" cy="549.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 256_2" cx="1399.5" cy="549.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 290_2" cx="1423.5" cy="549.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 223_2" cx="1375.5" cy="564.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 257_2" cx="1399.5" cy="564.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 291_2" cx="1423.5" cy="564.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 224_2" cx="1375.5" cy="579.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 258" cx="1399.5" cy="579.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 292_2" cx="1423.5" cy="579.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 225_2" cx="1375.5" cy="594.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 259_2" cx="1399.5" cy="594.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 293_2" cx="1423.5" cy="594.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 226_2" cx="1375.5" cy="609.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 260_3" cx="1399.5" cy="609.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 294_2" cx="1423.5" cy="609.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 227_2" cx="1375.5" cy="624.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 261" cx="1399.5" cy="624.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 295_2" cx="1423.5" cy="624.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 229_2" cx="1375.5" cy="654.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 263" cx="1399.5" cy="654.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 297_2" cx="1423.5" cy="654.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 230_2" cx="1375.5" cy="669.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 264" cx="1399.5" cy="669.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 298_2" cx="1423.5" cy="669.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 231" cx="1375.5" cy="684.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 265" cx="1399.5" cy="684.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 299_2" cx="1423.5" cy="684.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 232_2" cx="1375.5" cy="699.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 266" cx="1399.5" cy="699.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 300_2" cx="1423.5" cy="699.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 233_2" cx="1375.5" cy="714.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 267" cx="1399.5" cy="714.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 301_2" cx="1423.5" cy="714.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 234" cx="1375.5" cy="729.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 268" cx="1399.5" cy="729.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 302_2" cx="1423.5" cy="729.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 235_2" cx="1375.5" cy="744.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 269" cx="1399.5" cy="744.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 303_2" cx="1423.5" cy="744.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 236_2" cx="1375.5" cy="759.5" r="5.5" fill="#B7B7B7"/>
            <circle id="BAL_H_02"
                data-section="BAL"
                data-row="H"
                data-seat="02"
                data-status="available"
                data-price="21.68" 
                cx="1400" cy="760" r="6" fill="#2648CE"/>
            <circle id="Ellipse 304_2" cx="1423.5" cy="759.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 237_2" cx="1375.5" cy="774.5" r="5.5" fill="#B7B7B7"/>
            <circle id="BAL_H_01"
                    data-section="BAL"
                    data-row="H"
                    data-seat="01"
                    data-status="available"
                    data-price="29.53"   
                cx="1400" cy="775" r="6" fill="#2648CE"/>
            <circle id="Ellipse 305_2" cx="1423.5" cy="774.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1082" cx="1246.4" cy="261.102" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1083" cx="1260.99" cy="264.55" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1084" cx="1275.03" cy="269.802" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1158" cx="1288.8" cy="277.27" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1160" cx="1301.1" cy="285.838" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1161" cx="1312.24" cy="295.867" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1159" cx="1322.06" cy="307.2" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1163" cx="1330.38" cy="319.665" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1157" cx="1337.08" cy="333.074" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1162" cx="1342.04" cy="345.22" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1156" cx="1345.18" cy="358.877" r="6" fill="#2648CE"/>
            <ellipse id="Ellipse 1096" cx="1345.96" cy="374.313" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 1098" cx="1346" cy="389.312" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 1099" cx="1346" cy="404.312" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 1100" cx="1346" cy="418.312" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 1102" cx="1346" cy="433.312" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 1103" cx="1346" cy="448.312" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 1104" cx="1346" cy="463.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1106" cx="1346" cy="477.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1107" cx="1346" cy="503.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1140" cx="1346.5" cy="489.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1110" cx="1346" cy="532.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1111" cx="1346" cy="546.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1112" cx="1346" cy="560.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1114" cx="1346" cy="574.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1115" cx="1346" cy="589.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1116" cx="1346" cy="604.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1118" cx="1346" cy="619.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1119" cx="1346" cy="633.312" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1146" cx="1346.5" cy="646.812" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1147" cx="1346.5" cy="661.812" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1149" cx="1346.47" cy="676.812" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1145" cx="1345.2" cy="691.749" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1150" cx="1342.08" cy="706.409" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1144" cx="1337.13" cy="720.56" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1151" cx="1330.44" cy="734.476" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1143" cx="1322.13" cy="746.95" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1152" cx="1312.33" cy="758.293" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1142" cx="1301.2" cy="768.333" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1148" cx="1288.91" cy="776.914" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1141" cx="1275.64" cy="783.896" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1136" cx="1261.11" cy="788.161" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1138" cx="1246.53" cy="791.625" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 719" cx="1240.28" cy="283.485" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 688" cx="1254.34" cy="287.687" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 699" cx="1267.63" cy="292.62" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1165" cx="1280.44" cy="301.68" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1164" cx="1291.54" cy="311.751" r="6" fill="#2648CE"/>
            <circle id="Ellipse 723" cx="1300.74" cy="322.678" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 689" cx="1308.83" cy="335.295" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 701" cx="1315.14" cy="348.889" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 680" cx="1319.51" cy="363.225" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 702" cx="1321.86" cy="378.028" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 685" cx="1322.28" cy="392.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 712" cx="1322.28" cy="407.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 695" cx="1322.28" cy="422.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 713" cx="1322.28" cy="435.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 686" cx="1322.28" cy="449.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 714" cx="1322.28" cy="464.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 696" cx="1322.28" cy="478.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 715" cx="1322.28" cy="503.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1139" cx="1322.5" cy="490.5" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 716" cx="1322.28" cy="532.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 697" cx="1322.28" cy="546.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 717" cx="1322.28" cy="561.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 559" cx="1322.28" cy="575.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 560" cx="1322.28" cy="590.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 561" cx="1322.28" cy="606.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 562" cx="1322.28" cy="620.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 563" cx="1322.28" cy="633.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 564" cx="1322.28" cy="648.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 565" cx="1322.28" cy="663.016" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 566" cx="1321.27" cy="677.97" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1155" cx="1318.7" cy="693.14" r="6" fill="#2648CE"/>
            <circle id="Ellipse 568" cx="1313.13" cy="706.745" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 569" cx="1306.17" cy="720.02" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 570" cx="1297.5" cy="732.241" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 571" cx="1287.28" cy="743.208" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1154" cx="1276.23" cy="753.264" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1153" cx="1263.55" cy="761.263" r="6" fill="#2648CE"/>
            <circle id="Ellipse 574" cx="1250.47" cy="765.097" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 575" cx="1238.19" cy="768.676" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 762" cx="1228.88" cy="305.155" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 764" cx="1242.02" cy="308.134" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 766" cx="1254.47" cy="313.746" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 1166" cx="1267.38" cy="320.65" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1168" cx="1278.26" cy="330.946" r="6" fill="#2648CE"/>
            <circle id="Ellipse 1167" cx="1287.07" cy="343.06" r="6" fill="#2648CE"/>
            <ellipse id="Ellipse 774" cx="1292.8" cy="356.176" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 776" cx="1296.22" cy="370.755" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 1169" cx="1297.5" cy="385.721" r="6" fill="#2648CE"/>
            <ellipse id="Ellipse 780" cx="1297" cy="399.721" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 782" cx="1297" cy="414.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 784" cx="1297" cy="429.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 786" cx="1297" cy="443.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 788" cx="1297" cy="458.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 790" cx="1297" cy="473.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 792" cx="1297" cy="488.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 794" cx="1297" cy="502.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 798" cx="1297" cy="532.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 800" cx="1297" cy="550.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 802" cx="1297" cy="565.721" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 804" cx="1297" cy="580.721" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 806" cx="1297" cy="595.721" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 808" cx="1297" cy="610.721" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 810" cx="1297" cy="625.721" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 812" cx="1297" cy="640.721" rx="5.5" ry="5" fill="#B7B7B7"/>
            <circle id="Ellipse 814" cx="1296.94" cy="655.72" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 816" cx="1295.19" cy="670.6" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 818" cx="1291.03" cy="684.993" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 820" cx="1284.62" cy="698.54" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 822" cx="1276.24" cy="710.962" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 824" cx="1266.17" cy="722.061" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 826" cx="1254.7" cy="731.71" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 828" cx="1242.09" cy="737.826" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 830" cx="1228.6" cy="742.356" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 769" cx="1217.11" cy="327.29" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 771" cx="1231.51" cy="331.44" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 773" cx="1245.18" cy="337.585" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 775" cx="1257.24" cy="346.429" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 777" cx="1266.27" cy="358.329" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 779" cx="1271.06" cy="371.479" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 781" cx="1272" cy="386.424" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 783" cx="1272" cy="401.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 785" cx="1272" cy="416.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 787" cx="1272" cy="430.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 789" cx="1272" cy="444.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 791" cx="1272" cy="459.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 793" cx="1272" cy="473.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 795" cx="1272" cy="488.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 797" cx="1272" cy="502.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 801" cx="1272" cy="532.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 803" cx="1272" cy="552.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 805" cx="1272" cy="567.424" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 807" cx="1272" cy="582.424" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 809" cx="1272" cy="597.424" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 811" cx="1272" cy="612.424" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 813" cx="1272" cy="627.424" rx="5.5" ry="5" fill="#B7B7B7"/>
            <circle id="Ellipse 815" cx="1272" cy="642.424" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 817" cx="1271.56" cy="657.409" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 819" cx="1268.45" cy="672.052" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 821" cx="1262.11" cy="685.609" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 823" cx="1252.79" cy="697.321" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 825" cx="1241.19" cy="706.788" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 827" cx="1229.08" cy="713.037" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 829" cx="1216.05" cy="717.332" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 847" cx="1201.51" cy="351.196" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 849" cx="1215.16" cy="354.334" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 850" cx="1227.99" cy="359.064" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 853" cx="1239.21" cy="368.858" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 855" cx="1245.17" cy="382.494" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 857" cx="1246.12" cy="397.431" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 858" cx="1246.12" cy="412.431" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 861" cx="1246.12" cy="427.431" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 865" cx="1246.12" cy="442.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 866" cx="1246.12" cy="457.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 869" cx="1246.12" cy="472.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 870" cx="1246.12" cy="487.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 873" cx="1246.12" cy="502.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 877" cx="1246.12" cy="532.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 878" cx="1246.12" cy="547.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 881" cx="1246.12" cy="562.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 882" cx="1246.12" cy="577.431" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 885" cx="1246.12" cy="592.431" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 886" cx="1246.12" cy="607.431" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 889" cx="1246.12" cy="622.431" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 890" cx="1246.12" cy="637.431" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 893" cx="1245.65" cy="652.41" rx="5.5" ry="5" fill="#B7B7B7"/>
            <circle id="Ellipse 894" cx="1241.53" cy="666.772" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 897" cx="1233.1" cy="679.097" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 898" cx="1221.39" cy="688.4" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 901" cx="1207.81" cy="694.708" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 930" cx="1187.25" cy="373.414" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 933" cx="1201.43" cy="376.222" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 937" cx="1213.22" cy="384.296" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 938" cx="1219.29" cy="397.843" rx="5.5" ry="6" fill="#B7B7B7"/>
            <ellipse id="Ellipse 941" cx="1220" cy="412.8" rx="5.5" ry="6" fill="#B7B7B7"/>
            <circle id="Ellipse 945" cx="1220" cy="427.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 946" cx="1220" cy="442.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 949" cx="1220" cy="457.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 953" cx="1220" cy="472.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 954" cx="1220" cy="487.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 957" cx="1220" cy="502.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 962" cx="1220" cy="532.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 965" cx="1220" cy="547.8" r="5.5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 969" cx="1220" cy="562.8" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 970" cx="1220" cy="577.8" rx="5.5" ry="5" fill="#B7B7B7"/>
            <ellipse id="Ellipse 973" cx="1220" cy="592.8" rx="5.5" ry="5" fill="#B7B7B7"/>
            <circle id="Ellipse 977" cx="1220" cy="607.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 978" cx="1220" cy="622.8" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 985" cx="1218.81" cy="637.711" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 986" cx="1212.91" cy="651.407" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 990" cx="1202.52" cy="662.13" r="5.5" fill="#B7B7B7"/>
            <circle id="Ellipse 993" cx="1189.41" cy="669.331" r="5.5" fill="#B7B7B7"/>
            </g>


        </g>

        {/* =========================
              1) SECTIONS layer (overview)
              Wrap your big blocks here and add data-map="section"
             ========================= */}
        <g id="LAYER_SECTIONS" className="layer layer--sections">
            {/* PUT YOUR BIG SECTION SHAPES/GROUPS HERE */}
            {/* Example:
              <g data-map="section" data-section="SBALC"> ... </g>
            */}
                <g id="SECTION_LEFT_BALCONY" data-map="section" clipPath="url(#clip0_0_1)">
                    <rect width="203" height="469" transform="matrix(0 1 -1 0 636 818)" fill="#2648CE"/>
                    <text id="SIDE" fill="white" xmlSpace="preserve" style={{ whiteSpace: "pre" }} fontFamily="Inter" fontSize="48" letterSpacing="0em"><tspan x="349.25" y="907.455">SIDE</tspan></text>
                    <text id="BALCONY" fill="white" xmlSpace="preserve" style={{ whiteSpace: "pre" }} fontFamily="Inter" fontSize="48" letterSpacing="0em"><tspan x="288.078" y="956.455">BALCONY</tspan></text>
                    </g>
                    <g id="SECTION_RIGHT_BALCONY" data-map="section" clipPath="url(#clip1_0_1)">
                    <rect width="203" height="469" transform="matrix(0 1 -1 0 636 29)" fill="#2648CE"/>
                    <text id="SIDE_2" fill="white" xmlSpace="preserve" style={{ whiteSpace: "pre" }} fontFamily="Inter" fontSize="48" letterSpacing="0em"><tspan x="349.25" y="118.455">SIDE</tspan></text>
                    <text id="BALCONY_2" fill="white" xmlSpace="preserve" style={{ whiteSpace: "pre" }} fontFamily="Inter" fontSize="48" letterSpacing="0em"><tspan x="288.078" y="167.455">BALCONY</tspan></text>
                    </g>
                    <g id="SECTION_BALCONY" data-map="section">
                    <path d="M1244.5 240H1440V798H1236.5L1176 663.352L1189.44 635.976V406.907L1170 374L1244.5 240Z" fill="#2648CE"/>
                    <path d="M1298 391.305H1332.91V403.51C1332.91 405.942 1332.49 407.947 1331.65 409.527C1330.82 411.107 1329.7 412.283 1328.29 413.055C1326.89 413.828 1325.34 414.214 1323.64 414.214C1322.14 414.214 1320.9 413.947 1319.92 413.413C1318.94 412.891 1318.17 412.197 1317.6 411.334C1317.03 410.482 1316.61 409.555 1316.34 408.555H1316C1315.93 409.624 1315.56 410.697 1314.88 411.777C1314.19 412.857 1313.22 413.76 1311.94 414.487C1310.67 415.214 1309.11 415.578 1307.27 415.578C1305.52 415.578 1303.95 415.18 1302.55 414.385C1301.15 413.589 1300.05 412.334 1299.23 410.618C1298.41 408.902 1298 406.669 1298 403.919V391.305ZM1301.75 395.533V403.919C1301.75 406.68 1302.28 408.641 1303.35 409.8C1304.43 410.97 1305.74 411.555 1307.27 411.555C1308.45 411.555 1309.55 411.254 1310.55 410.652C1311.56 410.05 1312.36 409.192 1312.97 408.078C1313.58 406.964 1313.89 405.646 1313.89 404.124V395.533H1301.75ZM1317.57 395.533V403.374C1317.57 404.646 1317.82 405.794 1318.32 406.817C1318.82 407.851 1319.52 408.669 1320.43 409.271C1321.34 409.885 1322.41 410.192 1323.64 410.192C1325.17 410.192 1326.47 409.658 1327.54 408.589C1328.62 407.521 1329.16 405.828 1329.16 403.51V395.533H1317.57Z" fill="white"/>
                    <path d="M1298 423.956V419.524L1332.91 432.342V436.706L1298 449.524V445.092L1327.39 434.661V434.388L1298 423.956ZM1311.64 425.592V443.456H1307.89V425.592H1311.64Z" fill="white"/>
                    <path d="M1298 454.962H1332.91V459.189H1301.75V475.416H1298V454.962Z" fill="white"/>
                    <path d="M1322 508.693V504.466C1323.22 504.216 1324.28 503.778 1325.2 503.153C1326.12 502.54 1326.9 501.79 1327.52 500.903C1328.16 500.028 1328.64 499.057 1328.95 497.989C1329.27 496.92 1329.43 495.807 1329.43 494.648C1329.43 492.534 1328.9 490.619 1327.83 488.903C1326.76 487.199 1325.19 485.841 1323.11 484.83C1321.03 483.83 1318.48 483.33 1315.45 483.33C1312.43 483.33 1309.88 483.83 1307.8 484.83C1305.72 485.841 1304.15 487.199 1303.08 488.903C1302.01 490.619 1301.48 492.534 1301.48 494.648C1301.48 495.807 1301.64 496.92 1301.95 497.989C1302.27 499.057 1302.74 500.028 1303.37 500.903C1304.01 501.79 1304.78 502.54 1305.7 503.153C1306.64 503.778 1307.7 504.216 1308.91 504.466V508.693C1307.12 508.375 1305.53 507.795 1304.12 506.955C1302.71 506.114 1301.51 505.068 1300.52 503.818C1299.55 502.568 1298.8 501.165 1298.29 499.608C1297.78 498.062 1297.52 496.409 1297.52 494.648C1297.52 491.67 1298.25 489.023 1299.7 486.705C1301.16 484.386 1303.23 482.562 1305.91 481.233C1308.59 479.903 1311.77 479.239 1315.45 479.239C1319.14 479.239 1322.32 479.903 1325 481.233C1327.68 482.562 1329.75 484.386 1331.2 486.705C1332.66 489.023 1333.39 491.67 1333.39 494.648C1333.39 496.409 1333.13 498.062 1332.62 499.608C1332.11 501.165 1331.36 502.568 1330.37 503.818C1329.39 505.068 1328.2 506.114 1326.79 506.955C1325.39 507.795 1323.8 508.375 1322 508.693Z" fill="white"/>
                    <path d="M1315.45 544.979C1311.77 544.979 1308.59 544.314 1305.91 542.984C1303.23 541.655 1301.16 539.831 1299.7 537.513C1298.25 535.195 1297.52 532.547 1297.52 529.57C1297.52 526.592 1298.25 523.945 1299.7 521.626C1301.16 519.308 1303.23 517.484 1305.91 516.155C1308.59 514.825 1311.77 514.161 1315.45 514.161C1319.14 514.161 1322.32 514.825 1325 516.155C1327.68 517.484 1329.75 519.308 1331.2 521.626C1332.66 523.945 1333.39 526.592 1333.39 529.57C1333.39 532.547 1332.66 535.195 1331.2 537.513C1329.75 539.831 1327.68 541.655 1325 542.984C1322.32 544.314 1319.14 544.979 1315.45 544.979ZM1315.45 540.888C1318.48 540.888 1321.03 540.382 1323.11 539.371C1325.19 538.371 1326.76 537.013 1327.83 535.297C1328.9 533.592 1329.43 531.683 1329.43 529.57C1329.43 527.456 1328.9 525.541 1327.83 523.825C1326.76 522.121 1325.19 520.763 1323.11 519.751C1321.03 518.751 1318.48 518.251 1315.45 518.251C1312.43 518.251 1309.88 518.751 1307.8 519.751C1305.72 520.763 1304.15 522.121 1303.08 523.825C1302.01 525.541 1301.48 527.456 1301.48 529.57C1301.48 531.683 1302.01 533.592 1303.08 535.297C1304.15 537.013 1305.72 538.371 1307.8 539.371C1309.88 540.382 1312.43 540.888 1315.45 540.888Z" fill="white"/>
                    <path d="M1332.91 579.768H1298V575.678L1325.41 556.655V556.314H1298V552.087H1332.91V556.178L1305.43 575.268V575.609H1332.91V579.768Z" fill="white"/>
                    <path d="M1332.91 585.227V590.068L1316.61 599.75V600.159L1332.91 609.841V614.682L1312.39 602.068H1298V597.841H1312.39L1332.91 585.227Z" fill="white"/>
                    </g>
                    <g id="SECTION_STALLS" data-map="section">
                    <rect x="292" y="229" width="876" height="592" fill="#2648CE"/>
                    <rect x="292" y="229" width="876" height="592" stroke="white" stroke-width="6"/>
                    <text id="STALLS" fill="white" xmlSpace="preserve" style={{ whiteSpace: "pre" }} fontFamily="Inter" fontSize="100" letterSpacing="0em"><tspan x="548.359" y="561.864">STALLS</tspan></text>
                </g>
        </g>
    </g>
    </svg>
</div>
                );
                }


    
// {/*<rect width="1472" height="1050" fill="black"/>*/}
// <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
// <g id="THEATRE MAP">
// <rect width="1472" height="1050" fill="white"/>




// </g>
// <defs>
// <clipPath id="clip0_0_1">
// <rect width="203" height="469" fill="white" transform="matrix(0 1 -1 0 636 818)"/>
// </clipPath>
// <clipPath id="clip1_0_1">
// <rect width="203" height="469" fill="white" transform="matrix(0 1 -1 0 636 29)"/>
// </clipPath>
// </defs>
// </g>
//         {/* ... your <rect>, <g>, <path>, <circle> ... */}
//       </svg>

//       {/* Optional: debug label */}
//       <div className="selectedDebug">
//         {selected ? `${selected.section} • Row ${selected.row} • Seat ${selected.seat}` : "No seat selected"}
//       </div>
//     </div>
//   );
// }



