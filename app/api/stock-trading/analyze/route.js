const DEFAULT_TICKERS = [
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

const MAX_TICKERS = 20;

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const tickers = parseTickers(url.searchParams.get("tickers"));
  const period = url.searchParams.get("period") || "5y";
  const interval = url.searchParams.get("interval") || "1d";
  const accountSize = cleanNumber(url.searchParams.get("accountSize"), 10000);
  const riskPercent = cleanNumber(url.searchParams.get("riskPercent"), 1);

  const results = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const candles = await loadYahooCandles(ticker, period, interval);
        return analyzeTicker(ticker, candles, accountSize, riskPercent);
      } catch (error) {
        return {
          ticker,
          ok: false,
          error: error?.message || String(error),
        };
      }
    })
  );

  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: "Yahoo Finance chart API",
    disclaimer:
      "Education, analysis, backtesting, and alerts only. Not financial advice. No broker connection and no trade execution.",
    settings: { tickers, period, interval, accountSize, riskPercent },
    results,
  });
}

function parseTickers(value) {
  const list = String(value || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  return (list.length ? list : DEFAULT_TICKERS).slice(0, MAX_TICKERS);
}

function cleanNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

async function loadYahooCandles(ticker, range = "5y", interval = "1d") {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&events=history`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "EPF-Toolbox-Stock-Trading/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance returned ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const error = payload?.chart?.error;
  if (error) throw new Error(error.description || "Yahoo Finance chart error");
  if (!result?.timestamp?.length) throw new Error("No price history returned");

  const quote = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];
  const candles = result.timestamp
    .map((timestamp, index) => ({
      Date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      Open: quote.open?.[index],
      High: quote.high?.[index],
      Low: quote.low?.[index],
      Close: adjClose[index] ?? quote.close?.[index],
      Volume: quote.volume?.[index],
    }))
    .filter((row) =>
      [row.Open, row.High, row.Low, row.Close].every((item) => Number.isFinite(Number(item)))
    )
    .map((row) => ({
      ...row,
      Open: Number(row.Open),
      High: Number(row.High),
      Low: Number(row.Low),
      Close: Number(row.Close),
      Volume: Number(row.Volume || 0),
    }));

  if (candles.length < 220) {
    throw new Error("At least 220 daily candles are required for EMA200 analysis");
  }

  return candles;
}

function analyzeTicker(ticker, candles, accountSize, riskPercent) {
  const rows = addIndicators(candles);
  const latest = buildSnapshot(rows, rows.length - 1, accountSize, riskPercent);
  const backtest = runBacktest(rows);
  const chart = rows.slice(-1300).map((row) => ({
    date: row.Date,
    open: round(row.Open),
    high: round(row.High),
    low: round(row.Low),
    close: round(row.Close),
    sma20: round(row.SMA20),
    sma50: round(row.SMA50),
    sma200: round(row.SMA200),
    ema20: round(row.EMA20),
    ema50: round(row.EMA50),
    ema200: round(row.EMA200),
    bbUpper: round(row.BBUpper),
    bbMiddle: round(row.BBMiddle),
    bbLower: round(row.BBLower),
    rsi: round(row.RSI),
    williamsR: round(row.WilliamsR),
    macd: round(row.MACD, 4),
    macdSignal: round(row.MACDSignal, 4),
    macdHist: round(row.MACDHist, 4),
    adx: round(row.ADX),
    plusDI: round(row.PlusDI),
    minusDI: round(row.MinusDI),
    volume: Math.round(row.Volume || 0),
    volumeSma20: Math.round(row.VolumeSMA20 || 0),
  }));

  return {
    ok: true,
    ticker,
    ...latest,
    chart,
    backtest,
  };
}

function addIndicators(candles) {
  const closes = candles.map((row) => row.Close);
  const highs = candles.map((row) => row.High);
  const lows = candles.map((row) => row.Low);
  const volumes = candles.map((row) => row.Volume);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const volumeSma20 = sma(volumes, 20);
  const rsi14 = rsi(closes, 14);
  const macdData = macd(closes);
  const bb = bollinger(closes, 20, 2);
  const atr14 = atr(highs, lows, closes, 14);
  const dmi = adx(highs, lows, closes, 14);
  const williamsR14 = williamsR(highs, lows, closes, 14);

  return candles.map((row, index) => ({
    ...row,
    EMA20: ema20[index],
    EMA50: ema50[index],
    EMA200: ema200[index],
    SMA20: sma20[index],
    SMA50: sma50[index],
    SMA200: sma200[index],
    VolumeSMA20: volumeSma20[index],
    RSI: rsi14[index],
    WilliamsR: williamsR14[index],
    MACD: macdData.line[index],
    MACDSignal: macdData.signal[index],
    MACDHist: macdData.histogram[index],
    BBUpper: bb.upper[index],
    BBMiddle: bb.middle[index],
    BBLower: bb.lower[index],
    ATR: atr14[index],
    ADX: dmi.adx[index],
    PlusDI: dmi.plusDI[index],
    MinusDI: dmi.minusDI[index],
  }));
}

function buildSnapshot(rows, index, accountSize, riskPercent) {
  const row = rows[index];
  const prev = rows[index - 1] || row;
  const levels = supportResistance(rows, index);
  const risk = riskPlan(row, levels, accountSize, riskPercent);
  const trend = trendStatus(row);
  const facts = conditionFacts(row, prev, levels, risk);
  const score = scoreSetup(facts);
  const signal = signalFor(row, prev, trend, facts, score, risk);
  const action = buildAction(row, prev, signal, trend, facts, risk);
  const reason = formatAction(action);

  return {
    date: row.Date,
    price: round(row.Close),
    signal,
    score,
    trend,
    rsi: round(row.RSI),
    williamsR: round(row.WilliamsR),
    macdStatus: facts.macdImproving ? "Improving" : row.MACDHist < 0 ? "Bearish" : "Weakening",
    adx: round(row.ADX),
    plusDI: round(row.PlusDI),
    minusDI: round(row.MinusDI),
    support: round(levels.nearestSupport),
    resistance: round(levels.nearestResistance),
    stop: round(risk.suggestedStop),
    target: round(risk.target),
    riskReward: round(risk.riskReward, 2),
    shares: risk.shares,
    maxRiskDollars: round(risk.maxRiskDollars, 2),
    riskPerShare: round(risk.riskPerShare, 2),
    lastSignalDate: row.Date,
    action,
    reason,
    levels,
    facts,
  };
}

function conditionFacts(row, prev, levels, risk) {
  const nearEma20 = row.Close <= row.EMA20 * 1.025 && row.Close >= row.EMA20 * 0.96;
  const nearLowerBand = row.Close <= row.BBLower * 1.04;
  const resistanceDistance = levels.nearestResistance
    ? (levels.nearestResistance - row.Close) / row.Close
    : 0.05;
  return {
    priceAboveEma200: row.Close > row.EMA200,
    ema50AboveEma200: row.EMA50 > row.EMA200,
    pullbackArea: nearEma20 || nearLowerBand,
    rsiRecoveryZone: row.RSI >= 40 && row.RSI <= 58,
    rsiImproving: row.RSI > prev.RSI,
    macdImproving: row.MACDHist > prev.MACDHist,
    dmiPositive: row.PlusDI > row.MinusDI || (prev.PlusDI <= prev.MinusDI && row.PlusDI > row.MinusDI),
    adxTrend: row.ADX > 18,
    volumeOkay: row.Volume >= row.VolumeSMA20 * 0.85,
    notNearResistance: resistanceDistance >= 0.025,
    candleConfirm: row.Close > prev.High,
    closeAboveEma20: row.Close > row.EMA20,
    riskRewardOkay: risk.riskReward >= 2,
    rsiTooHigh: row.RSI > 68,
    extended: row.Close > row.EMA20 * 1.08,
    closeBelowEma20: row.Close < row.EMA20,
    closeBelowEma50: row.Close < row.EMA50,
    closeBelowEma200: row.Close < row.EMA200,
    macdBearish: row.MACDHist < 0 && row.MACD < row.MACDSignal,
    rsiFallingUnder40: row.RSI < 40 && row.RSI < prev.RSI,
    weakTrend: row.ADX < 18,
    nearResistance: resistanceDistance < 0.025,
    atrStopHit: row.Close <= risk.suggestedStop,
  };
}

function scoreSetup(facts) {
  let score = 0;
  score += points([facts.priceAboveEma200, facts.ema50AboveEma200], 25);
  score += points([facts.rsiRecoveryZone, facts.rsiImproving, facts.macdImproving], 20);
  score += facts.volumeOkay ? 10 : 0;
  score += points([facts.dmiPositive, facts.adxTrend], 15);
  score += facts.candleConfirm ? 15 : facts.closeAboveEma20 ? 8 : 0;
  score += facts.riskRewardOkay ? 15 : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function points(items, max) {
  return (items.filter(Boolean).length / items.length) * max;
}

function signalFor(row, prev, trend, facts, score, risk) {
  const hardExit =
    facts.closeBelowEma50 ||
    facts.atrStopHit ||
    (facts.macdBearish && row.RSI < prev.RSI) ||
    trend !== "Bullish" && prev.Close > prev.EMA200;
  if (hardExit) return "EXIT TRIGGER";

  const avoid =
    facts.closeBelowEma200 ||
    row.EMA50 < row.EMA200 ||
    (facts.weakTrend && facts.macdBearish) ||
    facts.rsiFallingUnder40 ||
    risk.riskReward < 1.3;
  if (avoid) return "WAIT";

  const sellWatch =
    facts.nearResistance ||
    (row.RSI > 68 && row.RSI < prev.RSI) ||
    (row.MACDHist < prev.MACDHist && row.MACDHist > 0) ||
    facts.closeBelowEma20;
  if (sellWatch && score < 85) return "EXIT WATCH";

  if (
    score >= 85 &&
    facts.candleConfirm &&
    facts.riskRewardOkay &&
    facts.closeAboveEma20 &&
    facts.macdImproving
  ) {
    return "ENTRY CONFIRMED";
  }
  if (score >= 70) return "ENTRY WATCH";
  if (score >= 55) return "WAIT";
  return "WAIT";
}

function trendStatus(row) {
  const nearEma200 = Math.abs(row.Close - row.EMA200) / row.EMA200 < 0.025;
  if (row.Close > row.EMA200 && row.EMA50 > row.EMA200) return "Bullish";
  if (nearEma200 || (row.Close > row.EMA200 && row.EMA50 < row.EMA200)) return "Neutral";
  if (row.Close < row.EMA200 && row.EMA50 < row.EMA200) return "Bearish";
  return "Neutral";
}

function supportResistance(rows, index) {
  const window20 = rows.slice(Math.max(0, index - 19), index + 1);
  const window50 = rows.slice(Math.max(0, index - 49), index + 1);
  const row = rows[index];
  const swingLow20 = min(window20.map((item) => item.Low));
  const swingLow50 = min(window50.map((item) => item.Low));
  const swingHigh20 = max(window20.map((item) => item.High));
  const swingHigh50 = max(window50.map((item) => item.High));
  const supports = [swingLow20, swingLow50, row.EMA20, row.EMA50, row.BBLower].filter(
    (value) => Number.isFinite(value) && value < row.Close
  );
  const resistances = [swingHigh20, swingHigh50, row.BBUpper].filter(
    (value) => Number.isFinite(value) && value > row.Close
  );
  return {
    swingLow20,
    swingLow50,
    swingHigh20,
    swingHigh50,
    nearestSupport: supports.length ? max(supports) : swingLow20,
    nearestResistance: resistances.length ? min(resistances) : row.Close + row.ATR * 3,
  };
}

function riskPlan(row, levels, accountSize, riskPercent) {
  const atrStop = row.Close - 1.5 * row.ATR;
  const structureStop = levels.swingLow20;
  const suggestedStop = Math.min(atrStop, structureStop);
  const riskPerShare = Math.max(row.Close - suggestedStop, 0.01);
  const maxRiskDollars = accountSize * (riskPercent / 100);
  const shares = Math.max(0, Math.floor(maxRiskDollars / riskPerShare));
  const twoRTarget = row.Close + riskPerShare * 2;
  const target = levels.nearestResistance > row.Close ? Math.max(levels.nearestResistance, twoRTarget) : twoRTarget;
  const reward = Math.max(target - row.Close, 0);
  return {
    atrStop,
    structureStop,
    suggestedStop,
    target,
    riskPerShare,
    maxRiskDollars,
    shares,
    riskReward: reward / riskPerShare,
  };
}

function buildAction(row, prev, signal, trend, facts, risk) {
  const trigger = round(prev.High);
  const stop = round(risk.suggestedStop);
  const target = round(risk.target);
  const riskReward = round(risk.riskReward, 2);
  const ema20 = round(row.EMA20);

  const whyBySignal = {
    "ENTRY WATCH": facts.macdImproving
      ? "Trend is positive and momentum is improving."
      : "Trend is positive but candle confirmation is still missing.",
    "ENTRY CONFIRMED": "The latest daily candle confirmed the entry rule.",
    WAIT: facts.nearResistance
      ? "Price is too close to resistance for a clean entry."
      : "The setup is not confirmed yet.",
    "EXIT WATCH": "Momentum is weakening or price is near resistance.",
    "EXIT TRIGGER": "The exit rule has been triggered by trend or stop weakness.",
  };

  const enterOnlyIfBySignal = {
    "ENTRY CONFIRMED": `latest daily candle closed above the previous high of ${money(trigger)}`,
    "EXIT TRIGGER": `do not enter; reconsider only if daily candle closes above ${money(trigger)}`,
    "EXIT WATCH": `do not enter; reconsider only if daily candle closes above ${money(trigger)}`,
    WAIT: `daily candle closes above ${money(trigger)}`,
    "ENTRY WATCH": `daily candle closes above ${money(trigger)}`,
  };

  const warningBySignal = {
    "ENTRY WATCH": `If price closes below EMA20 at ${money(ema20)}, setup becomes weak.`,
    "ENTRY CONFIRMED": `If price closes below the stop area at ${money(stop)}, the signal fails.`,
    WAIT: `If risk/reward stays below 2:1, the trade is not worth chasing.`,
    "EXIT WATCH": `If price closes below EMA20 at ${money(ema20)}, exit risk increases.`,
    "EXIT TRIGGER": `If already holding, waiting can increase the loss.`,
  };

  return {
    now: signal,
    why: whyBySignal[signal] || whyBySignal.WAIT,
    enterOnlyIf: enterOnlyIfBySignal[signal] || enterOnlyIfBySignal.WAIT,
    stopArea: stop,
    targetArea: target,
    riskReward,
    whatCanGoWrong: warningBySignal[signal] || warningBySignal.WAIT,
    trend,
  };
}

function formatAction(action) {
  return [
    `NOW: ${action.now}`,
    `WHY: ${action.why}`,
    `ENTER ONLY IF: ${capitalizeSentence(action.enterOnlyIf)}.`,
    `STOP AREA: ${money(action.stopArea)}.`,
    `TARGET AREA: ${money(action.targetArea)}.`,
    `RISK/REWARD: ${action.riskReward}:1.`,
    `WHAT CAN GO WRONG: ${action.whatCanGoWrong}`,
  ].join("\n");
}

function runBacktest(rows) {
  let position = null;
  const trades = [];
  const signals = [];

  for (let i = 220; i < rows.length; i += 1) {
    const snapshot = buildSnapshot(rows, i, 10000, 1);
    if (["ENTRY CONFIRMED", "ENTRY WATCH", "EXIT WATCH", "EXIT TRIGGER", "WAIT"].includes(snapshot.signal)) {
      signals.push({
        date: snapshot.date,
        signal: snapshot.signal,
        price: snapshot.price,
        score: snapshot.score,
      });
    }

    if (!position && snapshot.signal === "ENTRY CONFIRMED") {
      position = {
        entryDate: snapshot.date,
        entry: rows[i].Close,
        stop: snapshot.stop,
        target: snapshot.target,
      };
      continue;
    }

    if (position) {
      const exitByRule = ["EXIT TRIGGER", "EXIT WATCH", "WAIT"].includes(snapshot.signal);
      const exitByStop = rows[i].Close <= position.stop;
      const exitByTarget = rows[i].Close >= position.target;
      const heldTooLong = daysBetween(position.entryDate, snapshot.date) >= 60;
      if (exitByRule || exitByStop || exitByTarget || heldTooLong) {
        const exit = rows[i].Close;
        const returnPct = ((exit - position.entry) / position.entry) * 100;
        trades.push({
          entryDate: position.entryDate,
          exitDate: snapshot.date,
          entry: round(position.entry),
          exit: round(exit),
          returnPct: round(returnPct, 2),
        });
        position = null;
      }
    }
  }

  const wins = trades.filter((trade) => trade.returnPct > 0);
  const losses = trades.filter((trade) => trade.returnPct <= 0);
  const totalReturn = trades.reduce((sum, trade) => sum + trade.returnPct, 0);
  return {
    trades: trades.length,
    winRate: trades.length ? round((wins.length / trades.length) * 100, 1) : 0,
    averageWin: round(avg(wins.map((trade) => trade.returnPct)), 2),
    averageLoss: round(avg(losses.map((trade) => trade.returnPct)), 2),
    totalReturn: round(totalReturn, 2),
    maxDrawdown: round(maxDrawdown(rows.map((row) => row.Close)), 2),
    bestTrade: trades.length ? max(trades.map((trade) => trade.returnPct)) : 0,
    worstTrade: trades.length ? min(trades.map((trade) => trade.returnPct)) : 0,
    lastSignals: signals.slice(-10),
  };
}

function ema(values, period) {
  const output = Array(values.length).fill(null);
  const multiplier = 2 / (period + 1);
  let previous = null;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (i < period - 1) continue;
    if (i === period - 1) {
      previous = avg(values.slice(0, period));
    } else {
      previous = value * multiplier + previous * (1 - multiplier);
    }
    output[i] = previous;
  }
  return output;
}

function sma(values, period) {
  return values.map((_, index) => {
    if (index < period - 1) return null;
    return avg(values.slice(index - period + 1, index + 1));
  });
}

function rsi(values, period) {
  const output = Array(values.length).fill(null);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    if (i <= period) {
      gain += Math.max(change, 0);
      loss += Math.max(-change, 0);
      if (i === period) output[i] = rsiValue(gain / period, loss / period);
      continue;
    }
    gain = (gain * (period - 1) + Math.max(change, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-change, 0)) / period;
    output[i] = rsiValue(gain, loss);
  }
  return output;
}

function rsiValue(avgGain, avgLoss) {
  if (!avgLoss) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function macd(values) {
  const ema12 = ema(values, 12);
  const ema26 = ema(values, 26);
  const line = values.map((_, index) =>
    Number.isFinite(ema12[index]) && Number.isFinite(ema26[index]) ? ema12[index] - ema26[index] : null
  );
  const signal = ema(line.map((value) => value ?? 0), 9).map((value, index) => (index < 34 ? null : value));
  const histogram = line.map((value, index) =>
    Number.isFinite(value) && Number.isFinite(signal[index]) ? value - signal[index] : null
  );
  return { line, signal, histogram };
}

function bollinger(values, period, deviations) {
  const middle = sma(values, period);
  const upper = Array(values.length).fill(null);
  const lower = Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i += 1) {
    const slice = values.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = avg(slice.map((value) => (value - mean) ** 2));
    const sd = Math.sqrt(variance);
    upper[i] = mean + deviations * sd;
    lower[i] = mean - deviations * sd;
  }
  return { upper, middle, lower };
}

function williamsR(highs, lows, closes, period) {
  return closes.map((close, index) => {
    if (index < period - 1) return null;
    const high = max(highs.slice(index - period + 1, index + 1));
    const low = min(lows.slice(index - period + 1, index + 1));
    if (!Number.isFinite(high) || !Number.isFinite(low) || high === low) return null;
    return ((high - close) / (high - low)) * -100;
  });
}

function atr(highs, lows, closes, period) {
  const tr = highs.map((high, index) => {
    if (index === 0) return high - lows[index];
    return max([high - lows[index], Math.abs(high - closes[index - 1]), Math.abs(lows[index] - closes[index - 1])]);
  });
  return smoothed(tr, period);
}

function adx(highs, lows, closes, period) {
  const plusDm = Array(highs.length).fill(0);
  const minusDm = Array(highs.length).fill(0);
  const tr = Array(highs.length).fill(0);
  for (let i = 1; i < highs.length; i += 1) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDm[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDm[i] = downMove > upMove && downMove > 0 ? downMove : 0;
    tr[i] = max([highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])]);
  }
  const atrValues = smoothed(tr, period);
  const plusSmoothed = smoothed(plusDm, period);
  const minusSmoothed = smoothed(minusDm, period);
  const plusDI = plusSmoothed.map((value, index) => (atrValues[index] ? (100 * value) / atrValues[index] : null));
  const minusDI = minusSmoothed.map((value, index) => (atrValues[index] ? (100 * value) / atrValues[index] : null));
  const dx = plusDI.map((plus, index) => {
    const minus = minusDI[index];
    if (!Number.isFinite(plus) || !Number.isFinite(minus) || plus + minus === 0) return null;
    return (100 * Math.abs(plus - minus)) / (plus + minus);
  });
  const adxValues = smoothed(dx.map((value) => value ?? 0), period).map((value, index) => (index < period * 2 ? null : value));
  return { adx: adxValues, plusDI, minusDI };
}

function smoothed(values, period) {
  const output = Array(values.length).fill(null);
  let previous = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i] || 0;
    if (i < period) {
      previous += value;
      if (i === period - 1) output[i] = previous / period;
      continue;
    }
    previous = (previous * (period - 1) + value) / period;
    output[i] = previous;
  }
  return output;
}

function max(values) {
  return Math.max(...values.filter(Number.isFinite));
}

function min(values) {
  return Math.min(...values.filter(Number.isFinite));
}

function avg(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function maxDrawdown(values) {
  let peak = values[0] || 0;
  let drawdown = 0;
  for (const value of values) {
    if (value > peak) peak = value;
    if (peak) drawdown = Math.min(drawdown, ((value - peak) / peak) * 100);
  }
  return drawdown;
}

function daysBetween(start, end) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
}

function money(value) {
  return typeof value === "number" && Number.isFinite(value) ? `$${value.toFixed(2)}` : "$0.00";
}

function capitalizeSentence(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function round(value, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
