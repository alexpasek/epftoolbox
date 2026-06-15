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
        const candles = await loadYahooCandles(ticker, period, interval, { minCandles: 220 });
        const intradayCandles = await loadYahooCandles(ticker, "1d", "5m", { minCandles: 10 }).catch(() => []);
        return analyzeTicker(ticker, candles, accountSize, riskPercent, intradayCandles);
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

async function loadYahooCandles(ticker, range = "5y", interval = "1d", options = {}) {
  const minCandles = options.minCandles ?? 220;
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
  const timezone = result.meta?.exchangeTimezoneName || "America/Toronto";
  const isIntraday = interval.includes("m") || interval.includes("h");
  const candles = result.timestamp
    .map((timestamp, index) => ({
      Date: formatYahooTimestamp(timestamp, timezone, isIntraday),
      Timestamp: timestamp * 1000,
      Open: quote.open?.[index],
      High: quote.high?.[index],
      Low: quote.low?.[index],
      Close: quote.close?.[index] ?? adjClose[index],
      Volume: quote.volume?.[index],
    }))
    .filter((row) =>
      [row.Open, row.High, row.Low, row.Close].every((item) => Number.isFinite(Number(item)) && Number(item) > 0)
    )
    .map((row) => ({
      ...row,
      Open: Number(row.Open),
      High: Number(row.High),
      Low: Number(row.Low),
      Close: Number(row.Close),
      Volume: Number(row.Volume || 0),
    }));

  if (candles.length < minCandles) {
    throw new Error(`At least ${minCandles} candles are required`);
  }

  return candles;
}

function analyzeTicker(ticker, candles, accountSize, riskPercent, intradayCandles = []) {
  const rows = addIndicators(candles);
  const intradayRows = intradayCandles.length ? addIndicators(intradayCandles) : [];
  const latest = buildSnapshot(rows, rows.length - 1, accountSize, riskPercent, intradayRows);
  const backtest = runBacktest(rows);
  const chart = chartRows(rows.slice(-1300));
  const intradayChart = intradayRows.length ? chartRows(intradayRows) : [];

  return {
    ok: true,
    ticker,
    ...latest,
    chart,
    intradayChart,
    backtest,
  };
}

