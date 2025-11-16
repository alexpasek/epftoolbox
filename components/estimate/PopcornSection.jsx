// components/estimate/PopcornSection.jsx

export default function PopcornSection() {
  return (
    <section
      className="sec"
      id="sec-popcorn"
      data-enabled="1"
      data-hide-customer="0"
      data-linksf="1"
      data-height="1"
    >
      <div className="secHead">
        <div
          className="secTitle"
          contentEditable
          suppressContentEditableWarning
        >
          Popcorn / Stucco Removal — Ceilings
        </div>
      </div>
      <div className="secDesc" contentEditable suppressContentEditableWarning>
        We safely remove textured ceiling, repair joints, and finish to a smooth
        surface. Clean, dust-controlled process with masking, HEPA vacuuming,
        and daily cleanup.
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: "46%" }}>Description</th>
              <th style={{ width: "10%" }} className="num">
                Qty
              </th>
              <th style={{ width: "12%" }}>Unit</th>
              <th style={{ width: "14%" }} className="num col-rate">
                Rate
              </th>
              <th style={{ width: "14%" }} className="num">
                Amount
              </th>
              <th style={{ width: "4%" }}></th>
            </tr>
          </thead>
          <tbody id="tb-popcorn"></tbody>
        </table>
      </div>
      <div className="secTog secTog-bottom">
        <label>
          <input type="checkbox" className="hideSec" /> Hide from customer
        </label>
        <button className="btn ghost addRoomPop">＋ Add room</button>
        <button className="btn ghost addLine">＋ Add line</button>
        <button className="btn ghost clearSection">Clear section</button>
        <button className="btn ghost resetPop">Reset popcorn</button>
        <span>|</span>
        <label>
          Height{" "}
          <select className="heightSel">
            <option value="1">8′ (std)</option>
            <option value="1.1">9′ (+10%)</option>
            <option value="1.2">10′ (+20%)</option>
            <option value="1.35">12′ (+35%)</option>
          </select>
        </label>
        <label>
          <input type="checkbox" className="linkSF" defaultChecked /> Link SF
          (same qty for all ceiling lines)
        </label>
      </div>
    </section>
  );
}
