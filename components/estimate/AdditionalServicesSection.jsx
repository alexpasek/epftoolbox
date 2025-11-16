// components/estimate/AdditionalServicesSection.jsx

export default function AdditionalServicesSection() {
  return (
    <section
      className="sec"
      id="sec-add"
      data-enabled="1"
      data-hide-customer="0"
    >
      <div className="secHead">
        <div
          className="secTitle"
          contentEditable
          suppressContentEditableWarning
        >
          Additional Services
        </div>
      </div>
      <div className="secDesc" contentEditable suppressContentEditableWarning>
        Optional items to tailor your project: drywall repairs, corner beads,
        pot-light patching, furniture protection, debris disposal, and other
        logistics.
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
            <tr>
              <td contentEditable suppressContentEditableWarning>
                Drywall repair / patching
                <div
                  className="small"
                  contentEditable
                  suppressContentEditableWarning
                >
                  Allowance — confirm on site
                </div>
              </td>
              <td className="num">
                <input className="qty" type="number" />
              </td>
              <td>
                <select className="unit" defaultValue="allow">
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
                <input className="rate" type="number" defaultValue="0.00" />
              </td>
              <td className="num">
                <input className="amt" type="number" step="0.01" disabled />
              </td>
              <td className="num">
                <button className="btn del">✕</button>
              </td>
            </tr>
            <tr>
              <td contentEditable suppressContentEditableWarning>
                Debris disposal
                <div
                  className="small"
                  contentEditable
                  suppressContentEditableWarning
                >
                  Bag &amp; remove site waste
                </div>
              </td>
              <td className="num">
                <input className="qty" type="number" defaultValue="1" />
              </td>
              <td>
                <select className="unit" defaultValue="job">
                  <option value="sf">sf</option>
                  <option value="ea">ea</option>
                  <option value="job">job</option>
                  <option value="lf">lf</option>
                  <option value="door">door</option>
                  <option value="room">room</option>
                  <option value="allow">allow</option>
                </select>
              </td>
              <td className="num col-rate">
                <input className="rate" type="number" defaultValue="80" />
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
          <input type="checkbox" className="hideSec" /> Hide from customer
        </label>
        <button className="btn ghost addLine">＋ Add line</button>
        <button className="btn ghost clearSection">Clear section</button>
      </div>
    </section>
  );
}
