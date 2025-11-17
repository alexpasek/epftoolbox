// components/estimate/PaintingSection.jsx

export default function PaintingSection() {
  return (
    <section
      id="sec-paint"
      className="sec"
      data-enabled="1"
      data-hide-customer="0"
    >
      <div className="secHead">
        <div
          className="secTitle"
          contentEditable
          suppressContentEditableWarning
        >
          Interior Painting
        </div>
        <div className="secDesc" contentEditable suppressContentEditableWarning>
          Walls, trim, doors and ceilings where specified. Includes light prep,
          caulking and clean-up.
        </div>
      </div>

      <div className="secTog secTog-top">
        <button className="btn ghost addRoom">＋ Add Room</button>
        <button className="btn ghost addLine">＋ Add line</button>
        <button className="btn ghost clearSection">Clear section</button>
        <label>
          <input type="checkbox" className="hideSec" /> Hide from customer
        </label>
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
          <tbody>{/* rows are added dynamically by JS */}</tbody>
        </table>
      </div>

      <div className="secHint">
       \“＋ Add Room” 
      </div>
    </section>
  );
}
