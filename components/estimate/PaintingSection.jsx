export default function PaintingSection() {
  return (
    <section
      id="sec-paint"
      className="sec"
      data-enabled="1"
      data-hide-customer="0"
    >
      <div className="card">
        <div className="secHead">
          <h3 className="secTitle">Interior Painting</h3>
          <label className="ml-3">
            <input type="checkbox" className="hideSec" /> Hi
          </label>
        </div>

        <div className="paintCalc">
          <label className="dimInput">
            Walls W (ft)
            <input
              id="paint_dim_width"
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              placeholder="12"
            />
          </label>
          <label className="dimInput">
            Walls D (ft)
            <input
              id="paint_dim_depth"
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              placeholder="10"
            />
          </label>
          <div className="dimActions">
            <button type="button" className="btn ghost calcWallsFromDims">
              Apply dims
            </button>
            <button type="button" className="btn ghost calcWallsAndPop">
              Apply dims + add popcorn
            </button>
          </div>
          <small className="hint">
            Uses 8ft walls. Button also fills ceiling SF in Popcorn section.
          </small>
        </div>

        <div className="tableWrap">
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
            <tbody id="tb-paint"></tbody>
          </table>
        </div>

        {/* TOOLS UNDER SECTION */}
        <div className="sectionControls">
          <div className="left">
            <button type="button" className="btn ghost addRoom">
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
