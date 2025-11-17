export default function AdditionalServicesSection() {
  return (
    <section
      id="sec-add"
      className="sec"
      data-enabled="1"
      data-hide-customer="0"
    >
      <div className="card">
        <div className="secHead">
          <h3 className="secTitle">Additional Services</h3>
          <label className="ml-3">
            <input type="checkbox" className="hideSec" /> Hide from customer
          </label>
        </div>

        <table className="grid">
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Qty</th>
              <th>Unit</th>
              <th className="num">Rate</th>
              <th className="num">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="tb-additional"></tbody>
        </table>

        {/* TOOLS UNDER SECTION */}
        <div className="sectionControls">
          <div className="right">
            <button type="button" className="btn ghost addLine">
              ＋ Custom line
            </button>
            <button type="button" className="btn del clearSection">
              Clear section
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
