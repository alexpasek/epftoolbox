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
      <div className="card">
        <div className="secHead">
          <h3 className="secTitle">Popcorn / Stucco Removal</h3>
          <div className="opts">
            <label>
              Height factor{" "}
              <select className="heightSel" defaultValue="1">
                <option value="1">1×</option>
                <option value="1.1">1.1×</option>
                <option value="1.2">1.2×</option>
                <option value="1.3">1.3×</option>
                <option value="1.5">1.5×</option>
              </select>
            </label>
            <label className="ml-3">
              <input type="checkbox" className="linkSF" defaultChecked /> Link
              SF inside room
            </label>
            <label className="ml-3">
              <input type="checkbox" className="hideSec" /> Hide from customer
            </label>
            <button type="button" className="btn mini resetPop ml-3">
              Reset defaults
            </button>
          </div>
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
          <tbody id="tb-popcorn"></tbody>
        </table>

        {/* TOOLS UNDER SECTION */}
        <div className="sectionControls">
          <div className="left">
            <button type="button" className="btn ghost addRoomPop">
              ＋ Room
            </button>
          </div>
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
