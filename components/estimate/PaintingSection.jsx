// components/estimate/PaintingSection.jsx

export default function PaintingSection() {
  return (
    <section
      className="sec"
      id="sec-paint"
      data-enabled="1"
      data-hide-customer="0"
    >
      <div className="secHead">
        <div
          className="secTitle"
          contentEditable
          suppressContentEditableWarning
        >
          Interior Painting — Optional
        </div>
      </div>
      <div className="secDesc" contentEditable suppressContentEditableWarning>
        Walls, trim, and doors painting. Low-VOC paints, clean lines, floors and
        fixtures masked. Touch-ups and final walkthrough included.
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
          <tbody>
            {/* default internal ceiling rows stay private */}
            <tr className="private">
              <td contentEditable suppressContentEditableWarning>
                Ceiling priming
              </td>
              <td className="num">
                <input className="qty" type="number" step="0.01" />
              </td>
              <td>
                <select className="unit" defaultValue="sf">
                  <option value="sf">sf</option>
                  <option value="ea">ea</option>
                  <option value="job">job</option>
                  <option value="lf">lf</option>
                  <option value="door">door</option>
                  <option value="room">room</option>
                  <option value="allow">allow</option>
                </select>{" "}
              </td>
              <td className="num col-rate">
                <input
                  className="rate"
                  type="number"
                  step="0.01"
                  defaultValue="1.00"
                />
              </td>
              <td className="num">
                <input className="amt" type="number" step="0.01" disabled />
              </td>
              <td className="num">
                <button className="btn del">✕</button>
              </td>
            </tr>
            <tr className="private">
              <td contentEditable suppressContentEditableWarning>
                Ceiling paint (2 coats)
              </td>
              <td className="num">
                <input className="qty" type="number" step="0.01" />
              </td>
              <td>
                <input className="unit" defaultValue="sf" />
              </td>
              <td className="num col-rate">
                <input
                  className="rate"
                  type="number"
                  step="0.01"
                  defaultValue="2.00"
                />
              </td>
              <td className="num">
                <input className="amt" type="number" step="0.01" disabled />
              </td>
              <td className="num">
                <button className="btn del">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="secTog secTog-bottom">
        <label>
          {/* user can tick to hide; starts visible */}
          <input type="checkbox" className="hideSec" /> Hide from customer
        </label>
        <button className="btn ghost addRoom">＋ Add room</button>
        <button className="btn ghost addLine">＋ Add line</button>
        <button className="btn ghost clearSection">Clear section</button>
      </div>
    </section>
  );
}
