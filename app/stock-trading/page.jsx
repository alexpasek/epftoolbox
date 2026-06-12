"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
};

const signalStyles = {
  "ENTRY CONFIRMED": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "ENTRY WATCH": "bg-sky-100 text-sky-900 border-sky-300",
  WAIT: "bg-amber-100 text-amber-900 border-amber-300",
  "EXIT WATCH": "bg-orange-100 text-orange-900 border-orange-300",
  "EXIT TRIGGER": "bg-rose-100 text-rose-900 border-rose-300",
  AVOID: "bg-slate-200 text-slate-900 border-slate-300",
};

export default function StockTradingPage() {
  const [tickersText, setTickersText] = useState(defaultTickers.join(", "));
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [selectedTicker, setSelectedTicker] = useState(defaultTickers[0]);
  const [timeframe, setTimeframe] = useState("6M");
  const [chartTools, setChartTools] = useState(defaultChartTools);
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

      <section className="mx-auto grid max-w-[1720px] gap-4 px-4 py-5 xl:grid-cols-[300px_1fr]">
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
              <p><strong>ENTRY CONFIRMED:</strong> latest closed candle confirms the entry rule.</p>
              <p><strong>ENTRY WATCH:</strong> setup is forming, but entry needs a candle close above the trigger.</p>
              <p><strong>WAIT:</strong> do not enter until the exact price condition appears.</p>
              <p><strong>EXIT WATCH:</strong> weakness is starting; watch the exit level closely.</p>
              <p><strong>EXIT TRIGGER:</strong> the rule says the setup has failed or should be exited.</p>
            </div>
          </section>
        </aside>

        <div className="space-y-4">
          {selected ? (
            <>
              <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Live Price & Chart Controls</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <select
                        value={selectedTicker}
                        onChange={(event) => setSelectedTicker(event.target.value)}
                        className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-lg font-black text-slate-950"
                      >
                        {(data?.results || []).filter((row) => row.ok).map((row) => (
                          <option key={row.ticker} value={row.ticker}>{row.ticker}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={loadSignals}
                        disabled={loading}
                        className="rounded-md bg-sky-600 px-4 py-2 text-sm font-black text-white disabled:cursor-wait disabled:bg-slate-400"
                      >
                        {loading ? "Refreshing..." : "Refresh Price & Charts"}
                      </button>
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                        Auto
                        <select
                          value={autoRefreshMinutes}
                          onChange={(event) => setAutoRefreshMinutes(event.target.value)}
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
                      Last loaded: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "not loaded yet"}.
                    </p>
                  </div>
                  <TimeframeButtons value={timeframe} onChange={setTimeframe} />
                </div>
              </div>
              <SingleAnalysis item={selected} />
              <BeginnerPlan item={selected} />
              <ChartPanel
                item={selected}
                timeframe={timeframe}
                tools={chartTools}
                onToggleTool={(tool) => setChartTools((current) => ({ ...current, [tool]: !current[tool] }))}
              />
              <OverviewTable
                rows={data?.results || []}
                selectedTicker={selectedTicker}
                onSelect={setSelectedTicker}
                loading={loading}
              />
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

function TimeframeButtons({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {timeframes.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onChange(item.label)}
          className={`rounded-md border px-3 py-2 text-sm font-black ${
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
          <ActionBlock item={item} />
          <RuleEnginePanel item={item} />
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

function BeginnerPlan({ item }) {
  const action = item.action || {};
  const strategies = item.strategies || [];
  const entryText = action.enterOnlyIf
    ? withPeriod(capitalizeSentence(action.enterOnlyIf))
    : "Wait for the entry rule to appear.";
  const warning = action.whatCanGoWrong || "If the rule fails, do not force the trade.";

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Beginner Trade Plan</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-black text-slate-950">{money(item.price)}</span>
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

function ChartPanel({ item, timeframe, tools, onToggleTool }) {
  const rows = useMemo(() => chartRowsForTimeframe(item.chart || [], timeframe), [item.chart, timeframe]);
  const latest = rows[rows.length - 1] || {};
  const timeframeLabel = timeframe === "1D" ? "latest daily candle" : `${timeframe} daily candles`;
  const indicatorCards = [
    tools.volume ? <VolumeChart key="volume" rows={rows} /> : null,
    tools.macd ? <MacdChart key="macd" rows={rows} /> : null,
    tools.rsi ? <SparkChart key="rsi" title="RSI 14" rows={rows} keys={[["rsi", "#c4d600"]]} height={150} fixedMin={0} fixedMax={100} levels={[70, 30]} note="Above 70 is stretched. Below 30 is oversold." /> : null,
    tools.williamsR ? <SparkChart key="williamsR" title="Williams %R" rows={rows} keys={[["williamsR", "#a855f7"]]} height={150} fixedMin={-100} fixedMax={0} levels={[-20, -80]} note={williamsStatus(latest.williamsR)} /> : null,
    tools.dmi ? <SparkChart key="dmi" title="DMI 14" rows={rows} keys={[["plusDI", "#0ea5e9"], ["minusDI", "#c4d600"], ["adx", "#2dd4bf"]]} height={150} fixedMin={0} fixedMax={60} note="+DI over -DI favors buyers. ADX shows trend strength." /> : null,
  ].filter(Boolean);

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Big Candlestick Chart</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {timeframeLabel}. Using daily candle data. Entry confirmation is based on daily candle close.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          <Legend color="#16a34a" label="Up candle" />
          <Legend color="#dc2626" label="Down candle" />
          <Legend color="#0284c7" label="EMA20" />
          <Legend color="#f97316" label="SMA20" />
          <Legend color="#7c3aed" label="SMA50" />
          <Legend color="#be123c" label="SMA200" />
          <Legend color="#94a3b8" label="Bollinger" />
        </div>
      </div>
      <div className="mt-4">
        <ChartToolBar tools={tools} onToggleTool={onToggleTool} />
      </div>
      <ChartRuleOverlay item={item} />
      <div className="mt-4">
        <CandlestickChart rows={rows} item={item} tools={tools} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open" value={money(latest.open)} />
        <Metric label="High" value={money(latest.high)} />
        <Metric label="Low" value={money(latest.low)} />
        <Metric label="Close" value={money(latest.close)} />
      </div>
      <div className="mt-4 grid gap-4">
        {indicatorCards}
      </div>
    </section>
  );
}

function ChartRuleOverlay({ item }) {
  const notes = item.ruleEngine?.chartNotes || [];
  if (!notes.length) return null;

  return (
    <div className="mt-4 grid gap-2 lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_130px_130px]">
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

function ChartToolBar({ tools, onToggleTool }) {
  const items = [
    ["ema20", "EMA20"],
    ["ema50", "EMA50"],
    ["ema200", "EMA200"],
    ["sma20", "SMA20"],
    ["sma50", "SMA50"],
    ["sma200", "SMA200"],
    ["bollinger", "Bollinger"],
    ["stopTarget", "Stop/Target"],
    ["volume", "Volume"],
    ["macd", "MACD"],
    ["dmi", "DMI/ADX"],
    ["rsi", "RSI"],
    ["williamsR", "Williams %R"],
    ["tooltip", "Cursor tooltip"],
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onToggleTool(key)}
          className={`rounded-md border px-2.5 py-1.5 text-xs font-black ${
            tools[key] ? "border-slate-900 bg-white text-slate-950" : "border-slate-200 bg-slate-100 text-slate-500"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CandlestickChart({ rows, item, tools }) {
  const [hover, setHover] = useState(null);
  const width = 1180;
  const height = 620;
  const padding = { top: 24, right: 64, bottom: 36, left: 52 };
  const priceValues = rows.flatMap((row) => [
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
  ]).filter(Number.isFinite);
  const minValue = priceValues.length ? Math.min(...priceValues) : 0;
  const maxValue = priceValues.length ? Math.max(...priceValues) : 1;
  const range = maxValue - minValue || 1;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const candleGap = plotWidth / Math.max(rows.length, 1);
  const candleWidth = Math.max(3, Math.min(14, candleGap * 0.64));
  const x = (index) => padding.left + index * candleGap + candleGap / 2;
  const y = (value) => padding.top + ((maxValue - value) / range) * plotHeight;
  const linePoints = (key) => rows
    .map((row, index) => Number.isFinite(row[key]) ? `${x(index)},${y(row[key])}` : null)
    .filter(Boolean)
    .join(" ");

  if (!rows.length) {
    return <div className="flex min-h-[360px] items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-slate-500">No chart data.</div>;
  }

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * width;
    const svgY = ((event.clientY - rect.top) / rect.height) * height;
    const rawIndex = Math.floor((svgX - padding.left) / candleGap);
    const index = Math.max(0, Math.min(rows.length - 1, rawIndex));
    const cursorPrice = maxValue - ((Math.max(padding.top, Math.min(padding.top + plotHeight, svgY)) - padding.top) / plotHeight) * range;
    setHover({
      index,
      row: rows[index],
      x: x(index),
      y: svgY,
      price: cursorPrice,
    });
  }

  const levels = [
    ["Stop", item.stop, "#dc2626"],
    ["Target", item.target, "#16a34a"],
  ].filter(([, value]) => Number.isFinite(value));
  const chartNotes = item.ruleEngine?.chartNotes || [];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setHover(null)}
        className="h-[360px] w-full cursor-crosshair bg-white md:h-[500px] xl:h-[620px]"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const yy = padding.top + ratio * plotHeight;
          const value = maxValue - ratio * range;
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={yy} y2={yy} stroke="#e2e8f0" />
              <text x={width - padding.right + 10} y={yy + 4} className="fill-slate-500 text-[12px] font-bold">
                {money(value)}
              </text>
            </g>
          );
        })}

        {chartNotes.length ? (
          <g>
            <rect x={padding.left + 8} y={padding.top + 8} width="390" height="116" rx="8" fill="#ffffff" stroke="#cbd5e1" opacity="0.96" />
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

        {tools.bollinger ? (
          <>
            <polyline fill="none" stroke="#94a3b8" strokeWidth="1.5" points={linePoints("bbUpper")} />
            <polyline fill="none" stroke="#94a3b8" strokeWidth="1.5" points={linePoints("bbLower")} />
          </>
        ) : null}
        {tools.ema20 ? <polyline fill="none" stroke="#0284c7" strokeWidth="2.2" points={linePoints("ema20")} /> : null}
        {tools.ema50 ? <polyline fill="none" stroke="#0f172a" strokeWidth="1.8" points={linePoints("ema50")} /> : null}
        {tools.ema200 ? <polyline fill="none" stroke="#dc2626" strokeWidth="1.8" points={linePoints("ema200")} /> : null}
        {tools.sma20 ? <polyline fill="none" stroke="#f97316" strokeWidth="1.8" points={linePoints("sma20")} /> : null}
        {tools.sma50 ? <polyline fill="none" stroke="#7c3aed" strokeWidth="1.8" points={linePoints("sma50")} /> : null}
        {tools.sma200 ? <polyline fill="none" stroke="#be123c" strokeWidth="2" points={linePoints("sma200")} /> : null}

        {tools.stopTarget ? levels.map(([label, value, color]) => (
          <g key={label}>
            <line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} stroke={color} strokeDasharray="7 7" strokeWidth="1.5" />
            <text x={padding.left + 8} y={y(value) - 6} fill={color} className="text-[12px] font-black">
              {label} {money(value)}
            </text>
          </g>
        )) : null}

        {rows.map((row, index) => {
          const rising = row.close >= row.open;
          const color = rising ? "#16a34a" : "#dc2626";
          const top = y(Math.max(row.open, row.close));
          const bodyHeight = Math.max(2, Math.abs(y(row.open) - y(row.close)));
          return (
            <g key={row.date}>
              <line x1={x(index)} x2={x(index)} y1={y(row.high)} y2={y(row.low)} stroke={color} strokeWidth="1.4" />
              <rect
                x={x(index) - candleWidth / 2}
                y={top}
                width={candleWidth}
                height={bodyHeight}
                fill={rising ? "#dcfce7" : "#fee2e2"}
                stroke={color}
                strokeWidth="1.4"
              />
            </g>
          );
        })}

        <text x={padding.left} y={height - 12} className="fill-slate-500 text-[12px] font-bold">{rows[0]?.date}</text>
        <text x={width - padding.right - 78} y={height - 12} className="fill-slate-500 text-[12px] font-bold">{rows[rows.length - 1]?.date}</text>
        {tools.tooltip && hover ? <ChartHover hover={hover} width={width} height={height} padding={padding} /> : null}
      </svg>
    </div>
  );
}

function ChartHover({ hover, width, height, padding }) {
  const row = hover.row || {};
  const boxWidth = 230;
  const boxHeight = 230;
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
  ];

  return (
    <g pointerEvents="none">
      <line x1={hover.x} x2={hover.x} y1={padding.top} y2={height - padding.bottom} stroke="#475569" strokeDasharray="5 5" opacity="0.65" />
      <line x1={padding.left} x2={width - padding.right} y1={yPrice} y2={yPrice} stroke="#475569" strokeDasharray="5 5" opacity="0.65" />
      <rect x={width - padding.right + 4} y={yPrice - 13} width="58" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" />
      <text x={width - padding.right + 33} y={yPrice + 4} textAnchor="middle" className="fill-slate-950 text-[11px] font-black">
        {money(hover.price)}
      </text>
      <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx="8" fill="#ffffff" stroke="#cbd5e1" />
      {lines.map(([label, value], index) => (
        <g key={label}>
          <text x={boxX + 12} y={boxY + 24 + index * 18} className="fill-slate-500 text-[11px] font-bold">{label}</text>
          <text x={boxX + boxWidth - 12} y={boxY + 24 + index * 18} textAnchor="end" className="fill-slate-950 text-[11px] font-black">{value}</text>
        </g>
      ))}
    </g>
  );
}

function MacdChart({ rows }) {
  const width = 760;
  const height = 170;
  const padding = 18;
  const keys = [["macd", "#22c55e"], ["macdSignal", "#a855f7"]];
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
          <Legend color="#22c55e" label="MACD" />
          <Legend color="#a855f7" label="Signal" />
          <Legend color="#16a34a" label="Positive bars" />
          <Legend color="#dc2626" label="Negative bars" />
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} stroke="#94a3b8" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#cbd5e1" />
        {rows.map((row, index) => {
          if (!Number.isFinite(row.macdHist)) return null;
          const top = row.macdHist >= 0 ? y(row.macdHist) : zeroY;
          const barHeight = Math.max(1, Math.abs(y(row.macdHist) - zeroY));
          return (
            <rect
              key={row.date}
              x={x(index) - barWidth / 2}
              y={top}
              width={barWidth}
              height={barHeight}
              fill={row.macdHist >= 0 ? "#16a34a" : "#dc2626"}
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

function SparkBars({ rows }) {
  const width = 760;
  const height = 170;
  const padding = 18;
  const maxValue = Math.max(...rows.map((row) => row.volume || 0), 1);
  const barWidth = Math.max(2, (width - padding * 2) / Math.max(rows.length, 1) - 1);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#cbd5e1" />
      {rows.map((row, index) => {
        const barHeight = ((row.volume || 0) / maxValue) * (height - padding * 2);
        const xPos = padding + index * ((width - padding * 2) / Math.max(rows.length, 1));
        return (
          <rect
            key={row.date}
            x={xPos}
            y={height - padding - barHeight}
            width={barWidth}
            height={barHeight}
            fill={row.close >= row.open ? "#16a34a" : "#dc2626"}
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
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#cbd5e1" />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#cbd5e1" />
        {levels.map((level) => (
          <g key={level}>
            <line x1={padding} x2={width - padding} y1={y(level)} y2={y(level)} stroke="#94a3b8" strokeDasharray="5 5" />
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

function chartRowsForTimeframe(rows, timeframe) {
  const sessions = timeframes.find((item) => item.label === timeframe)?.sessions || 126;
  const cleanRows = (rows || []).filter((row) =>
    [row.open, row.high, row.low, row.close].every((value) => Number.isFinite(Number(value)))
  );
  return cleanRows.slice(-sessions);
}

function SignalPill({ signal }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-black ${signalStyles[signal] || signalStyles.AVOID}`}>
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
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-black ${styles[status] || styles.NEUTRAL}`}>
      {status}
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
