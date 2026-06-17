"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";

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

const timeframes = [
  { label: "1D", sessions: 1 },
  { label: "5D", sessions: 5 },
  { label: "1M", sessions: 22 },
  { label: "3M", sessions: 66 },
  { label: "6M", sessions: 126 },
  { label: "1Y", sessions: 252 },
  { label: "2Y", sessions: 504 },
  { label: "5Y", sessions: 1260 },
];

const chartTypes = [
  { key: "candles", label: "Candles" },
  { key: "heikinAshi", label: "Heikin Ashi" },
  { key: "renko", label: "Renko" },
  { key: "bars", label: "Bars" },
  { key: "line", label: "Line" },
  { key: "area", label: "Area" },
  { key: "baseline", label: "Baseline" },
];

const chartWorkspaces = [
  { key: "chart1", label: "Chart 1", detail: "Clean" },
  { key: "chart2", label: "Chart 2", detail: "Pro Stack" },
];

const defaultChartTools = {
  ema20: true,
  ema50: true,
  ema200: true,
  sma20: true,
  sma50: true,
  sma200: true,
  bollinger: true,
  stopTarget: true,
  volume: true,
  macd: true,
  dmi: true,
  rsi: true,
  williamsR: true,
  tooltip: true,
  swingProjection: true,
  signalMarkers: true,
  vwap: true,
  openingRange: true,
  previousClose: true,
  supertrend: false,
  ichimoku: false,
  volumeProfile: false,
  pivots: true,
  atrBands: false,
  stochastic: false,
  relativeVolume: true,
};

const chartPresetTools = {
  clean: {
    ema20: true,
    ema50: true,
    ema200: false,
    sma20: false,
    sma50: true,
    sma200: false,
    bollinger: false,
    stopTarget: true,
    volume: true,
    macd: false,
    dmi: false,
    rsi: false,
    williamsR: false,
    tooltip: true,
    swingProjection: false,
    signalMarkers: true,
    vwap: true,
    openingRange: true,
    previousClose: true,
    supertrend: false,
    ichimoku: false,
    volumeProfile: false,
    pivots: true,
    atrBands: false,
    stochastic: false,
    relativeVolume: true,
  },
  day: {
    ema20: true,
    ema50: true,
    ema200: false,
    sma20: false,
    sma50: false,
    sma200: false,
    bollinger: false,
    stopTarget: true,
    volume: true,
    macd: true,
    dmi: false,
    rsi: true,
    williamsR: false,
    tooltip: true,
    swingProjection: false,
    signalMarkers: true,
    vwap: true,
    openingRange: true,
    previousClose: true,
    supertrend: true,
    ichimoku: false,
    volumeProfile: true,
    pivots: true,
    atrBands: true,
    stochastic: true,
    relativeVolume: true,
  },
  swing: defaultChartTools,
  investment: {
    ema20: false,
    ema50: true,
    ema200: true,
    sma20: false,
    sma50: true,
    sma200: true,
    bollinger: false,
    stopTarget: true,
    volume: true,
    macd: true,
    dmi: true,
    rsi: true,
    williamsR: false,
    tooltip: true,
    swingProjection: true,
    signalMarkers: true,
    vwap: false,
    openingRange: false,
    previousClose: false,
    supertrend: true,
    ichimoku: true,
    volumeProfile: false,
    pivots: true,
    atrBands: false,
    stochastic: false,
    relativeVolume: true,
  },
  pro: {
    ema20: true,
    ema50: true,
    ema200: true,
    sma20: false,
    sma50: true,
    sma200: true,
    bollinger: true,
    stopTarget: true,
    volume: true,
    macd: true,
    dmi: true,
    rsi: true,
    williamsR: true,
    tooltip: true,
    swingProjection: true,
    signalMarkers: true,
    vwap: true,
    openingRange: true,
    previousClose: true,
    supertrend: true,
    ichimoku: true,
    volumeProfile: true,
    pivots: true,
    atrBands: true,
    stochastic: true,
    relativeVolume: true,
  },
};

const chartPresets = [
  { key: "clean", label: "Clean", detail: "Low clutter" },
  { key: "day", label: "Day", detail: "VWAP + OR + Supertrend" },
  { key: "swing", label: "Swing", detail: "MA + bands + momentum" },
  { key: "investment", label: "Long", detail: "200-day trend + cloud" },
  { key: "pro", label: "Pro", detail: "Full stack" },
];

const toolGroups = [
  {
    key: "trend",
    label: "Trend",
    tools: [
      ["ema20", "EMA20"],
      ["ema50", "EMA50"],
      ["ema200", "EMA200"],
      ["sma50", "SMA50"],
      ["sma200", "SMA200"],
      ["supertrend", "Supertrend"],
      ["ichimoku", "Ichimoku"],
    ],
  },
  {
    key: "day",
    label: "Day Trade",
    tools: [
      ["vwap", "VWAP"],
      ["openingRange", "Opening range"],
      ["previousClose", "Prev close"],
      ["volumeProfile", "Vol profile"],
      ["pivots", "Pivots"],
      ["atrBands", "ATR bands"],
    ],
  },
  {
    key: "risk",
    label: "Risk",
    tools: [
      ["stopTarget", "Stop/Target"],
      ["signalMarkers", "Signals"],
      ["swingProjection", "Projection"],
    ],
  },
  {
    key: "momentum",
    label: "Momentum",
    tools: [
      ["volume", "Volume"],
      ["macd", "MACD"],
      ["rsi", "RSI"],
      ["dmi", "DMI/ADX"],
      ["williamsR", "Williams %R"],
      ["stochastic", "Stochastic"],
      ["relativeVolume", "Rel volume"],
      ["bollinger", "Bollinger"],
    ],
  },
  {
    key: "view",
    label: "View",
    tools: [["tooltip", "Tooltip"]],
  },
];

const chartColors = {
  up: "#16853a",
  upFill: "#e6f4ed",
  down: "#b9292f",
  downFill: "#f9e4e6",
  ema20: "#1f7ae0",
  ema50: "#0b3557",
  ema200: "#b9292f",
  sma20: "#ff8a2a",
  sma50: "#8f43c7",
  sma200: "#8f43c7",
  bollinger: "#9b4bc7",
  rsi: "#c6d800",
  williamsR: "#9b4bc7",
  plusDI: "#119cf2",
  minusDI: "#c6d800",
  adx: "#22c7b8",
  macd: "#6f2da8",
  macdSignal: "#35d8c4",
  grid: "#d7dde5",
  axis: "#c8d0da",
  projectionFill: "#dbeafe",
  cursor: "#475569",
};

const chartIndicatorHelp = {
  ema20: "EMA20: fast trend line. Good for short-term trend direction.",
  ema50: "EMA50: medium trend line. Often used as dynamic support/resistance.",
  ema200: "EMA200: long trend line. Price above it is usually stronger.",
  sma20: "SMA20: 20-period simple average.",
  sma50: "SMA50: 50-period simple average.",
  sma200: "SMA200: 200-period simple average.",
  bbUpper: "BB Upper: upper Bollinger Band. Price near it can be stretched.",
  bbLower: "BB Lower: lower Bollinger Band. Price near it can be weak or oversold.",
  vwap: "VWAP: volume-weighted average price. Day traders use it as fair value.",
  stop: "Stop: invalidation level. Trade idea is wrong below/above this area.",
  target: "Target: planned profit area.",
  entry: "Entry: trigger price area for the plan.",
  supertrendUp: "Supertrend Up: trend-following support line.",
  supertrendDown: "Supertrend Down: trend-following resistance line.",
  previousClose: "Prev: previous daily close.",
  openingRangeHigh: "OR High: opening range high.",
  openingRangeLow: "OR Low: opening range low.",
  pivot: "P: pivot point from the previous session.",
  r1: "R1: first resistance level.",
  r2: "R2: second resistance level.",
  s1: "S1: first support level.",
  s2: "S2: second support level.",
};

const signalStyles = {
  "ENTRY CONFIRMED": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "ENTRY WATCH": "bg-sky-100 text-sky-900 border-sky-300",
  WAIT: "bg-amber-100 text-amber-900 border-amber-300",
  "EXIT WATCH": "bg-orange-100 text-orange-900 border-orange-300",
  "EXIT TRIGGER": "bg-rose-100 text-rose-900 border-rose-300",
  AVOID: "bg-slate-200 text-slate-900 border-slate-300",
};

const signalGlossary = {
  "ENTRY CONFIRMED": "Buy signal is confirmed now: latest closed candle passed all entry checks.",
  "ENTRY WATCH": "Setup is almost ready, but do not buy yet. Wait for the exact trigger candle close.",
  WAIT: "No trade now. Conditions are mixed or risk/reward is not strong enough.",
  "EXIT WATCH": "Early weakness warning. Holders should watch stop/EMA levels closely for possible exit.",
  "EXIT TRIGGER": "Exit condition is already triggered. New entry is blocked until structure improves.",
  AVOID: "Market structure is weak for this setup. Skip until trend and momentum recover.",
  "BUY CONFIRM": "This indicator strongly supports a long setup right now.",
  "BUY WATCH": "This indicator is improving but still needs more confirmation.",
  "OUT WATCH": "This indicator warns of possible weakness/exhaustion.",
  OUT: "This indicator shows an active exit condition.",
  "NO TRADE": "Risk quality is too low for this setup.",
  NEUTRAL: "Indicator is not adding a strong directional edge right now.",
};

