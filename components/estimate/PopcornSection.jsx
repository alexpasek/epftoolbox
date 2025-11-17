// components/estimate/PopcornSection.jsx

export default function PopcornSection() {
  return (
    <section
      id="sec-popcorn"
      className="sec"
      data-enabled="1"
      data-hide-customer="0"
      data-height="1"
      data-linksf="1"
    >
      <div className="secHead">
        <div
          className="secTitle"
          contentEditable
          suppressContentEditableWarning
        >
          Popcorn / Stucco Ceiling Removal
        </div>
        <div className="secDesc" contentEditable suppressContentEditableWarning>
          Dust-controlled removal, Level 5 skim, HEPA sanding, priming, and
          ceiling ready for final paint.
        </div>
      </div>

      <div className="secTools">
        <div className="row">
          <label>
            Ceiling height:
            <select className="heightSel">
              <option value="1">Up to 9'</option>
              <option value="1.15">10–11'</option>
              <option value="1.3">12'+ / vaulted</option>
            </select>
          </label>
          <label>
            <input className="linkSF" type="checkbox" defaultChecked /> Link SF
            within each room
          </label>
        </div>
        <div className="row">
          <button className="btn ghost addRoomPop">＋ Add Room</button>
          <button className="btn ghost addLine">＋ Add line</button>
          <button className="btn ghost resetPop">Reset rooms</button>
          <button className="btn ghost clearSection">Clear section</button>
          <label>
            <input type="checkbox" className="hideSec" /> Hide from customer
          </label>
        </div>
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
          <tbody id="tb-popcorn">{/* JS adds rooms here */}</tbody>
        </table>
      </div>
    </section>
  );
}