function chartRows(rows) {
  return rows.map((row) => ({
    date: row.Date,
    timestamp: row.Timestamp || null,
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

function buildSnapshot(rows, index, accountSize, riskPercent, intradayRows = []) {
  const row = rows[index];
  const prev = rows[index - 1] || row;
  const prev2 = rows[index - 2] || prev;
  const levels = supportResistance(rows, index);
  const risk = riskPlan(row, levels, accountSize, riskPercent);
  const trend = trendStatus(row);
  const facts = conditionFacts(row, prev, prev2, levels, risk);
  const score = scoreSetup(facts);
  const scoreDetails = scoreBreakdown(facts);
  const swingProjection = buildSwingProjection(rows, index);
  const ruleEngine = buildRuleEngine(row, prev, prev2, levels, risk, trend, facts, accountSize, riskPercent, swingProjection, intradayRows);
  const signal = ruleEngine.swing.now;
  const action = buildAction(row, prev, signal, trend, facts, risk, ruleEngine.swing);
  const strategies = strategyPlans(row, prev, levels, risk, accountSize, riskPercent, signal, trend, facts, ruleEngine);
  const traderSetups = buildTraderSetups(row, prev, levels, facts, trend);
  const reason = formatAction(action);

  return {
    date: row.Date,
    price: round(row.Close),
    signal,
    score,
    scoreDetails,
    swingProjection,
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
    strategies,
    ruleEngine,
    traderSetups,
    reason,
    levels,
    facts,
  };
}

function conditionFacts(row, prev, prev2, levels, risk) {
  const nearEma20 = row.Close <= row.EMA20 * 1.025 && row.Close >= row.EMA20 * 0.96;
  const nearSma20 = row.Close <= row.SMA20 * 1.025 && row.Close >= row.SMA20 * 0.96;
  const nearSma50 = row.Close <= row.SMA50 * 1.035 && row.Close >= row.SMA50 * 0.96;
  const nearEma50 = row.Close <= row.EMA50 * 1.035 && row.Close >= row.EMA50 * 0.96;
  const nearLowerBand = row.Close <= row.BBLower * 1.04;
  const nearUpperBand = row.Close >= row.BBUpper * 0.98;
  const resistanceDistance = levels.nearestResistance
    ? (levels.nearestResistance - row.Close) / row.Close
    : 0.05;
  const macdCrossUp = prev.MACD <= prev.MACDSignal && row.MACD > row.MACDSignal;
  const macdCrossDown = prev.MACD >= prev.MACDSignal && row.MACD < row.MACDSignal;
  const macdWeakensTwoCandles = row.MACDHist < prev.MACDHist && prev.MACDHist < prev2.MACDHist;
  const williamsRecovery = prev.WilliamsR < -80 && row.WilliamsR > -80;
  const williamsTakeProfit = prev.WilliamsR > -20 && row.WilliamsR < -20;
  const williamsBearish = row.WilliamsR < -50 && row.WilliamsR < prev.WilliamsR;
  const bullishDmiCross = prev.PlusDI <= prev.MinusDI && row.PlusDI > row.MinusDI && row.ADX >= 18;
  const bearishDmiCross = prev.MinusDI <= prev.PlusDI && row.MinusDI > row.PlusDI && row.ADX >= 18;
  const strongBullishCandle = row.Close > row.Open && row.Close >= row.High - (row.High - row.Low) * 0.25 && row.Close > prev.High;
  const strongBearishCandle = row.Close < row.Open && row.Close <= row.Low + (row.High - row.Low) * 0.25 && row.Close < prev.Low;
  return {
    priceAboveEma200: row.Close > row.EMA200,
    priceAboveSma200: row.Close > row.SMA200,
    ema50AboveEma200: row.EMA50 > row.EMA200,
    pullbackArea: nearEma20 || nearSma20 || nearLowerBand,
    positionPullbackArea: nearSma50 || nearEma50,
    rsiRecoveryZone: row.RSI >= 40 && row.RSI <= 58,
    rsiImproving: row.RSI > prev.RSI,
    macdImproving: row.MACDHist > prev.MACDHist,
    macdWeakening: row.MACDHist < prev.MACDHist,
    macdWeakensTwoCandles,
    macdCrossUp,
    macdCrossDown,
    dmiPositive: row.PlusDI > row.MinusDI || bullishDmiCross,
    dmiSellers: row.MinusDI > row.PlusDI || bearishDmiCross,
    bullishDmiCross,
    bearishDmiCross,
    adxTrend: row.ADX >= 18,
    strongTrend: row.ADX >= 25,
    volumeStrong: row.Volume >= row.VolumeSMA20 * 1.2,
    volumeNormal: row.Volume >= row.VolumeSMA20 * 0.8 && row.Volume < row.VolumeSMA20 * 1.2,
    volumeWeak: row.Volume < row.VolumeSMA20 * 0.8,
    volumeOkay: row.Volume >= row.VolumeSMA20 * 0.8,
    bullishVolume: row.Close > prev.Close && row.Volume >= row.VolumeSMA20,
    bearishVolume: row.Close < prev.Close && row.Volume >= row.VolumeSMA20,
    notNearResistance: resistanceDistance >= 0.025,
    candleConfirm: row.Close > prev.High,
    strongBullishCandle,
    strongBearishCandle,
    closeAboveEma20: row.Close > row.EMA20,
    closeAboveSma20: row.Close > row.SMA20,
    riskRewardOkay: risk.riskReward >= 2,
    swingWatchRiskReward: risk.riskReward >= 1.5,
    positionRiskRewardOkay: risk.riskReward >= 3,
    rsiTooHigh: row.RSI > 68,
    extended: row.Close > row.EMA20 * 1.08,
    nearUpperBand,
    aboveUpperBand: row.Close > row.BBUpper,
    aboveMiddleBand: row.Close > row.BBMiddle,
    farAboveUpperBand: row.Close > row.BBUpper * 1.015,
    closeBelowEma20: row.Close < row.EMA20,
    closeBelowEma50: row.Close < row.EMA50,
    closeBelowEma200: row.Close < row.EMA200,
    closeBelowSma200: row.Close < row.SMA200,
    macdBearish: row.MACDHist < 0 && row.MACD < row.MACDSignal,
    rsiFallingUnder40: row.RSI < 40 && row.RSI < prev.RSI,
    weakTrend: row.ADX < 18,
    nearResistance: resistanceDistance < 0.025,
    atrStopHit: row.Close <= risk.suggestedStop,
    structureStopHit: row.Close <= risk.structureStop,
    williamsRecovery,
    williamsOverbought: row.WilliamsR > -20,
    williamsOversold: row.WilliamsR < -80,
    williamsTakeProfit,
    williamsBearish,
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

function scoreBreakdown(facts) {
  const rows = [
    {
      label: "Trend",
      points: points([facts.priceAboveEma200, facts.ema50AboveEma200], 25),
      max: 25,
      detail: facts.priceAboveEma200 && facts.ema50AboveEma200
        ? "Price is above EMA200 and EMA50 is above EMA200."
        : "Long-trend alignment is incomplete.",
    },
    {
      label: "Momentum",
      points: points([facts.rsiRecoveryZone, facts.rsiImproving, facts.macdImproving], 20),
      max: 20,
      detail: facts.rsiRecoveryZone && facts.rsiImproving && facts.macdImproving
        ? "RSI is in the recovery zone and MACD histogram is improving."
        : "RSI/MACD momentum is mixed.",
    },
    {
      label: "Volume",
      points: facts.volumeOkay ? 10 : 0,
      max: 10,
      detail: facts.volumeOkay ? "Volume is at least 80% of the 20-candle average." : "Volume is weak versus the 20-candle average.",
    },
    {
      label: "DMI / ADX",
      points: points([facts.dmiPositive, facts.adxTrend], 15),
      max: 15,
      detail: facts.dmiPositive && facts.adxTrend ? "+DI leads -DI and ADX is tradable." : "Direction or trend strength is not fully confirmed.",
    },
    {
      label: "Candle",
      points: facts.candleConfirm ? 15 : facts.closeAboveEma20 ? 8 : 0,
      max: 15,
      detail: facts.candleConfirm ? "Close is above the previous high." : facts.closeAboveEma20 ? "Price is above EMA20, but breakout candle is missing." : "Candle confirmation is missing.",
    },
    {
      label: "Risk / Reward",
      points: facts.riskRewardOkay ? 15 : 0,
      max: 15,
      detail: facts.riskRewardOkay ? "Current target and stop give at least 2:1." : "Current stop/target does not reach 2:1.",
    },
  ];
  return {
    total: Math.round(rows.reduce((sum, row) => sum + row.points, 0)),
    max: 100,
    rows: rows.map((row) => ({ ...row, points: Math.round(row.points) })),
  };
}

function points(items, max) {
  return (items.filter(Boolean).length / items.length) * max;
}

function buildRuleEngine(row, prev, prev2, levels, risk, trend, facts, accountSize, riskPercent, swingProjection, intradayRows = []) {
  const swing = swingDecision(row, prev, levels, risk, trend, facts);
  const position = positionDecision(row, prev, levels, risk, trend, facts);
  const day = dayDecision(intradayRows, accountSize, riskPercent);
  return {
    source: day.enabled ? "Daily candles + 5-minute intraday candles" : "Daily candles only",
    disclaimer: "Analysis and education only. No broker connection, no market orders, no automatic trading, and no guaranteed profit.",
    indicatorRules: indicatorRuleCards(row, prev, prev2, levels, risk, facts, trend),
    day,
    swing,
    position,
    chartNotes: [
      { label: "NOW", value: swing.now, tone: swing.now.includes("EXIT") ? "danger" : swing.now.includes("ENTRY") ? "success" : "neutral" },
      { label: "WHY", value: swing.why, tone: "neutral" },
      { label: "ENTRY RULE", value: swing.enterOnlyIf, tone: "success" },
      { label: "STOP", value: money(swing.stopArea), tone: "danger" },
      { label: "TARGET", value: money(swing.targetArea), tone: "success" },
      { label: "5-DAY SWING", value: swingProjection.summary, tone: swingProjection.direction === "Bullish" ? "success" : swingProjection.direction === "Bearish" ? "danger" : "neutral" },
    ],
  };
}

function indicatorRuleCards(row, prev, prev2, levels, risk, facts, trend) {
  return [
    ruleCard(
      "Williams %R 14",
      facts.williamsRecovery ? "BUY WATCH" : facts.williamsTakeProfit ? "OUT WATCH" : facts.williamsOverbought ? "WAIT" : facts.williamsBearish ? "OUT WATCH" : "NEUTRAL",
      facts.williamsRecovery
        ? `Williams %R crossed above -80 from oversold (${numberText(prev.WilliamsR)} to ${numberText(row.WilliamsR)}).`
        : facts.williamsTakeProfit
          ? `Williams %R crossed below -20 after overbought (${numberText(prev.WilliamsR)} to ${numberText(row.WilliamsR)}).`
          : facts.williamsOverbought
            ? `Williams %R is above -20 at ${numberText(row.WilliamsR)}, so do not chase without strong volume.`
            : facts.williamsBearish
              ? `Williams %R is below -50 and falling at ${numberText(row.WilliamsR)}.`
              : `Williams %R is neutral at ${numberText(row.WilliamsR)}.`,
      "Above -20 is overbought; below -80 is oversold; crossing above -80 is recovery."
    ),
    ruleCard(
      "Volume 20",
      facts.volumeStrong ? "BUY CONFIRM" : facts.volumeWeak ? "WAIT" : facts.bearishVolume ? "OUT WATCH" : "NEUTRAL",
      facts.volumeStrong
        ? `Volume is strong: ${Math.round(row.Volume)} is at least 1.2x the 20-day average.`
        : facts.volumeWeak
          ? `Volume is weak: ${Math.round(row.Volume)} is below 0.8x the 20-day average.`
          : facts.bearishVolume
            ? "Price fell on confirming volume, so sellers are active."
            : "Volume is normal, so it can support a normal swing setup.",
      "Breakouts need at least average volume; strong breakouts need 1.2x average volume."
    ),
    ruleCard(
      "DMI / ADX 14",
      facts.bullishDmiCross ? "BUY CONFIRM" : facts.bearishDmiCross ? "OUT WATCH" : facts.dmiPositive && facts.adxTrend ? "BUY WATCH" : facts.dmiSellers ? "OUT WATCH" : "WAIT",
      facts.bullishDmiCross
        ? "+DI crossed above -DI while ADX is tradable."
        : facts.bearishDmiCross
          ? "-DI crossed above +DI while ADX is tradable."
          : facts.dmiPositive && facts.adxTrend
            ? `Buyers are stronger (+DI ${numberText(row.PlusDI)} > -DI ${numberText(row.MinusDI)}) and ADX is ${numberText(row.ADX)}.`
            : facts.weakTrend
              ? `ADX is ${numberText(row.ADX)}, which is choppy/weak.`
              : "DMI is not giving a clean buyer signal.",
      "ADX measures trend strength; +DI above -DI means buyers are stronger."
    ),
    ruleCard(
      "MACD 12/26/9",
      facts.macdCrossUp ? "BUY CONFIRM" : facts.macdCrossDown || facts.macdWeakensTwoCandles ? "OUT WATCH" : facts.macdImproving ? "BUY WATCH" : facts.macdBearish ? "OUT WATCH" : "NEUTRAL",
      facts.macdCrossUp
        ? "MACD crossed above the signal line."
        : facts.macdCrossDown
          ? "MACD crossed below the signal line."
          : facts.macdWeakensTwoCandles
            ? "MACD histogram weakened for 2 candles."
            : facts.macdImproving
              ? "MACD histogram is improving versus yesterday."
              : "MACD does not confirm a fresh entry.",
      "MACD must be confirmed with trend, volume, and ADX."
    ),
    ruleCard(
      "Bollinger Bands 20/2",
      facts.aboveUpperBand && facts.volumeStrong && row.ADX > prev.ADX ? "BUY WATCH" : facts.farAboveUpperBand && facts.williamsOverbought && facts.volumeWeak ? "WAIT" : facts.aboveMiddleBand && facts.macdImproving && facts.williamsRecovery ? "BUY WATCH" : facts.pullbackArea && trend === "Bullish" ? "BUY WATCH" : facts.nearUpperBand && facts.macdWeakening ? "OUT WATCH" : "NEUTRAL",
      facts.aboveUpperBand && facts.volumeStrong && row.ADX > prev.ADX
        ? "Price closed above the upper band with strong volume and rising ADX."
        : facts.farAboveUpperBand && facts.williamsOverbought && facts.volumeWeak
          ? "Price is far above the upper band, Williams %R is overbought, and volume is weak."
          : facts.pullbackArea && trend === "Bullish"
            ? "Price is near EMA20/SMA20 or the lower band while the long trend is bullish."
            : facts.nearUpperBand && facts.macdWeakening
              ? "Price is near the upper band while MACD is weakening."
              : "Bands do not show a clean entry or exit warning.",
      "Lower band can be pullback area; upper band needs strong volume to confirm breakout."
    ),
    ruleCard(
      "Candle",
      facts.strongBullishCandle ? "BUY CONFIRM" : facts.strongBearishCandle || facts.closeBelowEma50 ? "OUT" : facts.closeBelowEma20 ? "OUT WATCH" : "NEUTRAL",
      facts.strongBullishCandle
        ? "Strong bullish candle closed near the high and above the previous high."
        : facts.strongBearishCandle
          ? "Strong bearish candle closed near the low and below the previous low."
          : facts.closeBelowEma50
            ? "Daily close is below EMA50, which triggers swing exit."
            : facts.closeBelowEma20
              ? "Daily close is below EMA20, which is a swing warning."
              : "Candle is not a decisive buy or exit candle.",
      "Entry candle must close above previous high and above EMA20/SMA20."
    ),
    ruleCard(
      "Risk",
      risk.riskReward >= 3 ? "BUY CONFIRM" : risk.riskReward >= 2 ? "BUY WATCH" : risk.riskReward >= 1.5 ? "WAIT" : "NO TRADE",
      `Current risk/reward is ${numberText(risk.riskReward)}:1 using stop ${money(risk.suggestedStop)} and target ${money(risk.target)}.`,
      "Minimum risk/reward: day 1.5:1, swing 2:1, position 3:1."
    ),
  ];
}

function dayDecision(intradayRows, accountSize, riskPercent) {
  const rows = intradayRows.filter((row) =>
    [row.Open, row.High, row.Low, row.Close].every((value) => Number.isFinite(value))
  );
  if (rows.length < 20) {
    return {
      mode: "Day trade",
      now: "WAIT",
      enabled: false,
      why: "Day trade unavailable because Yahoo did not return enough 5-minute candles.",
      enterOnlyIf: "Refresh during market hours, then use 5-minute candles only for day-trade rules.",
      stopArea: null,
      targetArea: null,
      riskReward: null,
      riskPercentUsed: Math.min(riskPercent, 0.5),
      warning: "Do not use daily candles for day-trade entries. No margin or automatic trading.",
      passed: [],
      failed: ["Intraday candles are not available."],
    };
  }

  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2] || latest;
  const openingRangeRows = rows.slice(0, Math.min(6, rows.length));
  const openingRangeHigh = max(openingRangeRows.map((row) => row.High));
  const openingRangeLow = min(openingRangeRows.map((row) => row.Low));
  const sessionHigh = max(rows.map((row) => row.High));
  const sessionLow = min(rows.map((row) => row.Low));
  const volumeAverage = avg(rows.slice(-20).map((row) => row.Volume || 0));
  const atrValue = Number.isFinite(latest.ATR) ? latest.ATR : Math.max((sessionHigh - sessionLow) / 6, latest.Close * 0.0025);
  const entry = Math.max(openingRangeHigh, latest.High);
  const stop = Math.min(latest.Low, latest.Close - atrValue * 0.75);
  const riskPerShare = Math.max(entry - stop, 0.01);
  const target = entry + riskPerShare * 1.5;
  const riskReward = (target - entry) / riskPerShare;
  const dayRiskDollars = accountSize * (Math.min(riskPercent, 0.5) / 100);
  const shares = Math.max(0, Math.floor(dayRiskDollars / riskPerShare));

  const aboveOpeningRange = latest.Close > openingRangeHigh;
  const reclaimingOpeningRange = latest.Close > openingRangeHigh * 0.998 && latest.Close > prev.Close;
  const aboveIntradayEma = latest.Close > latest.EMA20 && latest.EMA20 >= latest.EMA50;
  const momentumImproving = latest.MACDHist > prev.MACDHist || latest.RSI > prev.RSI;
  const volumeOkay = latest.Volume >= volumeAverage * 0.8;
  const exitTrigger = latest.Close < latest.EMA20 || latest.Close < openingRangeLow || latest.Close <= stop;
  const entryConfirmed = aboveOpeningRange && aboveIntradayEma && momentumImproving && volumeOkay;
  const entryWatch = reclaimingOpeningRange && momentumImproving && !exitTrigger;

  if (exitTrigger) {
    return {
      ...decision(
        "Day trade",
        "EXIT TRIGGER",
        "5-minute structure is weak: price lost EMA20, opening range low, or the intraday stop.",
        `Do not enter unless a 5-minute candle reclaims ${money(entry)} with volume at least 80% of the 20-candle average.`,
        stop,
        target,
        riskReward,
        ["5-minute exit condition is active."],
        "A day trade should be closed the same session; do not average down."
      ),
      enabled: true,
      riskPercentUsed: Math.min(riskPercent, 0.5),
      shares,
      openingRangeHigh: round(openingRangeHigh),
      openingRangeLow: round(openingRangeLow),
      entryArea: round(entry),
    };
  }

  if (entryConfirmed) {
    return {
      ...decision(
        "Day trade",
        "ENTRY CONFIRMED",
        "5-minute price broke the opening range while holding EMA20/EMA50 with momentum and volume support.",
        `Buy only above ${money(entry)} on the next 5-minute candle; cancel if price falls back under ${money(openingRangeHigh)}.`,
        stop,
        target,
        riskReward,
        ["Opening range break", "Intraday EMA trend", "Momentum improving", "Volume acceptable"],
        "If price closes below the stop on a 5-minute candle, the day-trade setup fails."
      ),
      enabled: true,
      riskPercentUsed: Math.min(riskPercent, 0.5),
      shares,
      openingRangeHigh: round(openingRangeHigh),
      openingRangeLow: round(openingRangeLow),
      entryArea: round(entry),
    };
  }

  if (entryWatch) {
    return {
      ...decision(
        "Day trade",
        "ENTRY WATCH",
        "5-minute momentum is improving near the opening range breakout level, but confirmation is not complete.",
        `Wait for a 5-minute candle close above ${money(entry)} with volume at least 80% of the 20-candle average.`,
        stop,
        target,
        riskReward,
        ["Near opening range break", "Momentum improving"],
        "Skip if volume fades or the next candle closes below EMA20."
      ),
      enabled: true,
      riskPercentUsed: Math.min(riskPercent, 0.5),
      shares,
      openingRangeHigh: round(openingRangeHigh),
      openingRangeLow: round(openingRangeLow),
      entryArea: round(entry),
    };
  }

  return {
    ...decision(
      "Day trade",
      "WAIT",
      "The 5-minute chart has no clean opening range breakout or risk setup right now.",
      `Wait for a 5-minute candle close above ${money(entry)} with improving MACD/RSI and acceptable volume.`,
      stop,
      target,
      riskReward,
      [],
      "Do not force a same-day trade when the opening range and momentum do not agree."
    ),
    enabled: true,
    riskPercentUsed: Math.min(riskPercent, 0.5),
    shares,
    openingRangeHigh: round(openingRangeHigh),
    openingRangeLow: round(openingRangeLow),
    entryArea: round(entry),
  };
}

function ruleCard(name, status, why, rule) {
  return { name, status, why, rule };
}

function buildTraderSetups(row, prev, levels, facts, trend) {
  const smaAdxEntry = prev.SMA20 <= prev.SMA50 && row.SMA20 > row.SMA50 && row.ADX >= 25;
  const smaAdxWatch = row.SMA20 > row.SMA50 && row.ADX >= 20;

  const bbRsiEntry = row.RSI < 35 && row.Close <= row.BBLower * 1.01 && row.Close > row.Open;
  const bbRsiWatch = row.RSI < 40 && row.Close <= row.BBLower * 1.02;

  const macdTrendEntry = row.MACD > 0 && row.MACD > row.MACDSignal && row.Close > row.EMA20;
  const macdTrendWatch = row.MACD > row.MACDSignal && row.Close > row.EMA20;

  const emaPullbackEntry = trend === "Bullish" && facts.pullbackArea && facts.macdImproving && facts.volumeOkay && row.Close > prev.High;
  const emaPullbackWatch = trend === "Bullish" && facts.pullbackArea && facts.macdImproving;

  const breakoutEntry = row.Close > levels.swingHigh20 && row.Volume >= row.VolumeSMA20 * 1.2 && row.ADX >= 20;
  const breakoutWatch = row.Close >= levels.swingHigh20 * 0.99 && row.ADX >= 18;

  return [
    {
      name: "ADX + SMA Cross",
      state: smaAdxEntry ? "ACTIVE" : smaAdxWatch ? "WATCH" : "OFF",
      why: smaAdxEntry
        ? "SMA20 crossed above SMA50 with ADX strength confirmation."
        : smaAdxWatch
          ? "Trend is positive, waiting for a cleaner crossover impulse."
          : "No bullish crossover strength yet.",
      rule: "Inspired by AdxSmas/FAdxSma patterns: moving-average crossover plus ADX filter.",
    },
    {
      name: "Bollinger RSI Bounce",
      state: bbRsiEntry ? "ACTIVE" : bbRsiWatch ? "WATCH" : "OFF",
      why: bbRsiEntry
        ? "Price is at lower Bollinger area with oversold RSI and bullish close."
        : bbRsiWatch
          ? "Near lower band with weak RSI; waiting for stronger recovery candle."
          : "No oversold bounce setup currently.",
      rule: "Inspired by BbandRsi/Bandtastic style mean-reversion entries.",
    },
    {
      name: "MACD Trend Continuation",
      state: macdTrendEntry ? "ACTIVE" : macdTrendWatch ? "WATCH" : "OFF",
      why: macdTrendEntry
        ? "MACD is positive and above signal while price holds above EMA20."
        : macdTrendWatch
          ? "MACD improved but full trend alignment is not complete."
          : "MACD trend continuation not active.",
      rule: "Inspired by MACD momentum entries used in multiple open-source strategies.",
    },
    {
      name: "EMA Pullback Continuation",
      state: emaPullbackEntry ? "ACTIVE" : emaPullbackWatch ? "WATCH" : "OFF",
      why: emaPullbackEntry
        ? "Bull trend pullback is confirmed by momentum and breakout close."
        : emaPullbackWatch
          ? "Bull trend pullback is forming; waiting for breakout candle close."
          : "No valid pullback continuation structure right now.",
      rule: "Inspired by trend pullback patterns similar to TrendRider-style EMA setups.",
    },
    {
      name: "20-Day Breakout + Volume",
      state: breakoutEntry ? "ACTIVE" : breakoutWatch ? "WATCH" : "OFF",
      why: breakoutEntry
        ? "Price broke 20-day high with volume and ADX confirmation."
        : breakoutWatch
          ? "Price is close to 20-day breakout level but confirmation is incomplete."
          : "No breakout pressure currently.",
      rule: "Inspired by breakout + volume confirmation patterns seen across open-source systems.",
    },
  ];
}

function swingDecision(row, prev, levels, risk, trend, facts) {
  const stop = risk.suggestedStop;
  const target = risk.target;
  const trigger = Math.max(row.High, prev.High);
  const exitTrigger = facts.closeBelowEma50 || facts.structureStopHit || facts.atrStopHit || facts.macdCrossDown;
  const exitWatch =
    facts.nearResistance ||
    facts.williamsTakeProfit ||
    facts.macdWeakensTwoCandles ||
    facts.closeBelowEma20 ||
    facts.dmiSellers;
  const entryConfirmed =
    row.Close > prev.High &&
    facts.closeAboveEma20 &&
    facts.closeAboveSma20 &&
    (facts.macdImproving || facts.macdCrossUp) &&
    (facts.williamsRecovery || row.WilliamsR > -80) &&
    risk.riskReward >= 2;
  const entryWatch =
    facts.priceAboveEma200 &&
    facts.ema50AboveEma200 &&
    facts.pullbackArea &&
    row.WilliamsR >= -80 &&
    row.WilliamsR <= -50 &&
    row.WilliamsR > prev.WilliamsR &&
    facts.macdImproving &&
    facts.dmiPositive &&
    facts.adxTrend &&
    facts.volumeOkay &&
    risk.riskReward >= 1.5;

  if (exitTrigger) {
    return decision("Swing trade", "EXIT TRIGGER", "Daily exit rule triggered by EMA50, stop, ATR stop, or MACD bearish cross.", `Do not enter; reconsider only if daily candle closes above ${money(trigger)}.`, stop, target, risk.riskReward, ["Close below EMA50/stop/ATR stop or MACD bearish cross."], "If already holding, the rule says the setup failed.");
  }
  if (exitWatch) {
    return decision("Swing trade", "EXIT WATCH", "Price is near resistance or momentum is cooling.", `Do not enter; wait for a new close above ${money(trigger)} with normal or strong volume.`, stop, target, risk.riskReward, ["Resistance, Williams %R cooling, MACD weakening, EMA20 warning, or sellers gaining."], "If price closes below EMA50, this becomes an exit trigger.");
  }
  if (entryConfirmed) {
    return decision("Swing trade", "ENTRY CONFIRMED", "Daily candle closed above previous high, above EMA20/SMA20, with momentum confirmation.", `Latest daily candle closed above ${money(prev.High)} and above EMA20/SMA20.`, stop, target, risk.riskReward, ["Candle confirmation", "MACD improving", "Risk/reward >= 2:1"], "If price closes below the stop area, the trade setup fails.");
  }
  if (entryWatch) {
    return decision("Swing trade", "ENTRY WATCH", "Bullish trend is intact and pullback/momentum rules are lining up.", `Enter only if daily candle closes above ${money(trigger)} with volume at least normal.`, stop, target, risk.riskReward, ["Bullish trend", "Pullback area", "Williams %R improving", "MACD improving", "ADX tradable"], "If volume is weak or Williams %R turns down, do not confirm entry.");
  }
  return decision("Swing trade", "WAIT", "The full swing entry rule is not confirmed.", `Wait for daily candle close above ${money(trigger)} plus MACD improvement and risk/reward >= 2:1.`, stop, target, risk.riskReward, [], "Do not buy just because price is moving; rules need confirmation.");
}

function positionDecision(row, prev, levels, risk, trend, facts) {
  const trigger = levels.swingHigh50;
  const stop = Math.min(levels.swingLow50, row.EMA50 || levels.swingLow50);
  const riskPerShare = Math.max(row.Close - stop, 0.01);
  const target = row.Close + riskPerShare * 3;
  const riskReward = (target - row.Close) / riskPerShare;
  const exitTrigger = facts.closeBelowSma200 || row.EMA50 < row.EMA200 || row.Close < levels.swingLow50;
  const exitWatch = facts.nearResistance || facts.macdWeakening || facts.williamsTakeProfit || facts.closeBelowEma50;
  const entryConfirmed = row.Close > trigger && facts.priceAboveSma200 && facts.bullishVolume && riskReward >= 3;
  const entryWatch = facts.priceAboveSma200 && facts.ema50AboveEma200 && facts.positionPullbackArea && facts.macdImproving && facts.adxTrend && facts.dmiPositive && riskReward >= 3;

  if (exitTrigger) return decision("Position trade", "EXIT TRIGGER", "Position exit rule triggered: below SMA200, EMA50 under EMA200, or major support broke.", `Do not enter until price reclaims SMA200 and closes above ${money(trigger)}.`, stop, target, riskReward, ["SMA200 / EMA trend / support failure."], "Long-term setup is weak below SMA200.");
  if (exitWatch) return decision("Position trade", "EXIT WATCH", "Longer-term momentum is weakening or price is near resistance.", `Wait for daily or weekly close above ${money(trigger)} before adding.`, stop, target, riskReward, ["Resistance, MACD weakening, Williams %R cooling, or EMA50 warning."], "If price closes below SMA200, exit trigger fires.");
  if (entryConfirmed) return decision("Position trade", "ENTRY CONFIRMED", "Price closed above the swing high, remains above SMA200, and volume confirms.", `Daily candle closed above previous swing high ${money(trigger)} while above SMA200.`, stop, target, riskReward, ["Swing high break", "Above SMA200", "Volume confirms"], "If price closes below SMA200, position trade fails.");
  if (entryWatch) return decision("Position trade", "ENTRY WATCH", "Longer trend is bullish and price is pulling back near SMA50/EMA50.", `Enter only after daily or weekly candle closes above ${money(trigger)}.`, stop, target, riskReward, ["Above SMA200", "EMA50 > EMA200", "MACD improving", "ADX tradable"], "If risk/reward falls below 3:1, skip the position trade.");
  return decision("Position trade", "WAIT", "Position rules are not aligned yet.", `Wait for price above SMA200 and close above ${money(trigger)} with volume confirmation.`, stop, target, riskReward, [], "Do not use a position trade while long-term trend is weak.");
}

function decision(mode, now, why, enterOnlyIf, stopArea, targetArea, riskReward, passed, warning) {
  return {
    mode,
    now,
    why,
    enterOnlyIf,
    stopArea: round(stopArea),
    targetArea: round(targetArea),
    riskReward: round(riskReward, 2),
    passed,
    failed: [],
    warning,
  };
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

function buildSwingProjection(rows, index) {
  const lookback = rows.slice(Math.max(0, index - 180), index + 1);
  const current = lookback[lookback.length - 1];
  if (lookback.length < 20 || !current) {
    return {
      direction: "Neutral",
      durationDays: 0,
      expectedDays: 5,
      remainingDays: 0,
      averageBullMovePct: 0,
      averageBearMovePct: 0,
      projectedPrice: round(current?.Close),
      weeklyHigh: null,
      weeklyLow: null,
      summary: "Not enough history for swing projection.",
    };
  }

  const swings = [];
  let direction = lookback[1].Close >= lookback[0].Close ? "Bullish" : "Bearish";
  let startIndex = 0;
  for (let i = 2; i < lookback.length; i += 1) {
    const nextDirection = lookback[i].Close >= lookback[i - 1].Close ? "Bullish" : "Bearish";
    if (nextDirection !== direction) {
      swings.push(makeSwing(lookback, startIndex, i - 1, direction));
      startIndex = i - 1;
      direction = nextDirection;
    }
  }
  swings.push(makeSwing(lookback, startIndex, lookback.length - 1, direction));

  const completed = swings.slice(0, -1).filter((swing) => swing.duration >= 2);
  const bullish = completed.filter((swing) => swing.direction === "Bullish");
  const bearish = completed.filter((swing) => swing.direction === "Bearish");
  const currentSwing = swings[swings.length - 1];
  const sameDirection = currentSwing.direction === "Bullish" ? bullish : bearish;
  const oppositeDirection = currentSwing.direction === "Bullish" ? bearish : bullish;
  const expectedDays = Math.max(3, Math.round(avg(sameDirection.map((swing) => swing.duration)) || 5));
  const averageBullMovePct = avg(bullish.map((swing) => swing.movePct));
  const averageBearMovePct = avg(bearish.map((swing) => swing.movePct));
  const measuredMovePct = currentSwing.direction === "Bullish"
    ? (averageBullMovePct || 0.03)
    : (averageBearMovePct || -0.03);
  const weeklyRows = lookback.slice(-5);
  const weeklyHigh = max(weeklyRows.map((row) => row.High));
  const weeklyLow = min(weeklyRows.map((row) => row.Low));
  const rawProjection = current.Close * (1 + measuredMovePct);
  const projectedPrice = currentSwing.direction === "Bullish"
    ? Math.min(rawProjection, weeklyHigh)
    : Math.max(rawProjection, weeklyLow);
  const remainingDays = Math.max(0, expectedDays - currentSwing.duration);
  const reversalWatchDays = Math.max(3, Math.round(avg(oppositeDirection.map((swing) => swing.duration)) || 5));

  return {
    direction: currentSwing.direction,
    durationDays: currentSwing.duration,
    expectedDays,
    remainingDays,
    reversalWatchDays,
    averageBullMovePct: round(averageBullMovePct * 100, 2),
    averageBearMovePct: round(averageBearMovePct * 100, 2),
    projectedPrice: round(projectedPrice),
    measuredMovePct: round(measuredMovePct * 100, 2),
    weeklyHigh: round(weeklyHigh),
    weeklyLow: round(weeklyLow),
    summary: `${currentSwing.direction} swing day ${currentSwing.duration} of ~${expectedDays}; projected measured move ${money(projectedPrice)} inside weekly ${money(weeklyLow)}-${money(weeklyHigh)}.`,
  };
}

function makeSwing(rows, startIndex, endIndex, direction) {
  const start = rows[startIndex];
  const end = rows[endIndex];
  const duration = Math.max(1, endIndex - startIndex + 1);
  const movePct = start?.Close ? (end.Close - start.Close) / start.Close : 0;
  return {
    direction,
    startIndex,
    endIndex,
    duration,
    startPrice: start?.Close || 0,
    endPrice: end?.Close || 0,
    movePct,
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

function strategyPlans(row, prev, levels, risk, accountSize, riskPercent, signal, trend, facts, ruleEngine) {
  const dayRiskDollars = accountSize * (Math.min(riskPercent, 0.5) / 100);
  const swingRiskDollars = accountSize * (Math.min(riskPercent, 1) / 100);
  const positionRiskDollars = accountSize * (Math.min(riskPercent, 1) / 100);
  const nextHigh = Math.max(row.High, prev.High);
  const dayEntry = nextHigh;
  const dayStop = Math.min(row.Low, row.Close - row.ATR * 0.6);
  const dayRisk = Math.max(dayEntry - dayStop, 0.01);
  const swingDecisionPlan = ruleEngine?.swing;
  const positionDecisionPlan = ruleEngine?.position;
  const swingEntry = signal === "ENTRY CONFIRMED" ? row.Close : nextHigh;
  const swingStop = swingDecisionPlan?.stopArea ?? risk.suggestedStop;
  const swingRisk = Math.max(swingEntry - swingStop, 0.01);
  const positionEntry = row.Close;
  const positionStop = positionDecisionPlan?.stopArea ?? Math.min(levels.swingLow50, row.EMA50 || levels.swingLow50);
  const positionRisk = Math.max(positionEntry - positionStop, 0.01);

  return [
    makeStrategyPlan({
      label: "Day trade",
      horizon: ruleEngine.day.enabled ? "Same session, 5-minute candles" : "Unavailable until intraday data exists",
      now: ruleEngine.day.now,
      enabled: ruleEngine.day.enabled,
      why: ruleEngine.day.why,
      entryCondition: ruleEngine.day.enterOnlyIf,
      entry: ruleEngine.day.entryArea ?? dayEntry,
      stop: ruleEngine.day.stopArea ?? dayStop,
      target: ruleEngine.day.targetArea ?? dayEntry + dayRisk * 1.5,
      accountSize,
      maxRiskDollars: dayRiskDollars,
      warning: ruleEngine.day.warning,
    }),
    makeStrategyPlan({
      label: "Swing trade",
      horizon: "Several days to weeks",
      now: swingDecisionPlan.now,
      why: swingDecisionPlan.why,
      entryCondition: swingDecisionPlan.enterOnlyIf,
      entry: swingEntry,
      stop: swingStop,
      target: Math.max(swingDecisionPlan.targetArea ?? risk.target, swingEntry + swingRisk * 2),
      accountSize,
      maxRiskDollars: swingRiskDollars,
      warning: swingDecisionPlan.warning,
    }),
    makeStrategyPlan({
      label: "Position trade",
      horizon: "Weeks to months",
      now: positionDecisionPlan.now,
      why: positionDecisionPlan.why,
      entryCondition: positionDecisionPlan.enterOnlyIf,
      entry: positionEntry,
      stop: positionStop,
      target: Math.max(positionDecisionPlan.targetArea ?? 0, positionEntry + positionRisk * 3),
      accountSize,
      maxRiskDollars: positionRiskDollars,
      warning: positionDecisionPlan.warning,
    }),
  ];
}

function makeStrategyPlan({ label, horizon, now, enabled = true, why, entryCondition, entry, stop, target, accountSize, maxRiskDollars, warning }) {
  const cleanEntry = Number.isFinite(entry) ? entry : 0;
  const cleanStop = Number.isFinite(stop) && stop < cleanEntry ? stop : cleanEntry * 0.97;
  const riskPerShare = Math.max(cleanEntry - cleanStop, 0.01);
  const cleanTarget = Number.isFinite(target) && target > cleanEntry ? target : cleanEntry + riskPerShare * 2;
  const rewardPerShare = Math.max(cleanTarget - cleanEntry, 0);
  const riskShares = Math.floor(maxRiskDollars / riskPerShare);
  const accountShares = cleanEntry > 0 ? Math.floor(accountSize / cleanEntry) : 0;
  const shares = Math.max(0, Math.min(riskShares, accountShares));
  const spend = shares * cleanEntry;
  const maxLoss = shares * riskPerShare;
  const potentialProfit = shares * rewardPerShare;

  return {
    label,
    horizon,
    now,
    enabled,
    why,
    entryCondition,
    entry: round(cleanEntry),
    stop: round(cleanStop),
    target: round(cleanTarget),
    shares,
    spend: round(spend, 2),
    maxLoss: round(maxLoss, 2),
    potentialProfit: round(potentialProfit, 2),
    riskPerShare: round(riskPerShare, 2),
    rewardPerShare: round(rewardPerShare, 2),
    targetReturnPct: round((rewardPerShare / cleanEntry) * 100, 2),
    riskReward: round(rewardPerShare / riskPerShare, 2),
    calculation: `${money(maxRiskDollars)} account risk / ${money(riskPerShare)} risk per share = ${shares} shares`,
    warning,
  };
}

function buildAction(row, prev, signal, trend, facts, risk, modeDecision) {
  const trigger = round(prev.High);
  const stop = round(risk.suggestedStop);
  const target = round(risk.target);
  const riskReward = round(risk.riskReward, 2);
  const ema20 = round(row.EMA20);

  if (modeDecision) {
    return {
      now: modeDecision.now,
      why: modeDecision.why,
      enterOnlyIf: modeDecision.enterOnlyIf,
      stopArea: modeDecision.stopArea,
      targetArea: modeDecision.targetArea,
      riskReward: modeDecision.riskReward,
      whatCanGoWrong: modeDecision.warning,
      trend,
    };
  }

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
        const exitReason = exitByTarget ? "Target" : exitByStop ? "Stop" : heldTooLong ? "Time" : "Rule";
        trades.push({
          entryDate: position.entryDate,
          exitDate: snapshot.date,
          entry: round(position.entry),
          exit: round(exit),
          returnPct: round(returnPct, 2),
          holdDays: Math.round(daysBetween(position.entryDate, snapshot.date)),
          exitReason,
        });
        position = null;
      }
    }
  }

  const wins = trades.filter((trade) => trade.returnPct > 0);
  const losses = trades.filter((trade) => trade.returnPct <= 0);
  const totalReturn = trades.reduce((sum, trade) => sum + trade.returnPct, 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.returnPct, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.returnPct, 0));
  const targetHits = trades.filter((trade) => trade.exitReason === "Target");
  const lastSignals = signals.slice(-10);
  const latestSignal = lastSignals[lastSignals.length - 1] || null;
  const previousSignal = lastSignals[lastSignals.length - 2] || null;
  const changed = latestSignal && previousSignal && latestSignal.signal !== previousSignal.signal;

  let alert = {
    level: "info",
    message: "No major recent signal transition in backtest history.",
    latestSignal: latestSignal?.signal || null,
    previousSignal: previousSignal?.signal || null,
    changed: Boolean(changed),
  };

  if (changed) {
    if (latestSignal.signal === "ENTRY CONFIRMED") {
      alert = {
        level: "success",
        message: `Backtest transition: ${previousSignal.signal} -> ENTRY CONFIRMED on ${latestSignal.date}.`,
        latestSignal: latestSignal.signal,
        previousSignal: previousSignal.signal,
        changed: true,
      };
    } else if (latestSignal.signal === "EXIT TRIGGER") {
      alert = {
        level: "danger",
        message: `Backtest transition: ${previousSignal.signal} -> EXIT TRIGGER on ${latestSignal.date}.`,
        latestSignal: latestSignal.signal,
        previousSignal: previousSignal.signal,
        changed: true,
      };
    } else {
      alert = {
        level: "warning",
        message: `Backtest transition: ${previousSignal.signal} -> ${latestSignal.signal} on ${latestSignal.date}.`,
        latestSignal: latestSignal.signal,
        previousSignal: previousSignal.signal,
        changed: true,
      };
    }
  }

  return {
    trades: trades.length,
    winRate: trades.length ? round((wins.length / trades.length) * 100, 1) : 0,
    averageWin: round(avg(wins.map((trade) => trade.returnPct)), 2),
    averageLoss: round(avg(losses.map((trade) => trade.returnPct)), 2),
    averageTrade: round(avg(trades.map((trade) => trade.returnPct)), 2),
    averageHoldDays: round(avg(trades.map((trade) => trade.holdDays)), 1),
    expectancy: round((wins.length / Math.max(trades.length, 1)) * avg(wins.map((trade) => trade.returnPct)) + (losses.length / Math.max(trades.length, 1)) * avg(losses.map((trade) => trade.returnPct)), 2),
    profitFactor: grossLoss ? round(grossProfit / grossLoss, 2) : grossProfit ? 99 : 0,
    targetHitRate: trades.length ? round((targetHits.length / trades.length) * 100, 1) : 0,
    totalReturn: round(totalReturn, 2),
    maxDrawdown: round(maxDrawdown(rows.map((row) => row.Close)), 2),
    bestTrade: trades.length ? max(trades.map((trade) => trade.returnPct)) : 0,
    worstTrade: trades.length ? min(trades.map((trade) => trade.returnPct)) : 0,
    lastSignals,
    alert,
  };
}

function formatYahooTimestamp(timestamp, timezone, includeTime) {
  const date = new Date(timestamp * 1000);
  if (!includeTime) return date.toISOString().slice(0, 10);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date);
    const value = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${value("month")}/${value("day")} ${value("hour")}:${value("minute")} ${value("dayPeriod")}`.trim();
  } catch {
    return date.toISOString();
  }
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

function numberText(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, "") : "-";
}

function capitalizeSentence(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function round(value, digits = 2) {
  return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