export default function StockTradingPage() {
  const [tickersText, setTickersText] = useState(defaultTickers.join(", "));
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [selectedTicker, setSelectedTicker] = useState(defaultTickers[0]);
  const [timeframe, setTimeframe] = useState("6M");
  const [chartType, setChartType] = useState("candles");
  const [chartWorkspace, setChartWorkspace] = useState("chart1");
  const [activePreset, setActivePreset] = useState("clean");
  const [chartTools, setChartTools] = useState(chartPresetTools.clean);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState("off");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => data?.results?.find((item) => item.ticker === selectedTicker && item.ok) || data?.results?.find((item) => item.ok),
    [data, selectedTicker]
  );

  const loadSignals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        tickers: tickersText,
        accountSize: String(accountSize),
        riskPercent: String(riskPercent),
        period: "5y",
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
  }, [accountSize, riskPercent, selectedTicker, tickersText]);

  useEffect(() => {
    loadSignals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoRefreshMinutes === "off") return undefined;
    const interval = window.setInterval(() => {
      loadSignals();
    }, Number(autoRefreshMinutes) * 60000);
    return () => window.clearInterval(interval);
  }, [autoRefreshMinutes, loadSignals]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflowX;
    const previousHtmlOverflow = document.documentElement.style.overflowX;
    const previousBodyMaxWidth = document.body.style.maxWidth;
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    document.body.style.maxWidth = "100vw";
    return () => {
      document.body.style.overflowX = previousBodyOverflow;
      document.documentElement.style.overflowX = previousHtmlOverflow;
      document.body.style.maxWidth = previousBodyMaxWidth;
    };
  }, []);

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 md:flex-row md:items-center md:justify-between">
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

      <section className="mx-auto grid w-full max-w-[1720px] min-w-0 gap-4 overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <section className="min-w-0 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
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

          <section className="min-w-0 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
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

          <section className="min-w-0 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Signal Meaning</h2>
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              <p><strong>ENTRY CONFIRMED:</strong> latest closed candle confirms the entry rule.</p>
              <p><strong>ENTRY WATCH:</strong> setup is forming, but entry needs a candle close above the trigger.</p>
              <p><strong>WAIT:</strong> do not enter until the exact price condition appears.</p>
              <p><strong>EXIT WATCH:</strong> weakness is starting; watch the exit level closely.</p>
              <p><strong>EXIT TRIGGER:</strong> the rule says the setup has failed or should be exited.</p>
            </div>
          </section>
        </aside>

        <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
          {selected ? (
            <>
              <ChartPanel
                item={selected}
                data={data}
                rows={data?.results || []}
                selectedTicker={selectedTicker}
                onSelectTicker={setSelectedTicker}
                onRefresh={loadSignals}
                loading={loading}
                autoRefreshMinutes={autoRefreshMinutes}
                onAutoRefreshChange={setAutoRefreshMinutes}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                chartType={chartType}
                onChartTypeChange={setChartType}
                chartWorkspace={chartWorkspace}
                onChartWorkspaceChange={(workspace) => {
                  setChartWorkspace(workspace);
                  if (workspace === "chart2") {
                    setActivePreset("pro");
                    setChartType("heikinAshi");
                    setChartTools(chartPresetTools.pro);
                  }
                }}
                activePreset={activePreset}
                onApplyPreset={(preset) => {
                  setActivePreset(preset);
                  setChartTools(chartPresetTools[preset] || defaultChartTools);
                  if (preset === "day") setTimeframe("1D");
                  if (preset === "investment") setTimeframe("2Y");
                  if (preset === "pro") setChartWorkspace("chart2");
                }}
                tools={chartTools}
                onToggleTool={(tool) => {
                  setActivePreset("custom");
                  setChartTools((current) => ({ ...current, [tool]: !current[tool] }));
                }}
                onSetTools={(nextTools) => {
                  setActivePreset("custom");
                  setChartTools(nextTools);
                }}
              />
              <SingleAnalysis item={selected} />
              <div className="hidden sm:contents">
                <BeginnerPlan item={selected} />
                <OneDayTradeChecklist item={selected} />
                <TraderSetupsPanel setups={selected.traderSetups || []} />
                <OverviewTable
                  rows={data?.results || []}
                  selectedTicker={selectedTicker}
                  onSelect={setSelectedTicker}
                  loading={loading}
                />
                <BacktestPanel item={selected} />
              </div>
            </>
          ) : (
            <section className="min-w-0 rounded-lg border border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              {loading ? "Loading ETF signals..." : "No ETF analysis loaded yet."}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function ChartTypeButtons({ value, onChange }) {
  return (
    <div className="-mx-1 flex max-w-full snap-x gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-start sm:overflow-visible xl:justify-end">
      {chartTypes.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`shrink-0 snap-start rounded-md border px-3 py-2 text-sm font-black ${
            value === item.key
              ? "border-sky-700 bg-sky-700 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${value === item.key ? "bg-emerald-300" : "bg-rose-400"}`} />
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function TimeframeButtons({ value, onChange }) {
  return (
    <div className="-mx-1 flex max-w-full snap-x gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
      {timeframes.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onChange(item.label)}
          className={`shrink-0 snap-start rounded-md border px-3 py-2 text-sm font-black ${
            value === item.label
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function OverviewTable({ rows, selectedTicker, onSelect, loading }) {
  const goodRows = rows.filter((row) => row.ok);
  const badRows = rows.filter((row) => !row.ok);
  return (
    <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Watchlist Scan</h2>
        <span className="text-xs font-semibold text-slate-500">{loading ? "Refreshing" : `${goodRows.length} loaded`}</span>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-[980px] w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {["Ticker", "Price", "Signal", "Score", "Trend", "RSI", "W%R", "MACD", "ADX", "Support", "Resistance", "Stop", "Target", "R/R"].map((heading) => (
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
                <td className="px-3 py-2">{number(row.williamsR)}</td>
                <td className="px-3 py-2">{row.macdStatus}</td>
                <td className="px-3 py-2">{number(row.adx)}</td>
                <td className="px-3 py-2">{money(row.support)}</td>
                <td className="px-3 py-2">{money(row.resistance)}</td>
                <td className="px-3 py-2">{money(row.stop)}</td>
                <td className="px-3 py-2">{money(row.target)}</td>
                <td className="px-3 py-2">{number(row.riskReward)}:1</td>
              </tr>
            ))}
            {badRows.map((row) => (
              <tr key={row.ticker} className="border-t border-slate-100 bg-rose-50">
                <td className="px-3 py-2 font-black">{row.ticker}</td>
                <td className="px-3 py-2 text-rose-700" colSpan={13}>{row.error}</td>
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
    <section className="min-w-0 max-w-full overflow-x-hidden rounded-lg border border-slate-300 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-slate-950">{item.ticker}</h2>
            <SignalPill signal={item.signal} />
            <span className="rounded-md border border-slate-300 px-2 py-1 text-xs font-black text-slate-700">
              Score {item.score}/100
            </span>
          </div>
          <div className="hidden sm:block">
            <ActionBlock item={item} />
            <ScoreExplanationPanel item={item} />
            <RuleEnginePanel item={item} />
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 text-xs md:min-w-[320px]">
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

function BeginnerPlan({ item }) {
  const action = item.action || {};
  const strategies = item.strategies || [];
  const entryText = action.enterOnlyIf
    ? withPeriod(capitalizeSentence(action.enterOnlyIf))
    : "Wait for the entry rule to appear.";
  const warning = action.whatCanGoWrong || "If the rule fails, do not force the trade.";

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Beginner Trade Plan</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-black text-slate-950 sm:text-3xl">{money(item.price)}</span>
            <SignalPill signal={item.signal} />
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">Rule-based signal, not financial advice</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <PlanStep label="1. What now" value={action.now || item.signal} detail={action.why || "Use the exact rule below before acting."} />
            <PlanStep label="2. Entry rule" value={entryText} detail="Do not enter before this candle/price condition is true." />
            <PlanStep label="3. Failure rule" value={warning} detail="This is the main reason to stand aside or exit." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Current price" value={money(item.price)} />
          <Metric label="Entry trigger" value={action.enterOnlyIf ? action.enterOnlyIf.replace(/^daily candle closes above /i, "Above ") : "-"} />
          <Metric label="Stop area" value={money(action.stopArea ?? item.stop)} />
          <Metric label="Target area" value={money(action.targetArea ?? item.target)} />
          <Metric label="Risk / reward" value={`${number(action.riskReward ?? item.riskReward)}:1`} />
          <Metric label="Position size" value={`${item.shares || 0} shares`} />
        </div>
      </div>
      {strategies.length ? (
        <div className="mt-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-950">Buy / Sell Plans With Money Calculation</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Shares are calculated from your account size and risk %. Example: account risk dollars divided by risk per share.
              </p>
            </div>
            <p className="text-xs font-bold text-slate-500">Use the plan that matches your holding time. Do not mix day-trade stops with swing targets.</p>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            {strategies.map((plan) => (
              <StrategyCard key={plan.label} plan={plan} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StrategyCard({ plan }) {
  return (
    <article className={`rounded-lg border p-3 ${plan.enabled === false ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-black text-slate-950">{plan.label}</h4>
          <p className="text-xs font-bold text-slate-500">{plan.horizon}</p>
        </div>
        <SignalPill signal={plan.now} />
      </div>
      <p className="mt-3 text-sm font-bold leading-5 text-slate-700">{plan.why}</p>
      <div className="mt-3 rounded-md border border-sky-200 bg-white p-3 text-sm font-bold leading-5 text-slate-800">
        <span className="font-black text-slate-950">Entry rule: </span>{plan.entryCondition}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric label="Entry" value={money(plan.entry)} />
        <Metric label="Stop" value={money(plan.stop)} />
        <Metric label="Target" value={money(plan.target)} />
        <Metric label="R/R" value={`${number(plan.riskReward)}:1`} />
        <Metric label="Buy shares" value={plan.shares || 0} />
        <Metric label="Spend about" value={money(plan.spend)} />
        <Metric label="Max loss" value={money(plan.maxLoss)} />
        <Metric label="Possible profit" value={money(plan.potentialProfit)} />
        <Metric label="Target return" value={`${number(plan.targetReturnPct)}%`} />
      </div>
      <p className="mt-3 text-xs font-bold text-slate-500">{plan.calculation}</p>
      <p className="mt-2 text-xs font-bold text-rose-700">Warning: {plan.warning}</p>
    </article>
  );
}

function OneDayTradeChecklist({ item }) {
  const day = item.ruleEngine?.day;
  const plan = item.strategies?.find((strategy) => strategy.label === "Day trade");
  if (!day || !plan) return null;

  const disabled = day.enabled === false || plan.enabled === false;
  const steps = disabled
    ? [
        ["1", "Load intraday candles", day.enterOnlyIf],
        ["2", "Do not trade from daily candles", day.warning],
        ["3", "Refresh during market hours", "Yahoo must return enough 5-minute bars before this checklist becomes active."],
      ]
    : [
        ["1", "Entry trigger", plan.entryCondition],
        ["2", "Risk size", `Buy up to ${plan.shares || 0} shares. Spend about ${money(plan.spend)} and keep max loss near ${money(plan.maxLoss)}.`],
        ["3", "Stop", `Exit if a 5-minute candle closes below ${money(plan.stop)}.`],
        ["4", "Target", `Take profit near ${money(plan.target)} or tighten if momentum fades before the close.`],
        ["5", "End of day", "Close or reassess before the session ends; this is not a swing hold plan."],
      ];

  return (
    <section className={`rounded-lg border p-4 shadow-sm ${disabled ? "border-amber-200 bg-amber-50" : "border-sky-200 bg-white"}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">1-Day Trade Steps</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SignalPill signal={day.now} />
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-700">
              5-minute rule set
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-700">
              Max risk {number(day.riskPercentUsed ?? 0.5)}%
            </span>
          </div>
          <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-700">{day.why}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs md:min-w-[360px]">
          <Metric label="Entry" value={money(plan.entry)} />
          <Metric label="Stop" value={money(plan.stop)} />
          <Metric label="Target" value={money(plan.target)} />
          <Metric label="R/R" value={`${number(plan.riskReward)}:1`} />
          <Metric label="Opening high" value={money(day.openingRangeHigh)} />
          <Metric label="Opening low" value={money(day.openingRangeLow)} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {steps.map(([index, title, detail]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index}</div>
            <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-bold text-rose-700">No broker connection, no automatic orders, and no guaranteed profit. Use this as an analysis checklist only.</p>
    </section>
  );
}

function RuleEnginePanel({ item }) {
  const rules = item.ruleEngine?.indicatorRules || [];
  const modes = [item.ruleEngine?.day, item.ruleEngine?.swing, item.ruleEngine?.position].filter(Boolean);
  if (!rules.length && !modes.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Rule Engine: Why Buy / Wait / Out</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Daily rules use candles, volume, Williams %R, DMI/ADX, MACD, Bollinger Bands, moving averages, and risk/reward.
          </p>
        </div>
        <span className="text-xs font-black text-slate-500">{item.ruleEngine?.source}</span>
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        {modes.map((mode) => (
          <div key={mode.mode} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-slate-950">{mode.mode}</p>
              <SignalPill signal={mode.now} />
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{mode.why}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              <span className="font-black text-slate-800">Rule: </span>{mode.enterOnlyIf}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {rules.map((rule) => (
          <div key={rule.name} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">{rule.name}</p>
              <RuleStatusPill status={rule.status} />
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{rule.why}</p>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">{rule.rule}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreExplanationPanel({ item }) {
  const rows = item.scoreDetails?.rows || [];
  const projection = item.swingProjection;
  if (!rows.length && !projection) return null;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Signal Score & 5-Day Swing Pattern</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Score is rule-based. The swing projection averages recent bullish and bearish run length, then projects the current measured move inside the latest five-candle weekly high/low.
          </p>
        </div>
        <span className="text-sm font-black text-slate-950">{item.score}/100</span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-slate-950">{row.label}</p>
              <p className="text-xs font-black text-slate-700">{row.points}/{row.max}</p>
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-600">{row.detail}</p>
          </div>
        ))}
      </div>
      {projection ? (
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <Metric label="Pattern" value={`${projection.direction} day ${projection.durationDays}/${projection.expectedDays}`} />
          <Metric label="Projected price" value={money(projection.projectedPrice)} />
          <Metric label="Weekly scope" value={`${money(projection.weeklyLow)} - ${money(projection.weeklyHigh)}`} />
          <Metric label="Avg moves" value={`Bull ${number(projection.averageBullMovePct)}% / Bear ${number(projection.averageBearMovePct)}%`} />
        </div>
      ) : null}
    </div>
  );
}

function PlanStep({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-base font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function ActionBlock({ item }) {
  const action = item.action;
  const rows = action
    ? [
        ["NOW", action.now],
        ["WHY", action.why],
        ["ENTER ONLY IF", withPeriod(capitalizeSentence(action.enterOnlyIf))],
        ["STOP AREA", withPeriod(money(action.stopArea))],
        ["TARGET AREA", withPeriod(money(action.targetArea))],
        ["RISK/REWARD", withPeriod(`${number(action.riskReward)}:1`)],
        ["WHAT CAN GO WRONG", action.whatCanGoWrong],
      ]
    : String(item.reason || "")
        .split("\n")
        .map((line) => {
          const [label, ...rest] = line.split(":");
          return [label, rest.join(":").trim()];
        });

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Action:</h3>
      <dl className="mt-3 grid gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 sm:grid-cols-[150px_1fr]">
            <dt className="font-black text-slate-950">{label}:</dt>
            <dd className="font-semibold text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ChartPanel({
  item,
  data,
  rows: watchlistRows,
  selectedTicker,
  onSelectTicker,
  onRefresh,
  loading,
  autoRefreshMinutes,
  onAutoRefreshChange,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  chartWorkspace,
  onChartWorkspaceChange,
  activePreset,
  onApplyPreset,
  tools,
  onToggleTool,
  onSetTools,
}) {
  const rows = useMemo(() => chartRowsForTimeframe(item, timeframe), [item, timeframe]);
  const latest = rows[rows.length - 1] || {};
  const timeframeLabel = timeframe === "1D" && item.intradayChart?.length
    ? "1 day, 5-minute candles"
    : timeframe === "1D"
      ? "latest daily candle"
      : `${timeframe} daily candles`;
  const indicatorCards = [
    tools.volume ? <VolumeChart key="volume" rows={rows} /> : null,
    tools.macd ? <MacdChart key="macd" rows={rows} /> : null,
    tools.rsi ? <SparkChart key="rsi" title="RSI 14" rows={rows} keys={[["rsi", chartColors.rsi]]} height={150} fixedMin={0} fixedMax={100} levels={[70, 30]} note="Above 70 is stretched. Below 30 is oversold." /> : null,
    tools.stochastic ? <SparkChart key="stochastic" title="Stochastic 14/3" rows={withStochasticRows(rows)} keys={[["stochK", "#0ea5e9"], ["stochD", "#ef4444"]]} height={150} fixedMin={0} fixedMax={100} levels={[80, 20]} note="Short-term momentum. Above 80 is hot; below 20 is cold." /> : null,
    tools.williamsR ? <SparkChart key="williamsR" title="Williams %R" rows={rows} keys={[["williamsR", chartColors.williamsR]]} height={150} fixedMin={-100} fixedMax={0} levels={[-20, -80]} note={williamsStatus(latest.williamsR)} /> : null,
    tools.dmi ? <SparkChart key="dmi" title="DMI 14" rows={rows} keys={[["plusDI", chartColors.plusDI], ["minusDI", chartColors.minusDI], ["adx", chartColors.adx]]} height={150} fixedMin={0} fixedMax={60} note="+DI over -DI favors buyers. ADX shows trend strength." /> : null,
    tools.relativeVolume ? <RelativeVolumeCard key="relativeVolume" rows={rows} /> : null,
  ].filter(Boolean);
  const isProWorkspace = chartWorkspace === "chart2";

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <ChartTopControls
        data={data}
        watchlistRows={watchlistRows}
        selectedTicker={selectedTicker}
        onSelectTicker={onSelectTicker}
        onRefresh={onRefresh}
        loading={loading}
        autoRefreshMinutes={autoRefreshMinutes}
        onAutoRefreshChange={onAutoRefreshChange}
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        chartType={chartType}
        onChartTypeChange={onChartTypeChange}
        chartWorkspace={chartWorkspace}
        onChartWorkspaceChange={onChartWorkspaceChange}
        activePreset={activePreset}
        onApplyPreset={onApplyPreset}
      />
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
            {isProWorkspace ? "Chart 2 Pro Stack" : "Chart 1 Clean Price Chart"}
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {timeframeLabel}. Rule signals still use daily candle close; 1D chart uses intraday candles when Yahoo returns them.
          </p>
        </div>
        <DataSourceBadge />
      </div>
      <div className="mt-4 min-w-0 max-w-full">
        <ChartToolBar tools={tools} onToggleTool={onToggleTool} onSetTools={onSetTools} />
      </div>
      <div className="mt-4">
        <CandlestickChart
          key={`${item.ticker}-${timeframe}-${chartType}-${chartWorkspace}-${rows.length}`}
          rows={rows}
          item={item}
          tools={tools}
          timeframe={timeframe}
          chartType={chartType}
        />
      </div>
      {isProWorkspace ? <ProStackSummary /> : <ChartRuleOverlay item={item} />}
      <div className="mt-3 grid min-w-0 grid-cols-4 gap-1.5 sm:mt-4 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open" value={money(latest.open)} />
        <Metric label="High" value={money(latest.high)} />
        <Metric label="Low" value={money(latest.low)} />
        <Metric label="Close" value={money(latest.close)} />
      </div>
      <div className="mt-4 hidden gap-4 md:grid">
        {indicatorCards}
      </div>
    </section>
  );
}

function ChartRuleOverlay({ item }) {
  const notes = item.ruleEngine?.chartNotes || [];
  if (!notes.length) return null;

  return (
    <div className="mt-4 hidden gap-2 sm:grid lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_130px_130px]">
      {notes.map((note) => (
        <div
          key={note.label}
          className={`rounded-lg border p-3 ${
            note.tone === "danger"
              ? "border-rose-200 bg-rose-50"
              : note.tone === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{note.label}</p>
          <p className="mt-1 text-xs font-black leading-5 text-slate-950">{note.value || "-"}</p>
        </div>
      ))}
    </div>
  );
}

function ChartTopControls({
  data,
  watchlistRows,
  selectedTicker,
  onSelectTicker,
  onRefresh,
  loading,
  autoRefreshMinutes,
  onAutoRefreshChange,
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  chartWorkspace,
  onChartWorkspaceChange,
  activePreset,
  onApplyPreset,
}) {
  return (
    <div className="min-w-0 max-w-full overflow-x-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <select
              value={selectedTicker}
              onChange={(event) => onSelectTicker(event.target.value)}
              className="min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-base font-black text-slate-950 sm:w-full sm:max-w-xs sm:text-lg"
            >
              {(watchlistRows || []).filter((row) => row.ok).map((row) => (
                <option key={row.ticker} value={row.ticker}>{row.ticker}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-md bg-sky-600 px-3 py-2 text-sm font-black text-white disabled:cursor-wait disabled:bg-slate-400 sm:px-4"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <label className="col-span-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500 sm:col-span-1">
              Auto
              <select
                value={autoRefreshMinutes}
                onChange={(event) => onAutoRefreshChange(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm font-bold normal-case tracking-normal text-slate-900"
              >
                <option value="off">Off</option>
                <option value="1">1 min</option>
                <option value="5">5 min</option>
                <option value="15">15 min</option>
              </select>
            </label>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Data source: Yahoo Finance chart endpoint. Manual/auto refresh only; no broker feed, no websocket, no order execution. Last loaded: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "not loaded yet"}.
          </p>
        </div>
        <div className="min-w-0 max-w-full space-y-2 overflow-x-hidden">
          <SwitchRow>
            {chartWorkspaces.map((workspace) => (
              <ModeSwitchButton
                key={workspace.key}
                active={chartWorkspace === workspace.key}
                label={workspace.label}
                detail={workspace.detail}
                onClick={() => onChartWorkspaceChange(workspace.key)}
              />
            ))}
          </SwitchRow>
          <SwitchRow>
            {chartPresets.map((preset) => (
              <ModeSwitchButton
                key={preset.key}
                active={activePreset === preset.key}
                neutral={activePreset === "custom"}
                label={preset.label}
                detail={preset.detail}
                onClick={() => onApplyPreset(preset.key)}
              />
            ))}
          </SwitchRow>
          <ChartTypeButtons value={chartType} onChange={onChartTypeChange} />
          <TimeframeButtons value={timeframe} onChange={onTimeframeChange} />
        </div>
      </div>
    </div>
  );
}

function SwitchRow({ children }) {
  return <div className="-mx-1 flex max-w-full snap-x gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible xl:justify-end">{children}</div>;
}

function ModeSwitchButton({ active, neutral = false, label, detail, onClick }) {
  const color = active ? "bg-emerald-500" : neutral ? "bg-slate-400" : "bg-rose-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[92px] shrink-0 snap-start rounded-md border px-2.5 py-2 text-left ${
        active ? "border-slate-950 bg-white text-slate-950" : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-black">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="mt-1 block text-[10px] font-bold text-slate-500">{detail}</span>
    </button>
  );
}

function DataSourceBadge() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
      Delayed/API data, not broker live tape
    </div>
  );
}

function ProStackSummary() {
  return (
    <div className="mt-4 hidden gap-2 sm:grid md:grid-cols-3">
      <MiniInfo title="Day trade" text="VWAP, opening range, previous close, Supertrend, volume." />
      <MiniInfo title="Swing trade" text="EMA/SMA trend, Bollinger, MACD, RSI, DMI/ADX." />
      <MiniInfo title="Long trend" text="EMA200/SMA200 and Ichimoku-style cloud context." />
    </div>
  );
}

function MiniInfo({ title, text }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-700">{text}</p>
    </div>
  );
}

function ChartToolBar({ tools, onToggleTool, onSetTools }) {
  return (
    <div className="min-w-0 max-w-full overflow-x-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
      <div className="-mx-1 grid max-w-full auto-cols-[minmax(172px,210px)] grid-flow-col gap-2 overflow-x-auto px-1 pb-1 sm:auto-cols-[minmax(190px,240px)] sm:gap-3 xl:mx-0 xl:grid-flow-row xl:grid-cols-5 xl:overflow-visible xl:px-0 xl:pb-0">
        {toolGroups.map((group) => (
          <ToolGroup key={group.key} group={group} tools={tools} onToggleTool={onToggleTool} onSetTools={onSetTools} />
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        <strong>Switch colors:</strong> green on, red off, grey mixed group. Hover chart for values, scroll/pinch to zoom, drag to pan.
      </p>
    </div>
  );
}

function ToolGroup({ group, tools, onToggleTool, onSetTools }) {
  const states = group.tools.map(([key]) => Boolean(tools[key]));
  const allOn = states.every(Boolean);
  const allOff = states.every((value) => !value);
  const groupState = allOn ? "on" : allOff ? "off" : "mixed";
  const color = groupState === "on" ? "bg-emerald-500" : groupState === "off" ? "bg-rose-500" : "bg-slate-400";
  const icon = groupState === "on" ? "✓" : groupState === "off" ? "×" : "−";

  function toggleGroup() {
    const nextValue = !allOn;
    onSetTools({
      ...tools,
      ...Object.fromEntries(group.tools.map(([key]) => [key, nextValue])),
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <button type="button" onClick={toggleGroup} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50">
        <span className="text-xs font-black uppercase tracking-wide text-slate-700">{group.label}</span>
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white ${color}`}>{icon}</span>
      </button>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {group.tools.map(([key, label]) => (
          <ToolSwitch key={key} active={Boolean(tools[key])} label={label} onClick={() => onToggleTool(key)} />
        ))}
      </div>
    </div>
  );
}

function ToolSwitch({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-black ${
        active ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function CandlestickChart({ rows, item, tools, timeframe, chartType }) {
  return <TradingViewChart rows={rows} item={item} tools={tools} timeframe={timeframe} chartType={chartType} />;
}

function TradingViewChart({ rows, item, tools, timeframe, chartType }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [focusedIndicator, setFocusedIndicator] = useState(null);
  const [overlayLabels, setOverlayLabels] = useState([]);
  const validRows = useMemo(() => rows.filter(isValidPriceRow), [rows]);
  const displayRows = useMemo(() => {
    if (chartType === "heikinAshi") return buildHeikinAshiRows(validRows);
    if (chartType === "renko") return buildRenkoRows(validRows);
    return validRows;
  }, [chartType, validRows]);
  const focusChoices = useMemo(
    () => buildFocusChoices(validRows, item, tools, timeframe),
    [validRows, item, tools, timeframe]
  );
  const activeFocusedIndicator = focusChoices.some((choice) => choice.key === focusedIndicator) ? focusedIndicator : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !displayRows.length) return undefined;

    container.replaceChildren();
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 620,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#334155",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: "#eef2f7" },
        horzLines: { color: "#e2e8f0" },
      },
      rightPriceScale: {
        borderColor: "#cbd5e1",
        scaleMargins: { top: 0.08, bottom: tools.volume ? 0.22 : 0.08 },
      },
      timeScale: {
        borderColor: "#cbd5e1",
        timeVisible: timeframe === "1D",
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: timeframe === "1D" ? 8 : 6,
        tickMarkFormatter: (time) => formatChartAxisTime(time, timeframe),
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#64748b", style: 2, labelBackgroundColor: "#0f172a" },
        horzLine: { color: "#64748b", style: 2, labelBackgroundColor: "#0f172a" },
      },
      localization: {
        priceFormatter: (price) => money(price),
        timeFormatter: (time) => formatChartCrosshairTime(time, timeframe),
      },
    });
    chartRef.current = chart;

    const primarySeries = addPrimarySeries(chart, displayRows, chartType);

    const lineFocusOptions = (key, color, options = {}) => {
      const isFocused = activeFocusedIndicator === key;
      const hasFocus = Boolean(activeFocusedIndicator);
      return {
        color: hasFocus && !isFocused ? hexToRgba(color, 0.28) : color,
        lineWidth: isFocused ? 4 : options.lineWidth || 2,
        lineStyle: isFocused ? 0 : options.lineStyle || 0,
        lastValueVisible: false,
        priceLineVisible: false,
      };
    };

    const priceLineFocusOptions = (key, color, options = {}) => {
      const isFocused = activeFocusedIndicator === key;
      const hasFocus = Boolean(activeFocusedIndicator);
      return {
        color: hasFocus && !isFocused ? hexToRgba(color, 0.3) : color,
        lineWidth: isFocused ? 4 : options.lineWidth || 1,
        lineStyle: isFocused ? 0 : options.lineStyle || 2,
        axisLabelVisible: false,
      };
    };

    const addLine = (key, color, title, options = {}) => {
      if (options.enabled === false) return null;
      if (Object.prototype.hasOwnProperty.call(tools, key) && !tools[key]) return null;
      const data = validRows
        .filter((row) => Number.isFinite(row[key]))
        .map((row) => ({ time: chartTime(row), value: row[key] }));
      if (!data.length) return null;
      const focusOptions = lineFocusOptions(key, color, options);
      const series = chart.addSeries(LineSeries, {
        color: focusOptions.color,
        lineWidth: focusOptions.lineWidth,
        lineStyle: focusOptions.lineStyle,
        priceLineVisible: focusOptions.priceLineVisible,
        lastValueVisible: focusOptions.lastValueVisible,
        title,
      });
      series.setData(data);
      return series;
    };

    addLine("ema20", chartColors.ema20, "EMA20");
    addLine("ema50", chartColors.ema50, "EMA50", { lineWidth: 1 });
    addLine("ema200", chartColors.ema200, "EMA200", { lineWidth: 1 });
    addLine("sma20", chartColors.sma20, "SMA20", { lineStyle: 2 });
    addLine("sma50", chartColors.sma50, "SMA50");
    addLine("sma200", chartColors.sma200, "SMA200", { lineStyle: 2 });
    addLine("bbUpper", chartColors.bollinger, "BB Upper", { lineWidth: 1, enabled: tools.bollinger });
    addLine("bbLower", chartColors.bollinger, "BB Lower", { lineWidth: 1, enabled: tools.bollinger });

    if (tools.supertrend) {
      const supertrend = buildSupertrendData(validRows);
      [
        ["supertrendUp", "Supertrend up", supertrend.up, chartColors.up],
        ["supertrendDown", "Supertrend down", supertrend.down, chartColors.down],
      ].forEach(([key, title, seriesData, color]) => {
        if (!seriesData.length) return;
        const focusOptions = lineFocusOptions(key, color);
        const series = chart.addSeries(LineSeries, {
          color: focusOptions.color,
          lineWidth: focusOptions.lineWidth,
          lineStyle: focusOptions.lineStyle,
          priceLineVisible: false,
          lastValueVisible: focusOptions.lastValueVisible,
          title,
        });
        series.setData(seriesData);
      });
    }

    if (tools.ichimoku) {
      const cloud = buildIchimokuData(validRows);
      [
        ["Tenkan 9", cloud.conversion, "#0ea5e9", 1],
        ["Kijun 26", cloud.base, "#ef4444", 1],
        ["Cloud A", cloud.spanA, "rgba(22, 133, 58, 0.82)", 2],
        ["Cloud B", cloud.spanB, "rgba(185, 41, 47, 0.82)", 2],
      ].forEach(([title, seriesData, color, lineStyle]) => {
        if (!seriesData.length) return;
        const series = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle,
          priceLineVisible: false,
          lastValueVisible: false,
          title,
        });
        series.setData(seriesData);
      });
    }

    if (tools.vwap) {
      const vwapData = buildVwapData(validRows);
      if (vwapData.length) {
        const focusOptions = lineFocusOptions("vwap", "#0f766e");
        const vwapSeries = chart.addSeries(LineSeries, {
          color: focusOptions.color,
          lineWidth: focusOptions.lineWidth,
          lineStyle: focusOptions.lineStyle,
          priceLineVisible: false,
          lastValueVisible: focusOptions.lastValueVisible,
          title: "VWAP",
        });
        vwapSeries.setData(vwapData);
      }
    }

    if (tools.volume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volumeSeries.setData(validRows.map((row) => ({
        time: chartTime(row),
        value: row.volume || 0,
        color: row.close >= row.open ? "rgba(22, 133, 58, 0.35)" : "rgba(185, 41, 47, 0.35)",
      })));
    }

    if (tools.volumeProfile) {
      const profileData = buildVolumeProfileData(validRows);
      profileData.forEach((level) => {
        primarySeries.createPriceLine({
          price: level.price,
          color: `rgba(15, 23, 42, ${level.opacity})`,
          lineWidth: level.isPointOfControl ? 2 : 1,
          lineStyle: level.isPointOfControl ? 0 : 2,
          axisLabelVisible: false,
          title: level.isPointOfControl ? "POC" : "",
        });
      });
    }

    if (tools.stopTarget) {
      [
        ["stop", "Stop", item.stop, chartColors.down],
        ["target", "Target", item.target, chartColors.up],
        ["entry", "Entry", item.action?.enterOnlyIfPrice || item.strategies?.find((plan) => plan.label === "Day trade")?.entry, chartColors.ema20],
      ]
        .filter(([, , value]) => Number.isFinite(value))
        .forEach(([key, title, price, color]) => {
          const focusOptions = priceLineFocusOptions(key, color, { lineWidth: 2 });
          primarySeries.createPriceLine({
            price,
            color: focusOptions.color,
            lineWidth: focusOptions.lineWidth,
            lineStyle: focusOptions.lineStyle,
            axisLabelVisible: focusOptions.axisLabelVisible,
            title,
          });
        });
    }

    if (tools.openingRange && timeframe === "1D") {
      const openingRange = buildOpeningRange(validRows);
      if (openingRange) {
        [
          ["openingRangeHigh", "OR High", openingRange.high, "#0369a1"],
          ["openingRangeLow", "OR Low", openingRange.low, "#7c3aed"],
        ].forEach(([key, title, price, color]) => {
          const focusOptions = priceLineFocusOptions(key, color);
          primarySeries.createPriceLine({
            price,
            color: focusOptions.color,
            lineWidth: focusOptions.lineWidth,
            lineStyle: focusOptions.lineStyle,
            axisLabelVisible: focusOptions.axisLabelVisible,
            title,
          });
        });
      }
    }

    if (tools.previousClose && timeframe === "1D") {
      const previousClose = previousDailyClose(item);
      if (Number.isFinite(previousClose)) {
        const focusOptions = priceLineFocusOptions("previousClose", "#64748b", { lineStyle: 3 });
        primarySeries.createPriceLine({
          price: previousClose,
          color: focusOptions.color,
          lineWidth: focusOptions.lineWidth,
          lineStyle: focusOptions.lineStyle,
          axisLabelVisible: focusOptions.axisLabelVisible,
          title: "Prev",
        });
      }
    }

    if (tools.pivots) {
      buildPivotLevels(item).forEach((level) => {
        const focusOptions = priceLineFocusOptions(level.key, level.color, { lineWidth: level.major ? 2 : 1, lineStyle: level.major ? 0 : 2 });
        primarySeries.createPriceLine({
          price: level.price,
          color: focusOptions.color,
          lineWidth: focusOptions.lineWidth,
          lineStyle: focusOptions.lineStyle,
          axisLabelVisible: focusOptions.axisLabelVisible,
          title: level.label,
        });
      });
    }

    if (tools.atrBands) {
      buildAtrBands(validRows).forEach((level) => {
        primarySeries.createPriceLine({
          price: level.price,
          color: level.color,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: level.label,
        });
      });
    }

    if (tools.signalMarkers) {
      const latest = displayRows[displayRows.length - 1];
      const isEntry = item.signal?.includes("ENTRY");
      const isExit = item.signal?.includes("EXIT");
      createSeriesMarkers(primarySeries, [{
        time: chartTime(latest),
        position: isEntry ? "belowBar" : "aboveBar",
        color: isEntry ? chartColors.up : isExit ? chartColors.down : chartColors.sma20,
        shape: isEntry ? "arrowUp" : isExit ? "arrowDown" : "circle",
        text: `${isEntry ? "BUY" : isExit ? "OUT" : "WAIT"} ${item.score}/100`,
      }]);
    }

    chart.timeScale().fitContent();

    const updateOverlayLabels = () => {
      const height = container.clientHeight || 620;
      const labels = focusChoices
        .map((choice) => {
          if (!Number.isFinite(choice.price)) return null;
          const y = primarySeries.priceToCoordinate(choice.price);
          if (!Number.isFinite(y)) return null;
          return {
            ...choice,
            y: Math.max(16, Math.min(height - 18, y)),
          };
        })
        .filter(Boolean);
      setOverlayLabels(stackOverlayLabels(labels, height, activeFocusedIndicator));
    };
    const requestOverlayUpdate = () => {
      window.requestAnimationFrame(updateOverlayLabels);
    };
    requestOverlayUpdate();
    chart.timeScale().subscribeVisibleLogicalRangeChange(requestOverlayUpdate);

    chart.subscribeCrosshairMove((param) => {
      const row = validRows.find((entry) => chartTime(entry) === param.time);
      setHover(row ? { row } : null);
    });

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(requestOverlayUpdate);
      chart.remove();
      chartRef.current = null;
    };
  }, [displayRows, validRows, item, tools, timeframe, chartType, activeFocusedIndicator, focusChoices]);

  if (!validRows.length) {
    return <div className="flex min-h-[280px] items-center justify-center rounded-lg bg-slate-50 px-3 text-center text-sm font-bold text-slate-500 sm:min-h-[360px]">No valid chart data. Check 1D candle availability.</div>;
  }

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="absolute left-2 top-2 z-10 hidden max-w-[220px] rounded-md border border-slate-200 bg-white/95 px-2 py-1.5 shadow-sm sm:left-3 sm:top-3 sm:block sm:max-w-none sm:px-3 sm:py-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">TradingView Lightweight Chart</p>
          <p className="mt-1 hidden text-xs font-bold text-slate-700 sm:block">Scroll to zoom, drag to pan, hover for OHLC.</p>
        </div>
        {tools.tooltip && hover?.row ? (
          <div className="absolute right-2 top-2 z-10 grid max-w-[210px] grid-cols-2 gap-x-2 gap-y-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1.5 text-[11px] shadow-sm sm:right-3 sm:top-3 sm:max-w-none sm:gap-x-4 sm:px-3 sm:py-2 sm:text-xs">
            <span className="font-bold text-slate-500">Time</span><span className="font-black text-slate-950">{hover.row.date}</span>
            <span className="font-bold text-slate-500">O/H/L/C</span><span className="font-black text-slate-950">{money(hover.row.open)} / {money(hover.row.high)} / {money(hover.row.low)} / {money(hover.row.close)}</span>
            <span className="font-bold text-slate-500">Volume</span><span className="font-black text-slate-950">{number(hover.row.volume)}</span>
          </div>
        ) : null}
        {overlayLabels.length ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[92px] sm:w-[132px]">
            {overlayLabels.map((label) => {
              const active = activeFocusedIndicator === label.key;
              return (
                <button
                  key={label.key}
                  type="button"
                  title={chartIndicatorHelp[label.key] || label.label}
                  onClick={() => setFocusedIndicator(active ? null : label.key)}
                  className={`pointer-events-auto absolute right-0 grid h-6 grid-cols-[minmax(0,1fr)_42px] overflow-hidden rounded-l-md text-[9px] font-black shadow-sm transition sm:h-7 sm:grid-cols-[minmax(0,1fr)_56px] sm:text-xs ${
                    active ? "ring-2 ring-slate-950 ring-offset-1" : ""
                  }`}
                  style={{ top: `${label.y - 12}px` }}
                >
                  <span className="flex min-w-0 items-center justify-end gap-1 truncate px-1.5 text-white" style={{ backgroundColor: label.color }}>
                    <span className="truncate">{label.label}</span>
                  </span>
                  <span className="flex items-center justify-center text-white" style={{ backgroundColor: label.color }}>
                    {money(label.price)}
                  </span>
                </button>
              );
            })}
            {activeFocusedIndicator ? (
              <button
                type="button"
                onClick={() => setFocusedIndicator(null)}
                className="pointer-events-auto absolute right-0 top-2 rounded-l-md bg-slate-950 px-2 py-1 text-[11px] font-black text-white shadow-sm"
              >
                All
              </button>
            ) : null}
          </div>
        ) : null}
        <div ref={containerRef} className="h-[430px] w-full min-w-0 max-w-full touch-pan-y sm:h-[460px] md:h-[540px] xl:h-[620px]" />
    </div>
  );
}

function isValidPriceRow(row) {
  return [row?.open, row?.high, row?.low, row?.close].every((value) => Number.isFinite(value));
}

function rowKey(row, index) {
  return `${row?.timestamp ?? row?.date ?? "row"}-${index}`;
}

function chartTime(row) {
  if (Number.isFinite(row.timestamp)) return Math.floor(row.timestamp / 1000);
  const parsed = Date.parse(row.date);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : row.date;
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || "").replace("#", "");
  if (normalized.length !== 6) return hex;
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildFocusChoices(rows, item, tools, timeframe) {
  const choices = [];
  const add = (key, label, color, price, enabled = true, priority = 50) => {
    if (enabled && Number.isFinite(price) && !choices.some((choice) => choice.key === key)) {
      choices.push({ key, label, color, price: roundChartValue(price), priority });
    }
  };
  const hasSeriesData = (key) => rows.some((row) => Number.isFinite(row[key]));
  const latestSeriesValue = (key) => {
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      if (Number.isFinite(rows[index]?.[key])) return rows[index][key];
    }
    return null;
  };

  add("ema20", "EMA20", chartColors.ema20, latestSeriesValue("ema20"), tools.ema20 && hasSeriesData("ema20"), 78);
  add("ema50", "EMA50", chartColors.ema50, latestSeriesValue("ema50"), tools.ema50 && hasSeriesData("ema50"), 72);
  add("ema200", "EMA200", chartColors.ema200, latestSeriesValue("ema200"), tools.ema200 && hasSeriesData("ema200"), 62);
  add("sma20", "SMA20", chartColors.sma20, latestSeriesValue("sma20"), tools.sma20 && hasSeriesData("sma20"), 58);
  add("sma50", "SMA50", chartColors.sma50, latestSeriesValue("sma50"), tools.sma50 && hasSeriesData("sma50"), 70);
  add("sma200", "SMA200", chartColors.sma200, latestSeriesValue("sma200"), tools.sma200 && hasSeriesData("sma200"), 60);
  add("bbUpper", "BB Upper", chartColors.bollinger, latestSeriesValue("bbUpper"), tools.bollinger && hasSeriesData("bbUpper"), 42);
  add("bbLower", "BB Lower", chartColors.bollinger, latestSeriesValue("bbLower"), tools.bollinger && hasSeriesData("bbLower"), 42);

  const vwapData = buildVwapData(rows);
  add("vwap", "VWAP", "#0f766e", vwapData[vwapData.length - 1]?.value, tools.vwap && vwapData.length > 0, 90);

  if (tools.supertrend) {
    const supertrend = buildSupertrendData(rows);
    add("supertrendUp", "Super Up", chartColors.up, supertrend.up[supertrend.up.length - 1]?.value, supertrend.up.length > 0, 74);
    add("supertrendDown", "Super Down", chartColors.down, supertrend.down[supertrend.down.length - 1]?.value, supertrend.down.length > 0, 74);
  }

  const entryPrice = item.action?.enterOnlyIfPrice || item.strategies?.find((plan) => plan.label === "Day trade")?.entry;
  add("entry", "Entry", chartColors.ema20, entryPrice, tools.stopTarget, 100);
  add("target", "Target", chartColors.up, item.target, tools.stopTarget, 98);
  add("stop", "Stop", chartColors.down, item.stop, tools.stopTarget, 98);

  if (tools.openingRange && timeframe === "1D") {
    const openingRange = buildOpeningRange(rows);
    add("openingRangeHigh", "OR High", "#0369a1", openingRange?.high, true, 86);
    add("openingRangeLow", "OR Low", "#7c3aed", openingRange?.low, true, 86);
  }

  add("previousClose", "Prev", "#64748b", previousDailyClose(item), tools.previousClose && timeframe === "1D", 84);
  if (tools.pivots) {
    buildPivotLevels(item).forEach((level) => add(level.key, level.label, level.color, level.price, true, level.major ? 88 : 82));
  }
  return choices;
}

function stackOverlayLabels(labels, height, activeKey) {
  const minGap = 25;
  const minY = 18;
  const maxY = height - 18;
  const selected = [];
  const maxLabels = Math.max(5, Math.min(9, Math.floor((height - minY * 2) / minGap)));
  const sortedByPriority = [...labels].sort((a, b) => {
    if (a.key === activeKey) return -1;
    if (b.key === activeKey) return 1;
    return (b.priority || 0) - (a.priority || 0);
  });

  sortedByPriority.forEach((label) => {
    if (selected.length >= maxLabels && label.key !== activeKey) return;
    const y = Math.max(minY, Math.min(maxY, label.y));
    const candidate = { ...label, y: nearestOpenLabelY(y, selected, minY, maxY, minGap) };
    const collides = selected.some((existing) => Math.abs(existing.y - candidate.y) < minGap);
    if (!collides) selected.push(candidate);
  });

  return selected.sort((a, b) => a.y - b.y);
}

function nearestOpenLabelY(targetY, selected, minY, maxY, minGap) {
  if (!selected.some((label) => Math.abs(label.y - targetY) < minGap)) return targetY;
  for (let offset = minGap; offset <= maxY - minY; offset += minGap) {
    const down = Math.min(maxY, targetY + offset);
    if (!selected.some((label) => Math.abs(label.y - down) < minGap)) return down;
    const up = Math.max(minY, targetY - offset);
    if (!selected.some((label) => Math.abs(label.y - up) < minGap)) return up;
  }
  return targetY;
}

function addPrimarySeries(chart, rows, chartType) {
  if (chartType === "bars") {
    const series = chart.addSeries(BarSeries, {
      upColor: chartColors.up,
      downColor: chartColors.down,
      priceLineVisible: true,
      lastValueVisible: true,
    });
    series.setData(ohlcSeriesData(rows));
    return series;
  }

  if (chartType === "line") {
    const series = chart.addSeries(LineSeries, {
      color: chartColors.ema20,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
    });
    series.setData(closeSeriesData(rows));
    return series;
  }

  if (chartType === "area") {
    const series = chart.addSeries(AreaSeries, {
      lineColor: chartColors.ema20,
      topColor: "rgba(31, 122, 224, 0.28)",
      bottomColor: "rgba(31, 122, 224, 0.03)",
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
    });
    series.setData(closeSeriesData(rows));
    return series;
  }

  if (chartType === "baseline") {
    const baseValue = rows[0]?.close || 0;
    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: baseValue },
      topLineColor: chartColors.up,
      topFillColor1: "rgba(22, 133, 58, 0.26)",
      topFillColor2: "rgba(22, 133, 58, 0.04)",
      bottomLineColor: chartColors.down,
      bottomFillColor1: "rgba(185, 41, 47, 0.04)",
      bottomFillColor2: "rgba(185, 41, 47, 0.24)",
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
    });
    series.setData(closeSeriesData(rows));
    return series;
  }

  const series = chart.addSeries(CandlestickSeries, {
    upColor: chartColors.up,
    downColor: chartColors.down,
    borderUpColor: chartColors.up,
    borderDownColor: chartColors.down,
    wickUpColor: chartColors.up,
    wickDownColor: chartColors.down,
    priceLineVisible: true,
    lastValueVisible: true,
  });
  series.setData(ohlcSeriesData(rows));
  return series;
}

function ohlcSeriesData(rows) {
  return rows.map((row) => ({
    time: chartTime(row),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
  }));
}

function closeSeriesData(rows) {
  return rows.map((row) => ({
    time: chartTime(row),
    value: row.close,
  }));
}

function buildHeikinAshiRows(rows) {
  const output = [];
  rows.forEach((row, index) => {
    const close = (row.open + row.high + row.low + row.close) / 4;
    const previous = output[index - 1];
    const open = previous ? (previous.open + previous.close) / 2 : (row.open + row.close) / 2;
    const high = Math.max(row.high, open, close);
    const low = Math.min(row.low, open, close);
    output.push({
      ...row,
      open: roundChartValue(open),
      high: roundChartValue(high),
      low: roundChartValue(low),
      close: roundChartValue(close),
    });
  });
  return output;
}

function buildRenkoRows(rows) {
  if (!rows.length) return [];
  const ranges = rows.map((row) => Math.max(row.high - row.low, 0)).filter((value) => value > 0);
  const averageRange = ranges.length ? ranges.reduce((sum, value) => sum + value, 0) / ranges.length : rows[0].close * 0.006;
  const brickSize = Math.max(0.01, averageRange * 0.75);
  const output = [];
  let brickClose = rows[0].close;
  rows.slice(1).forEach((row) => {
    let move = row.close - brickClose;
    let brickCounter = 0;
    while (Math.abs(move) >= brickSize && brickCounter < 8) {
      const direction = move > 0 ? 1 : -1;
      const open = brickClose;
      const close = brickClose + brickSize * direction;
      output.push({
        ...row,
        timestamp: Number.isFinite(row.timestamp) ? row.timestamp + brickCounter * 1000 : row.timestamp,
        date: `${row.date} R${brickCounter + 1}`,
        open: roundChartValue(open),
        high: roundChartValue(Math.max(open, close)),
        low: roundChartValue(Math.min(open, close)),
        close: roundChartValue(close),
      });
      brickClose = close;
      move = row.close - brickClose;
      brickCounter += 1;
    }
  });
  return output.length ? output : rows;
}

function buildVwapData(rows) {
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;
  return rows
    .map((row) => {
      const volume = Number(row.volume || 0);
      if (!volume) return null;
      const typical = (row.high + row.low + row.close) / 3;
      cumulativePriceVolume += typical * volume;
      cumulativeVolume += volume;
      return {
        time: chartTime(row),
        value: roundChartValue(cumulativePriceVolume / cumulativeVolume),
      };
    })
    .filter(Boolean);
}

function buildSupertrendData(rows, period = 10, multiplier = 3) {
  const trueRanges = rows.map((row, index) => {
    const previousClose = rows[index - 1]?.close ?? row.close;
    return Math.max(row.high - row.low, Math.abs(row.high - previousClose), Math.abs(row.low - previousClose));
  });
  const atrValues = rollingAverage(trueRanges, period);
  let finalUpper = null;
  let finalLower = null;
  let trend = "up";
  const up = [];
  const down = [];

  rows.forEach((row, index) => {
    const atrValue = atrValues[index];
    if (!Number.isFinite(atrValue)) return;
    const middle = (row.high + row.low) / 2;
    const basicUpper = middle + multiplier * atrValue;
    const basicLower = middle - multiplier * atrValue;
    const previous = rows[index - 1] || row;

    finalUpper = finalUpper === null || basicUpper < finalUpper || previous.close > finalUpper ? basicUpper : finalUpper;
    finalLower = finalLower === null || basicLower > finalLower || previous.close < finalLower ? basicLower : finalLower;

    if (trend === "down" && row.close > finalUpper) trend = "up";
    else if (trend === "up" && row.close < finalLower) trend = "down";

    const point = { time: chartTime(row), value: roundChartValue(trend === "up" ? finalLower : finalUpper) };
    if (trend === "up") up.push(point);
    else down.push(point);
  });

  return { up, down };
}

function buildIchimokuData(rows) {
  const conversion = midpointSeries(rows, 9);
  const base = midpointSeries(rows, 26);
  const spanB = midpointSeries(rows, 52);
  const spanA = rows
    .map((row, index) => {
      const conversionPoint = conversion.find((point) => point.time === chartTime(row));
      const basePoint = base.find((point) => point.time === chartTime(row));
      if (!conversionPoint || !basePoint) return null;
      return {
        time: chartTime(row),
        value: roundChartValue((conversionPoint.value + basePoint.value) / 2),
      };
    })
    .filter(Boolean);

  return { conversion, base, spanA, spanB };
}

function midpointSeries(rows, period) {
  return rows
    .map((row, index) => {
      const windowRows = rows.slice(Math.max(0, index - period + 1), index + 1);
      if (windowRows.length < period) return null;
      return {
        time: chartTime(row),
        value: roundChartValue((Math.max(...windowRows.map((item) => item.high)) + Math.min(...windowRows.map((item) => item.low))) / 2),
      };
    })
    .filter(Boolean);
}

function rollingAverage(values, period) {
  return values.map((_, index) => {
    if (index < period - 1) return null;
    const windowValues = values.slice(index - period + 1, index + 1);
    return windowValues.reduce((sum, value) => sum + value, 0) / period;
  });
}

function roundChartValue(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function buildVolumeProfileData(rows) {
  const validRows = rows.filter((row) => Number.isFinite(row.close) && Number.isFinite(row.volume) && row.volume > 0);
  if (validRows.length < 10) return [];
  const lows = validRows.map((row) => row.low).filter(Number.isFinite);
  const highs = validRows.map((row) => row.high).filter(Number.isFinite);
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const bucketCount = 12;
  const bucketSize = (maxPrice - minPrice) / bucketCount;
  if (!Number.isFinite(bucketSize) || bucketSize <= 0) return [];
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    price: minPrice + bucketSize * (index + 0.5),
    volume: 0,
  }));
  validRows.forEach((row) => {
    const index = Math.max(0, Math.min(bucketCount - 1, Math.floor((row.close - minPrice) / bucketSize)));
    buckets[index].volume += row.volume || 0;
  });
  const maxVolume = Math.max(...buckets.map((bucket) => bucket.volume), 1);
  return buckets
    .filter((bucket) => bucket.volume > 0)
    .map((bucket) => ({
      price: roundChartValue(bucket.price),
      opacity: roundChartValue(0.12 + (bucket.volume / maxVolume) * 0.34, 2),
      isPointOfControl: bucket.volume === maxVolume,
    }));
}

function buildOpeningRange(rows) {
  const openingRows = rows.slice(0, Math.min(6, rows.length));
  if (!openingRows.length) return null;
  return {
    high: Math.max(...openingRows.map((row) => row.high)),
    low: Math.min(...openingRows.map((row) => row.low)),
  };
}

function previousDailyClose(item) {
  const chart = item?.chart || [];
  if (chart.length < 2) return null;
  return chart[chart.length - 2]?.close ?? null;
}

function formatChartAxisTime(time, timeframe) {
  const date = chartDateFromTime(time);
  if (!date) return "";
  if (timeframe === "1D") {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatChartCrosshairTime(time, timeframe) {
  const date = chartDateFromTime(time);
  if (!date) return "";
  if (timeframe === "1D") {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function chartDateFromTime(time) {
  if (typeof time === "number") return new Date(time * 1000);
  if (typeof time === "string") {
    const parsed = Date.parse(time);
    return Number.isFinite(parsed) ? new Date(parsed) : null;
  }
  if (time && typeof time === "object" && "year" in time && "month" in time && "day" in time) {
    return new Date(Date.UTC(time.year, time.month - 1, time.day));
  }
  return null;
}

function LegacySvgCandlestickChart({ rows, item, tools, timeframe }) {
  const [hover, setHover] = useState(null);
  const [panOffset, setPanOffset] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  
  const width = 1180;
  const height = 620;
  const padding = { top: 24, right: 64, bottom: 36, left: 52 };
  
  // Validate and filter rows with proper data
  const validRows = rows.filter((row) =>
    Number.isFinite(row.open) &&
    Number.isFinite(row.high) &&
    Number.isFinite(row.low) &&
    Number.isFinite(row.close)
  );

  if (!validRows.length) {
    return <div className="flex min-h-[360px] items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-slate-500">No valid chart data. Check 1D candle availability.</div>;
  }

  const projection = item.swingProjection || {};
  const priceValues = validRows.flatMap((row) => [
    row.high,
    row.low,
    row.ema20,
    row.ema50,
    row.ema200,
    row.sma20,
    row.sma50,
    row.sma200,
    row.bbUpper,
    row.bbLower,
    item.stop,
    item.target,
    projection.projectedPrice,
    projection.weeklyHigh,
    projection.weeklyLow,
  ]).filter(Number.isFinite);
  
  const minValue = priceValues.length ? Math.min(...priceValues) : 0;
  const maxValue = priceValues.length ? Math.max(...priceValues) : 1;
  const range = maxValue - minValue || 1;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  
  // Zoom affects candle spacing
  const baseCandleGap = plotWidth / Math.max(validRows.length, 1);
  const candleGap = baseCandleGap * zoomLevel;
  const candleWidth = Math.max(3, Math.min(14, candleGap * 0.64));
  const clampPan = (value, zoom = zoomLevel) => {
    const totalWidth = validRows.length * baseCandleGap * zoom;
    const minPan = Math.min(0, plotWidth - totalWidth);
    return Math.max(minPan, Math.min(0, value));
  };
  
  const x = (index) => padding.left + panOffset + index * candleGap + candleGap / 2;
  const y = (value) => padding.top + ((maxValue - value) / range) * plotHeight;
  const linePoints = (key) => validRows
    .map((row, index) => Number.isFinite(row[key]) ? `${x(index)},${y(row[key])}` : null)
    .filter(Boolean)
    .join(" ");
  const timeTicks = buildTimeTicks(validRows, timeframe);

  function handlePointerMove(event) {
    if (isDragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * width;
    const svgY = ((event.clientY - rect.top) / rect.height) * height;
    const rawIndex = Math.floor((svgX - padding.left - panOffset) / candleGap);
    const index = Math.max(0, Math.min(validRows.length - 1, rawIndex));
    if (index >= 0 && index < validRows.length) {
      const cursorPrice = maxValue - ((Math.max(padding.top, Math.min(padding.top + plotHeight, svgY)) - padding.top) / plotHeight) * range;
      setHover({
        index,
        row: validRows[index],
        x: x(index),
        y: svgY,
        price: cursorPrice,
      });
    }
  }

  function handleMouseDown(event) {
    if (event.button !== 0 || zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart(event.clientX);
  }

  function handleMouseMove(event) {
    if (!isDragging) return;
    const delta = event.clientX - dragStart;
    setPanOffset(clampPan(panOffset + delta));
    setDragStart(event.clientX);
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function updateZoom(multiplier) {
    const newZoom = Math.max(1, Math.min(4, zoomLevel * multiplier));
    setZoomLevel(newZoom);
    setPanOffset((current) => clampPan(current, newZoom));
  }

  function panBy(amount) {
    if (zoomLevel <= 1) return;
    setPanOffset((current) => clampPan(current + amount));
  }

  function handleDoubleClick() {
    setPanOffset(0);
    setZoomLevel(1);
  }

  const levels = [
    ["Stop", item.stop, chartColors.down],
    ["Target", item.target, chartColors.up],
  ].filter(([, value]) => Number.isFinite(value));
  const chartNotes = item.ruleEngine?.chartNotes || [];

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ChartZoomControls
        zoomLevel={zoomLevel}
        canPan={zoomLevel > 1}
        onZoomIn={() => updateZoom(1.2)}
        onZoomOut={() => updateZoom(1 / 1.2)}
        onPanLeft={() => panBy(90)}
        onPanRight={() => panBy(-90)}
        onReset={handleDoubleClick}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={(e) => {
          handlePointerMove(e);
          if (isDragging) handleMouseMove(e);
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHover(null);
          handleMouseUp();
        }}
        onDoubleClick={handleDoubleClick}
        className={`h-[360px] w-full bg-white md:h-[500px] xl:h-[620px] ${
          isDragging ? "cursor-grabbing" : zoomLevel > 1 ? "cursor-grab" : "cursor-crosshair"
        }`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const yy = padding.top + ratio * plotHeight;
          const value = maxValue - ratio * range;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={yy} y2={yy} stroke={chartColors.grid} />
              <text x={width - padding.right + 10} y={yy + 4} className="fill-slate-500 text-[12px] font-bold">
                {money(value)}
              </text>
            </g>
          );
        })}

        {chartNotes.length ? (
          <g>
            <rect x={padding.left + 8} y={padding.top + 8} width="390" height="116" rx="8" fill="white" stroke={chartColors.axis} opacity="0.96" />
            <text x={padding.left + 22} y={padding.top + 32} className="fill-slate-500 text-[11px] font-black">
              RULE POSITION
            </text>
            <text x={padding.left + 22} y={padding.top + 54} className="fill-slate-950 text-[16px] font-black">
              {item.ruleEngine?.swing?.now || item.signal}
            </text>
            <text x={padding.left + 22} y={padding.top + 76} className="fill-slate-700 text-[11px] font-bold">
              {truncateText(item.ruleEngine?.swing?.why || item.action?.why, 68)}
            </text>
            <text x={padding.left + 22} y={padding.top + 96} className="fill-slate-700 text-[11px] font-bold">
              Entry: {truncateText(item.ruleEngine?.swing?.enterOnlyIf || item.action?.enterOnlyIf, 62)}
            </text>
            <text x={padding.left + 22} y={padding.top + 114} className="fill-slate-700 text-[11px] font-bold">
              Stop {money(item.ruleEngine?.swing?.stopArea ?? item.stop)} / Target {money(item.ruleEngine?.swing?.targetArea ?? item.target)}
            </text>
          </g>
        ) : null}

        {tools.swingProjection && Number.isFinite(projection.weeklyHigh) && Number.isFinite(projection.weeklyLow) ? (
          <g>
            <rect
              x={padding.left}
              y={y(projection.weeklyHigh)}
              width={plotWidth}
              height={Math.max(1, y(projection.weeklyLow) - y(projection.weeklyHigh))}
              fill={chartColors.projectionFill}
              opacity="0.22"
            />
            <line x1={padding.left} x2={width - padding.right} y1={y(projection.weeklyHigh)} y2={y(projection.weeklyHigh)} stroke={chartColors.ema20} strokeDasharray="4 5" />
            <line x1={padding.left} x2={width - padding.right} y1={y(projection.weeklyLow)} y2={y(projection.weeklyLow)} stroke={chartColors.ema20} strokeDasharray="4 5" />
            <text x={width - padding.right - 8} y={y(projection.weeklyHigh) - 6} textAnchor="end" className="fill-blue-700 text-[11px] font-black">
              Weekly high {money(projection.weeklyHigh)}
            </text>
            <text x={width - padding.right - 8} y={y(projection.weeklyLow) + 14} textAnchor="end" className="fill-blue-700 text-[11px] font-black">
              Weekly low {money(projection.weeklyLow)}
            </text>
          </g>
        ) : null}

        {tools.bollinger ? (
          <>
            <polyline fill="none" stroke={chartColors.bollinger} strokeWidth="2.1" points={linePoints("bbUpper")} />
            <polyline fill="none" stroke={chartColors.bollinger} strokeWidth="2.1" points={linePoints("bbLower")} />
          </>
        ) : null}
        {tools.ema20 ? <polyline fill="none" stroke={chartColors.ema20} strokeWidth="2.2" points={linePoints("ema20")} /> : null}
        {tools.ema50 ? <polyline fill="none" stroke={chartColors.ema50} strokeWidth="1.8" points={linePoints("ema50")} /> : null}
        {tools.ema200 ? <polyline fill="none" stroke={chartColors.ema200} strokeWidth="1.8" points={linePoints("ema200")} /> : null}
        {tools.sma20 ? <polyline fill="none" stroke={chartColors.sma20} strokeWidth="2" strokeDasharray="2 3" points={linePoints("sma20")} /> : null}
        {tools.sma50 ? <polyline fill="none" stroke={chartColors.sma50} strokeWidth="2" points={linePoints("sma50")} /> : null}
        {tools.sma200 ? <polyline fill="none" stroke={chartColors.sma200} strokeWidth="2.2" strokeDasharray="4 4" points={linePoints("sma200")} /> : null}

        {tools.stopTarget ? levels.map(([label, value, color]) => (
          <g key={label}>
            <line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} stroke={color} strokeDasharray="7 7" strokeWidth="1.5" />
            <text x={padding.left + 8} y={y(value) - 6} fill={color} className="text-[12px] font-black">
              {label} {money(value)}
            </text>
          </g>
        )) : null}

        {tools.swingProjection && Number.isFinite(projection.projectedPrice) ? (
          <g>
            <line
              x1={x(Math.max(0, validRows.length - 5))}
              x2={width - padding.right}
              y1={y(validRows[validRows.length - 1]?.close)}
              y2={y(projection.projectedPrice)}
              stroke={projection.direction === "Bearish" ? chartColors.down : chartColors.up}
              strokeWidth="2.4"
              strokeDasharray="8 6"
            />
            <circle cx={width - padding.right} cy={y(projection.projectedPrice)} r="4" fill={projection.direction === "Bearish" ? chartColors.down : chartColors.up} />
            <text x={width - padding.right - 8} y={y(projection.projectedPrice) - 9} textAnchor="end" className="fill-slate-950 text-[12px] font-black">
              Projected {money(projection.projectedPrice)}
            </text>
          </g>
        ) : null}

        {validRows.map((row, index) => {
          const rising = row.close >= row.open;
          const color = rising ? chartColors.up : chartColors.down;
          const top = y(Math.max(row.open, row.close));
          const bodyHeight = Math.max(2, Math.abs(y(row.open) - y(row.close)));
          return (
            <g key={rowKey(row, index)}>
              <line x1={x(index)} x2={x(index)} y1={y(row.high)} y2={y(row.low)} stroke={color} strokeWidth="1.4" />
              <rect
                x={x(index) - candleWidth / 2}
                y={top}
                width={candleWidth}
                height={bodyHeight}
                fill={rising ? chartColors.upFill : chartColors.downFill}
                stroke={color}
                strokeWidth="1.4"
              />
            </g>
          );
        })}

        {tools.signalMarkers ? (
          <SignalMarkers rows={validRows} item={item} x={x} y={y} padding={padding} height={height} />
        ) : null}

        {timeTicks.map((tick) => (
          <g key={`${tick.index}-${tick.label}`}>
            <line x1={x(tick.index)} x2={x(tick.index)} y1={padding.top} y2={height - padding.bottom} stroke={chartColors.grid} strokeDasharray="2 4" />
            <text x={x(tick.index)} y={height - 12} textAnchor="middle" className="fill-slate-500 text-[11px] font-bold">{tick.label}</text>
          </g>
        ))}
        {tools.tooltip && hover ? <ChartHover hover={hover} width={width} height={height} padding={padding} item={item} /> : null}
        {zoomLevel !== 1 || panOffset !== 0 ? (
          <g pointerEvents="none">
            <text x={width - 150} y={30} className="fill-slate-500 text-[10px] font-bold">Zoom: {zoomLevel.toFixed(1)}x | drag to pan</text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function SignalMarkers({ rows, item, x, y, padding, height }) {
  const latest = rows[rows.length - 1];
  if (!latest) return null;
  const signal = item.signal || "WAIT";
  const isEntry = signal.includes("ENTRY");
  const isExit = signal.includes("EXIT");
  const color = isEntry ? chartColors.up : isExit ? chartColors.down : chartColors.sma20;
  const label = isEntry ? "BUY" : isExit ? "OUT" : "WAIT";
  const index = rows.length - 1;
  const markerY = isEntry ? y(latest.low) + 18 : y(latest.high) - 18;
  const points = isEntry
    ? `${x(index) - 8},${markerY + 8} ${x(index) + 8},${markerY + 8} ${x(index)},${markerY - 8}`
    : `${x(index) - 8},${markerY - 8} ${x(index) + 8},${markerY - 8} ${x(index)},${markerY + 8}`;

  return (
    <g pointerEvents="none">
      <polygon points={points} fill={color} opacity="0.95" />
      <rect x={Math.max(padding.left + 4, x(index) - 34)} y={Math.max(padding.top + 4, Math.min(height - padding.bottom - 26, markerY + 12))} width="68" height="22" rx="4" fill="white" stroke={color} />
      <text x={x(index)} y={Math.max(padding.top + 20, Math.min(height - padding.bottom - 10, markerY + 28))} textAnchor="middle" className="fill-slate-950 text-[10px] font-black">
        {label} {item.score}/100
      </text>
    </g>
  );
}

function ChartZoomControls({ zoomLevel, canPan, onZoomIn, onZoomOut, onPanLeft, onPanRight, onReset }) {
  return (
    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1 shadow-sm">
      <ChartControlButton label="+" title="Zoom in" onClick={onZoomIn} />
      <ChartControlButton label="-" title="Zoom out" onClick={onZoomOut} disabled={zoomLevel <= 1} />
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <ChartControlButton label="<" title="Pan left" onClick={onPanLeft} disabled={!canPan} />
      <ChartControlButton label=">" title="Pan right" onClick={onPanRight} disabled={!canPan} />
      <button
        type="button"
        onClick={onReset}
        className="ml-1 rounded px-2 py-1 text-[11px] font-black text-sky-700 hover:bg-sky-50"
      >
        Reset
      </button>
      <span className="ml-1 min-w-9 text-right text-[10px] font-black text-slate-500">{zoomLevel.toFixed(1)}x</span>
    </div>
  );
}

function ChartControlButton({ label, title, onClick, disabled = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-sm font-black text-slate-900 hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function ChartHover({ hover, width, height, padding, item }) {
  const row = hover.row || {};
  const boxWidth = 300;
  const scoreRows = item.scoreDetails?.rows || [];
  const projection = item.swingProjection || {};
  const boxHeight = 260 + Math.min(scoreRows.length, 6) * 16;
  const boxX = hover.x > width - padding.right - boxWidth - 20 ? hover.x - boxWidth - 14 : hover.x + 14;
  const boxY = Math.max(padding.top + 6, Math.min(height - padding.bottom - boxHeight - 6, hover.y - 80));
  const yPrice = Math.max(padding.top, Math.min(height - padding.bottom, hover.y));
  const lines = [
    ["Date", row.date],
    ["Cursor", money(hover.price)],
    ["Open", money(row.open)],
    ["High", money(row.high)],
    ["Low", money(row.low)],
    ["Close", money(row.close)],
    ["Volume", number(row.volume)],
    ["RSI", number(row.rsi)],
    ["Williams %R", number(row.williamsR)],
    ["MACD", number(row.macd)],
    ["ADX", number(row.adx)],
    ["Signal", item.signal],
    ["Score", `${item.score}/100`],
  ];

  return (
    <g pointerEvents="none">
      <line x1={hover.x} x2={hover.x} y1={padding.top} y2={height - padding.bottom} stroke={chartColors.cursor} strokeDasharray="5 5" opacity="0.65" />
      <line x1={padding.left} x2={width - padding.right} y1={yPrice} y2={yPrice} stroke={chartColors.cursor} strokeDasharray="5 5" opacity="0.65" />
      <rect x={width - padding.right + 4} y={yPrice - 13} width="58" height="24" rx="4" fill="white" stroke={chartColors.axis} />
      <text x={width - padding.right + 33} y={yPrice + 4} textAnchor="middle" className="fill-slate-950 text-[11px] font-black">
        {money(hover.price)}
      </text>
      <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx="8" fill="white" stroke={chartColors.axis} />
      {lines.map(([label, value], index) => (
        <g key={label}>
          <text x={boxX + 12} y={boxY + 24 + index * 18} className="fill-slate-500 text-[11px] font-bold">{label}</text>
          <text x={boxX + boxWidth - 12} y={boxY + 24 + index * 18} textAnchor="end" className="fill-slate-950 text-[11px] font-black">{value}</text>
        </g>
      ))}
      <text x={boxX + 12} y={boxY + 24 + lines.length * 18} className="fill-slate-500 text-[11px] font-black">Score details</text>
      {scoreRows.slice(0, 6).map((score, index) => (
        <g key={score.label}>
          <text x={boxX + 12} y={boxY + 42 + lines.length * 18 + index * 16} className="fill-slate-600 text-[10px] font-bold">
            {score.label}
          </text>
          <text x={boxX + boxWidth - 12} y={boxY + 42 + lines.length * 18 + index * 16} textAnchor="end" className="fill-slate-950 text-[10px] font-black">
            {score.points}/{score.max}
          </text>
        </g>
      ))}
      <text x={boxX + 12} y={boxY + boxHeight - 34} className="fill-slate-500 text-[10px] font-black">5-day swing</text>
      <text x={boxX + 12} y={boxY + boxHeight - 16} className="fill-slate-950 text-[10px] font-bold">
        {truncateText(projection.summary || "No projection.", 58)}
      </text>
    </g>
  );
}

function MacdChart({ rows }) {
  const width = 760;
  const height = 170;
  const padding = 18;
  const keys = [["macd", chartColors.macd], ["macdSignal", chartColors.macdSignal]];
  const values = rows.flatMap((row) => [row.macd, row.macdSignal, row.macdHist].filter(Number.isFinite));
  if (!rows?.length || !values.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">MACD (12, 26, 9)</h3>
        <div className="mt-2 flex h-32 items-center justify-center text-xs font-bold text-slate-500">Not enough data for MACD.</div>
      </div>
    );
  }

  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const range = maxValue - minValue || 1;
  const x = (index) => padding + (index / Math.max(rows.length - 1, 1)) * (width - padding * 2);
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);
  const zeroY = y(0);
  const step = (width - padding * 2) / Math.max(rows.length, 1);
  const barWidth = Math.max(2, Math.min(8, step * 0.7));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">MACD (12, 26, 9)</h3>
          <p className="mt-1 text-[11px] font-bold text-slate-500">Histogram bars show momentum. Lines crossing up/down are confirmation clues.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Legend color={chartColors.macd} label="MACD" />
          <Legend color={chartColors.macdSignal} label="Signal" />
          <Legend color={chartColors.up} label="Positive bars" />
          <Legend color={chartColors.down} label="Negative bars" />
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} stroke={chartColors.axis} />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke={chartColors.axis} />
        {rows.map((row, index) => {
          if (!Number.isFinite(row.macdHist)) return null;
          const top = row.macdHist >= 0 ? y(row.macdHist) : zeroY;
          const barHeight = Math.max(1, Math.abs(y(row.macdHist) - zeroY));
          return (
            <rect
              key={rowKey(row, index)}
              x={x(index) - barWidth / 2}
              y={top}
              width={barWidth}
              height={barHeight}
              fill={row.macdHist >= 0 ? chartColors.up : chartColors.down}
              opacity="0.85"
            />
          );
        })}
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

function VolumeChart({ rows }) {
  const volumeStatus = (() => {
    const latest = rows[rows.length - 1];
    if (!latest?.volumeSma20) return "Volume data";
    if (latest.volume > latest.volumeSma20 * 1.2) return "Strong volume";
    if (latest.volume < latest.volumeSma20 * 0.8) return "Weak volume";
    return "Normal volume";
  })();

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Volume</h3>
        <span className="text-xs font-black text-slate-500">{volumeStatus}</span>
      </div>
      <SparkBars rows={rows} />
    </div>
  );
}

function RelativeVolumeCard({ rows }) {
  const latest = rows[rows.length - 1];
  const priorRows = rows.slice(Math.max(0, rows.length - 21), Math.max(0, rows.length - 1));
  const averageVolume = priorRows.length ? priorRows.reduce((sum, row) => sum + (row.volume || 0), 0) / priorRows.length : 0;
  const relativeVolume = averageVolume ? (latest?.volume || 0) / averageVolume : 0;
  const status = relativeVolume >= 1.5 ? "High participation" : relativeVolume >= 1 ? "Above average" : relativeVolume >= 0.7 ? "Normal" : "Quiet";
  const barWidth = Math.max(4, Math.min(100, relativeVolume * 45));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">Relative Volume</h3>
          <p className="mt-1 text-[11px] font-bold text-slate-500">Current bar volume versus recent average.</p>
        </div>
        <span className="text-sm font-black text-slate-950">{number(relativeVolume)}x</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${relativeVolume >= 1 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${barWidth}%` }} />
      </div>
      <p className="mt-2 text-xs font-bold text-slate-600">{status}</p>
    </div>
  );
}

function SparkBars({ rows }) {
  const width = 760;
  const height = 170;
  const padding = 18;
  const maxValue = Math.max(...rows.map((row) => row.volume || 0), 1);
  const barWidth = Math.max(2, (width - padding * 2) / Math.max(rows.length, 1) - 1);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke={chartColors.axis} />
      {rows.map((row, index) => {
        const barHeight = ((row.volume || 0) / maxValue) * (height - padding * 2);
        const xPos = padding + index * ((width - padding * 2) / Math.max(rows.length, 1));
        return (
          <rect
            key={rowKey(row, index)}
            x={xPos}
            y={height - padding - barHeight}
            width={barWidth}
            height={barHeight}
            fill={row.close >= row.open ? chartColors.up : chartColors.down}
            opacity="0.75"
          />
        );
      })}
    </svg>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function BacktestPanel({ item }) {
  const backtest = item.backtest || {};
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Backtest & Alerts</h2>
        <HelpTip
          label="What is Backtest Alert?"
          text="Backtest alert means the latest model signal changed compared to the prior candle. It is a warning/confirmation marker from historical simulation, not a broker alert or live trade order."
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Metric label="Trades" value={backtest.trades || 0} />
        <Metric label="Win rate" value={`${number(backtest.winRate)}%`} />
        <Metric label="Total return" value={`${number(backtest.totalReturn)}%`} />
        <Metric label="Max drawdown" value={`${number(backtest.maxDrawdown)}%`} />
        <Metric label="Average win" value={`${number(backtest.averageWin)}%`} />
        <Metric label="Average loss" value={`${number(backtest.averageLoss)}%`} />
        <Metric label="Average trade" value={`${number(backtest.averageTrade)}%`} />
        <Metric label="Expectancy" value={`${number(backtest.expectancy)}%`} />
        <Metric label="Profit factor" value={number(backtest.profitFactor)} />
        <Metric label="Target hit rate" value={`${number(backtest.targetHitRate)}%`} />
        <Metric label="Average hold" value={`${number(backtest.averageHoldDays)} days`} />
        <Metric label="Best trade" value={`${number(backtest.bestTrade)}%`} />
        <Metric label="Worst trade" value={`${number(backtest.worstTrade)}%`} />
        <Metric label="Alert level" value={backtest.alert?.level || "info"} />
        <Metric label="Alert message" value={backtest.alert?.message || "No recent signal change alert."} />
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

function TraderSetupsPanel({ setups }) {
  if (!setups?.length) return null;

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Trader Setups (GitHub-Inspired)</h2>
        <HelpTip
          label="Setup source"
          text="These setups are adapted from common open-source strategy patterns seen in projects like freqtrade/freqtrade-strategies and backtesting.py examples. They are educational filters, not auto-trading rules."
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {setups.map((setup) => (
          <article key={setup.name} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">{setup.name}</p>
              <span className={`rounded-md border px-2 py-1 text-[10px] font-black ${setup.state === "ACTIVE" ? "border-emerald-300 bg-emerald-100 text-emerald-900" : setup.state === "WATCH" ? "border-sky-300 bg-sky-100 text-sky-900" : "border-slate-300 bg-white text-slate-700"}`}>
                {setup.state}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{setup.why}</p>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">Rule: {setup.rule}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HelpTip({ label, text }) {
  return (
    <span className="group relative inline-flex cursor-help items-center" aria-label={label}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[11px] font-black text-slate-700">?</span>
      <span className="pointer-events-none absolute left-6 top-0 z-10 hidden w-72 rounded-md border border-slate-200 bg-white p-2 text-[11px] font-semibold leading-5 text-slate-700 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function SparkChart({ title, rows, keys, height = 180, fixedMin, fixedMax, levels = [], note = "" }) {
  const width = 760;
  const padding = 18;
  if (!rows?.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">{title}</h3>
        <div className="mt-2 flex h-32 items-center justify-center text-xs font-bold text-slate-500">No data.</div>
      </div>
    );
  }
  const values = rows.flatMap((row) => keys.map(([key]) => row[key]).filter((value) => Number.isFinite(value)));
  if (!values.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">{title}</h3>
        <div className="mt-2 flex h-32 items-center justify-center text-xs font-bold text-slate-500">Not enough data for this indicator.</div>
      </div>
    );
  }
  const minValue = Number.isFinite(fixedMin) ? fixedMin : Math.min(...values);
  const maxValue = Number.isFinite(fixedMax) ? fixedMax : Math.max(...values);
  const range = maxValue - minValue || 1;
  const x = (index) => padding + (index / Math.max(rows.length - 1, 1)) * (width - padding * 2);
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">{title}</h3>
          {note ? <p className="mt-1 text-[11px] font-bold text-slate-500">{note}</p> : null}
        </div>
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
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke={chartColors.axis} />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke={chartColors.axis} />
        {levels.map((level) => (
          <g key={level}>
            <line x1={padding} x2={width - padding} y1={y(level)} y2={y(level)} stroke={chartColors.axis} strokeDasharray="5 5" />
            <text x={width - padding - 4} y={y(level) - 4} textAnchor="end" className="fill-slate-500 text-[10px] font-bold">{level}</text>
          </g>
        ))}
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

function williamsStatus(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  if (value > -20) return "Overbought: take-profit watch.";
  if (value < -80) return "Oversold: bounce watch.";
  return "Neutral momentum zone.";
}

function chartRowsForTimeframe(item, timeframe) {
  const sourceRows = timeframe === "1D" && item?.intradayChart?.length ? item.intradayChart : item?.chart || [];
  const sessions = timeframes.find((item) => item.label === timeframe)?.sessions || 126;
  const cleanRows = (sourceRows || []).filter((row) =>
    [row.open, row.high, row.low, row.close].every((value) => Number.isFinite(Number(value)))
  );
  if (timeframe === "1D" && item?.intradayChart?.length) {
    return latestTorontoSessionRows(cleanRows).slice(-96);
  }
  return cleanRows.slice(-sessions);
}

function latestTorontoSessionRows(rows) {
  if (!rows.length) return rows;
  const latest = rows[rows.length - 1];
  const latestSession = torontoDateKey(latest.timestamp) || String(latest.date || "").split(" ")[0];
  return rows.filter((row) => (torontoDateKey(row.timestamp) || String(row.date || "").split(" ")[0]) === latestSession);
}

function torontoDateKey(timestamp) {
  if (!Number.isFinite(timestamp)) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function withStochasticRows(rows, period = 14, smooth = 3) {
  const rawK = rows.map((row, index) => {
    const windowRows = rows.slice(Math.max(0, index - period + 1), index + 1);
    if (windowRows.length < period) return null;
    const highestHigh = Math.max(...windowRows.map((item) => item.high));
    const lowestLow = Math.min(...windowRows.map((item) => item.low));
    const range = highestHigh - lowestLow;
    return range ? ((row.close - lowestLow) / range) * 100 : null;
  });
  const smoothK = movingAverageNullable(rawK, smooth);
  const smoothD = movingAverageNullable(smoothK, smooth);
  return rows.map((row, index) => ({
    ...row,
    stochK: roundChartValue(smoothK[index]),
    stochD: roundChartValue(smoothD[index]),
  }));
}

function movingAverageNullable(values, period) {
  return values.map((_, index) => {
    const windowValues = values.slice(Math.max(0, index - period + 1), index + 1).filter(Number.isFinite);
    if (windowValues.length < period) return null;
    return windowValues.reduce((sum, value) => sum + value, 0) / windowValues.length;
  });
}

function buildPivotLevels(item) {
  const chart = item?.chart || [];
  const previous = chart.length >= 2 ? chart[chart.length - 2] : null;
  if (!previous) return [];
  const pivot = (previous.high + previous.low + previous.close) / 3;
  const r1 = pivot * 2 - previous.low;
  const s1 = pivot * 2 - previous.high;
  const r2 = pivot + (previous.high - previous.low);
  const s2 = pivot - (previous.high - previous.low);
  return [
    { key: "pivot", label: "P", price: roundChartValue(pivot), color: "#475569", major: true },
    { key: "r1", label: "R1", price: roundChartValue(r1), color: chartColors.down },
    { key: "s1", label: "S1", price: roundChartValue(s1), color: chartColors.up },
    { key: "r2", label: "R2", price: roundChartValue(r2), color: chartColors.down },
    { key: "s2", label: "S2", price: roundChartValue(s2), color: chartColors.up },
  ].filter((level) => Number.isFinite(level.price));
}

function buildAtrBands(rows, period = 14) {
  if (rows.length < period + 1) return [];
  const latest = rows[rows.length - 1];
  const trueRanges = rows.map((row, index) => {
    const previousClose = rows[index - 1]?.close ?? row.close;
    return Math.max(row.high - row.low, Math.abs(row.high - previousClose), Math.abs(row.low - previousClose));
  });
  const atr = trueRanges.slice(-period).reduce((sum, value) => sum + value, 0) / period;
  return [
    { label: "+1 ATR", price: roundChartValue(latest.close + atr), color: chartColors.down },
    { label: "-1 ATR", price: roundChartValue(latest.close - atr), color: chartColors.up },
    { label: "+2 ATR", price: roundChartValue(latest.close + atr * 2), color: chartColors.down },
    { label: "-2 ATR", price: roundChartValue(latest.close - atr * 2), color: chartColors.up },
  ].filter((level) => Number.isFinite(level.price));
}

function buildTimeTicks(rows, timeframe) {
  if (!rows.length) return [];
  const tickCount = timeframe === "1D" ? 7 : timeframe === "5D" ? 6 : 8;
  const used = new Set();
  return Array.from({ length: tickCount }, (_, index) => {
    const rowIndex = Math.round((index / Math.max(tickCount - 1, 1)) * (rows.length - 1));
    if (used.has(rowIndex)) return null;
    used.add(rowIndex);
    return {
      index: rowIndex,
      label: formatAxisLabel(rows[rowIndex]?.date, timeframe),
    };
  }).filter(Boolean);
}

function formatAxisLabel(value, timeframe) {
  const text = String(value || "");
  if (timeframe === "1D") {
    const time = text.match(/\d{1,2}:\d{2}\s?(AM|PM)/i)?.[0];
    return time || text;
  }
  if (timeframe === "5D") return text.replace(/^\d{4}-/, "");
  if (["1M", "3M", "6M"].includes(timeframe)) return text.slice(5);
  return text.slice(0, 7);
}

function SignalPill({ signal }) {
  return (
    <span
      title={signalGlossary[signal] || signalGlossary.WAIT}
      className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-black ${signalStyles[signal] || signalStyles.AVOID}`}
    >
      {signal}
    </span>
  );
}

function RuleStatusPill({ status }) {
  const styles = {
    "BUY CONFIRM": "border-emerald-300 bg-emerald-100 text-emerald-900",
    "BUY WATCH": "border-sky-300 bg-sky-100 text-sky-900",
    WAIT: "border-amber-300 bg-amber-100 text-amber-900",
    NEUTRAL: "border-slate-300 bg-white text-slate-700",
    "OUT WATCH": "border-orange-300 bg-orange-100 text-orange-900",
    OUT: "border-rose-300 bg-rose-100 text-rose-900",
    "NO TRADE": "border-rose-300 bg-rose-100 text-rose-900",
  };
  return (
    <span
      title={signalGlossary[status] || signalGlossary.NEUTRAL}
      className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-black ${styles[status] || styles.NEUTRAL}`}
    >
      {status}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-2 sm:px-3">
      <div className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:text-[11px]">{label}</div>
      <div className="mt-1 truncate text-xs font-black text-slate-950 sm:text-sm">{value ?? "-"}</div>
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
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `$${value.toFixed(2)}`;
}

function number(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(2).replace(/\.00$/, "");
}

function capitalizeSentence(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function withPeriod(value) {
  const text = String(value || "");
  return text.endsWith(".") ? text : `${text}.`;
}

function truncateText(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}
