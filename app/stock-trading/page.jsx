"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const defaultTickers = [
  "ZBAL.TO",
  "XEQT.TO",
  "VFV.TO",
  "XQQ.TO",
  "ZQQ.TO",
  "XIU.TO",
  "XIC.TO",
  "VCN.TO",
  "VUN.TO",
  "SPY",
  "QQQ",
];

const signalStyles = {
  "BUY CONFIRM": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "BUY WATCH": "bg-sky-100 text-sky-900 border-sky-300",
  WAIT: "bg-amber-100 text-amber-900 border-amber-300",
  "SELL WATCH": "bg-orange-100 text-orange-900 border-orange-300",
  EXIT: "bg-rose-100 text-rose-900 border-rose-300",
  AVOID: "bg-slate-200 text-slate-900 border-slate-300",
  "WEAK / AVOID": "bg-slate-200 text-slate-900 border-slate-300",
};

export default function StockTradingPage() {
  const [tickersText, setTickersText] = useState(defaultTickers.join(", "));
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [selectedTicker, setSelectedTicker] = useState(defaultTickers[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => data?.results?.find((item) => item.ticker === selectedTicker && item.ok) || data?.results?.find((item) => item.ok),
    [data, selectedTicker]
  );

  useEffect(() => {
    loadSignals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSignals() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        tickers: tickersText,
        accountSize: String(accountSize),
        riskPercent: String(riskPercent),
      });
      const response = await fetch(`/api/stock-trading/analyze?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Analyzer failed");
      setData(payload);
      const firstOk = payload.results?.find((item) => item.ok);
      if (firstOk && !payload.results?.some((item) => item.ticker === selectedTicker && item.ok)) {
        setSelectedTicker(firstOk.ticker);
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              EPF Toolbox
            </Link>
            <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">Stock Trading</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              ETF swing-trading signal analyzer for Canadian and US tickers. Analysis, backtesting, and alerts only.
            </p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900">
            No broker connection. No market orders. No automatic trade execution.
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Controls</h2>
            <label className="mt-3 block text-xs font-bold text-slate-600">Watchlist</label>
            <textarea
              value={tickersText}
              onChange={(event) => setTickersText(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-slate-600">
                Account size
                <input
                  type="number"
                  min="100"
                  value={accountSize}
                  onChange={(event) => setAccountSize(Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Risk %
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={riskPercent}
                  onChange={(event) => setRiskPercent(Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button
              onClick={loadSignals}
              disabled={loading}
              className="mt-4 w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:bg-slate-500"
            >
              {loading ? "Analyzing..." : "Refresh Signals"}
            </button>
            {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
          </section>

          <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Signal Score</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <ScoreLine label="Trend" value="25" />
              <ScoreLine label="Momentum" value="20" />
              <ScoreLine label="Volume" value="10" />
              <ScoreLine label="DMI / ADX" value="15" />
              <ScoreLine label="Candle confirm" value="15" />
              <ScoreLine label="Risk / reward" value="15" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Signal Meaning</h2>
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              <p><strong>BUY CONFIRM:</strong> setup plus candle confirmation and 2:1 risk/reward.</p>
              <p><strong>BUY WATCH:</strong> good setup forming, but confirmation is missing.</p>
              <p><strong>WAIT:</strong> long-term trend may be fine, entry is not ready.</p>
              <p><strong>SELL WATCH:</strong> price is near target, weakening, or below short trend.</p>
              <p><strong>EXIT / AVOID:</strong> trend, momentum, or risk rules are poor.</p>
            </div>
          </section>
        </aside>

        <div className="space-y-4">
          <OverviewTable
            rows={data?.results || []}
            selectedTicker={selectedTicker}
            onSelect={setSelectedTicker}
            loading={loading}
          />

          {selected ? (
            <>
              <SingleAnalysis item={selected} />
              <ChartPanel item={selected} />
              <BacktestPanel item={selected} />
            </>
          ) : (
            <section className="rounded-lg border border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              {loading ? "Loading ETF signals..." : "No ETF analysis loaded yet."}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function OverviewTable({ rows, selectedTicker, onSelect, loading }) {
  const goodRows = rows.filter((row) => row.ok);
  const badRows = rows.filter((row) => !row.ok);
  return (
    <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Watchlist Overview</h2>
        <span className="text-xs font-semibold text-slate-500">{loading ? "Refreshing" : `${goodRows.length} loaded`}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {["Ticker", "Price", "Signal", "Score", "Trend", "RSI", "MACD", "ADX", "Support", "Resistance", "Stop", "Target", "R/R", "Last signal", "Reason"].map((heading) => (
                <th key={heading} className="px-3 py-2 font-black">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {goodRows.map((row) => (
              <tr
                key={row.ticker}
                onClick={() => onSelect(row.ticker)}
                className={`cursor-pointer border-t border-slate-100 hover:bg-sky-50 ${row.ticker === selectedTicker ? "bg-sky-50" : ""}`}
              >
                <td className="px-3 py-2 font-black text-slate-950">{row.ticker}</td>
                <td className="px-3 py-2">{money(row.price)}</td>
                <td className="px-3 py-2"><SignalPill signal={row.signal} /></td>
                <td className="px-3 py-2 font-bold">{row.score}/100</td>
                <td className="px-3 py-2">{row.trend}</td>
                <td className="px-3 py-2">{number(row.rsi)}</td>
                <td className="px-3 py-2">{row.macdStatus}</td>
                <td className="px-3 py-2">{number(row.adx)}</td>
                <td className="px-3 py-2">{money(row.support)}</td>
                <td className="px-3 py-2">{money(row.resistance)}</td>
                <td className="px-3 py-2">{money(row.stop)}</td>
                <td className="px-3 py-2">{money(row.target)}</td>
                <td className="px-3 py-2">{number(row.riskReward)}:1</td>
                <td className="px-3 py-2">{row.lastSignalDate}</td>
                <td className="max-w-[320px] px-3 py-2 text-slate-600">{row.reason}</td>
              </tr>
            ))}
            {badRows.map((row) => (
              <tr key={row.ticker} className="border-t border-slate-100 bg-rose-50">
                <td className="px-3 py-2 font-black">{row.ticker}</td>
                <td className="px-3 py-2 text-rose-700" colSpan={14}>{row.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SingleAnalysis({ item }) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-slate-950">{item.ticker}</h2>
            <SignalPill signal={item.signal} />
            <span className="rounded-md border border-slate-300 px-2 py-1 text-xs font-black text-slate-700">
              Score {item.score}/100
            </span>
          </div>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{item.reason}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs md:min-w-[320px]">
          <Metric label="Price" value={money(item.price)} />
          <Metric label="Trend" value={item.trend} />
          <Metric label="Stop" value={money(item.stop)} />
          <Metric label="Target" value={money(item.target)} />
          <Metric label="Risk/reward" value={`${number(item.riskReward)}:1`} />
          <Metric label="Position size" value={`${item.shares || 0} shares`} />
        </div>
      </div>
    </section>
  );
}

function ChartPanel({ item }) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Chart & Indicators</h2>
        <span className="text-xs font-semibold text-slate-500">Daily candles, latest 180 sessions</span>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SparkChart
          title="Price with EMA20 / EMA50 / EMA200"
          rows={item.chart}
          keys={[
            ["close", "#0f172a"],
            ["ema20", "#0284c7"],
            ["ema50", "#16a34a"],
            ["ema200", "#dc2626"],
            ["bbUpper", "#94a3b8"],
            ["bbLower", "#94a3b8"],
          ]}
          height={300}
        />
        <div className="grid gap-4">
          <SparkChart title="RSI 14" rows={item.chart} keys={[["rsi", "#7c3aed"]]} height={130} fixedMin={0} fixedMax={100} />
          <SparkChart title="MACD Histogram" rows={item.chart} keys={[["macdHist", "#ea580c"]]} height={130} />
          <SparkChart title="ADX" rows={item.chart} keys={[["adx", "#0369a1"]]} height={130} fixedMin={0} fixedMax={60} />
        </div>
      </div>
    </section>
  );
}

function BacktestPanel({ item }) {
  const backtest = item.backtest || {};
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Backtest & Alerts</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Metric label="Trades" value={backtest.trades || 0} />
        <Metric label="Win rate" value={`${number(backtest.winRate)}%`} />
        <Metric label="Total return" value={`${number(backtest.totalReturn)}%`} />
        <Metric label="Max drawdown" value={`${number(backtest.maxDrawdown)}%`} />
        <Metric label="Average win" value={`${number(backtest.averageWin)}%`} />
        <Metric label="Average loss" value={`${number(backtest.averageLoss)}%`} />
        <Metric label="Best trade" value={`${number(backtest.bestTrade)}%`} />
        <Metric label="Worst trade" value={`${number(backtest.worstTrade)}%`} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[560px] w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-black">Date</th>
              <th className="px-3 py-2 font-black">Signal</th>
              <th className="px-3 py-2 font-black">Price</th>
              <th className="px-3 py-2 font-black">Score</th>
            </tr>
          </thead>
          <tbody>
            {(backtest.lastSignals || []).map((signal) => (
              <tr key={`${signal.date}-${signal.signal}`} className="border-t border-slate-100">
                <td className="px-3 py-2">{signal.date}</td>
                <td className="px-3 py-2"><SignalPill signal={signal.signal} /></td>
                <td className="px-3 py-2">{money(signal.price)}</td>
                <td className="px-3 py-2 font-bold">{signal.score}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Alert v1 logs signal changes in this table. Email and Telegram are placeholders only and require no credentials.
      </p>
    </section>
  );
}

function SparkChart({ title, rows, keys, height = 180, fixedMin, fixedMax }) {
  const width = 760;
  const padding = 18;
  const values = rows.flatMap((row) => keys.map(([key]) => row[key]).filter((value) => Number.isFinite(value)));
  const minValue = Number.isFinite(fixedMin) ? fixedMin : Math.min(...values);
  const maxValue = Number.isFinite(fixedMax) ? fixedMax : Math.max(...values);
  const range = maxValue - minValue || 1;
  const x = (index) => padding + (index / Math.max(rows.length - 1, 1)) * (width - padding * 2);
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {keys.map(([key, color]) => (
            <span key={key} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {key}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#cbd5e1" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#cbd5e1" />
        {keys.map(([key, color]) => {
          const points = rows
            .map((row, index) => Number.isFinite(row[key]) ? `${x(index)},${y(row[key])}` : null)
            .filter(Boolean)
            .join(" ");
          return <polyline key={key} fill="none" stroke={color} strokeWidth="2" points={points} />;
        })}
      </svg>
    </div>
  );
}

function SignalPill({ signal }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-black ${signalStyles[signal] || signalStyles.AVOID}`}>
      {signal}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-950">{value ?? "-"}</div>
    </div>
  );
}

function ScoreLine({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
      <span>{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function money(value) {
  if (!Number.isFinite(Number(value))) return "-";
  return `$${Number(value).toFixed(2)}`;
}

function number(value) {
  if (!Number.isFinite(Number(value))) return "-";
  return Number(value).toFixed(2).replace(/\.00$/, "");
}
