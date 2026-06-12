/**
 * Validation, error handling, and data quality checks
 */

export class AnalysisError extends Error {
  constructor(message, code, severity = "warning") {
    super(message);
    this.code = code;
    this.severity = severity; // warning | error | critical
  }
}

export function validateCandles(candles) {
  const errors = [];

  if (!Array.isArray(candles) || candles.length === 0) {
    errors.push(
      new AnalysisError(
        "No candle data provided",
        "EMPTY_DATA",
        "critical"
      )
    );
    return errors;
  }

  if (candles.length < 220) {
    errors.push(
      new AnalysisError(
        `Only ${candles.length} candles available; 220+ required for EMA200`,
        "INSUFFICIENT_DATA",
        "critical"
      )
    );
  }

  // Check for data gaps
  const dates = candles.map((c) => new Date(c.Date).getTime());
  let lastDate = dates[0];
  let gapCount = 0;

  for (let i = 1; i < dates.length; i++) {
    const daysDiff = (dates[i] - lastDate) / (1000 * 60 * 60 * 24);
    if (Math.abs(daysDiff - 1) > 0.5) {
      gapCount++;
    }
    lastDate = dates[i];
  }

  if (gapCount > candles.length * 0.1) {
    errors.push(
      new AnalysisError(
        `${gapCount} data gaps detected; ${(gapCount / candles.length * 100).toFixed(1)}% missing`,
        "DATA_GAPS",
        "warning"
      )
    );
  }

  // Check for suspicious prices
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const { Open, High, Low, Close } = c;

    if (![Open, High, Low, Close].every((p) => Number.isFinite(p))) {
      errors.push(
        new AnalysisError(
          `Invalid prices on ${c.Date}: O=${Open} H=${High} L=${Low} C=${Close}`,
          "INVALID_PRICE",
          "warning"
        )
      );
      continue;
    }

    if (High < Math.max(Open, Close) || Low > Math.min(Open, Close)) {
      errors.push(
        new AnalysisError(
          `Price logic error on ${c.Date}: H=${High} < max(O,C) or L=${Low} > min(O,C)`,
          "PRICE_LOGIC_ERROR",
          "warning"
        )
      );
    }

    // Detect extreme spikes (>20% move)
    if (i > 0) {
      const prevClose = candles[i - 1].Close;
      const movePercent = Math.abs((Close - prevClose) / prevClose) * 100;
      if (movePercent > 20) {
        errors.push(
          new AnalysisError(
            `Extreme move on ${c.Date}: ${movePercent.toFixed(1)}% (potential gap/split/error)`,
            "EXTREME_MOVE",
            "warning"
          )
        );
      }
    }
  }

  return errors;
}

export function validateAnalysisResult(result) {
  const errors = [];

  if (!result || typeof result !== "object") {
    errors.push(
      new AnalysisError("Analysis result is empty", "NO_RESULT", "critical")
    );
    return errors;
  }

  // Check required fields
  const requiredFields = [
    "price",
    "signal",
    "score",
    "rsi",
    "williamsR",
    "adx",
    "stop",
    "target",
  ];
  for (const field of requiredFields) {
    if (result[field] === undefined || result[field] === null) {
      errors.push(
        new AnalysisError(
          `Missing required field: ${field}`,
          "MISSING_FIELD",
          "warning"
        )
      );
    }
  }

  // Validate signal
  const validSignals = [
    "ENTRY CONFIRMED",
    "ENTRY WATCH",
    "WAIT",
    "EXIT WATCH",
    "EXIT TRIGGER",
    "AVOID",
  ];
  if (!validSignals.includes(result.signal)) {
    errors.push(
      new AnalysisError(
        `Invalid signal: ${result.signal}`,
        "INVALID_SIGNAL",
        "warning"
      )
    );
  }

  // Validate score range
  if (result.score < 0 || result.score > 100) {
    errors.push(
      new AnalysisError(
        `Score out of range: ${result.score}`,
        "INVALID_SCORE",
        "warning"
      )
    );
  }

  // Check if stop > target (impossible)
  if (result.stop && result.target && result.stop >= result.target) {
    errors.push(
      new AnalysisError(
        `Stop (${result.stop}) is above or equal to target (${result.target})`,
        "INVALID_RISK_REWARD",
        "warning"
      )
    );
  }

  // Warn if risk/reward is unrealistic
  if (result.riskReward > 10) {
    errors.push(
      new AnalysisError(
        `Risk/reward unusually high: ${result.riskReward}:1 (potential data error)`,
        "EXTREME_RISK_REWARD",
        "warning"
      )
    );
  }

  return errors;
}

export function formatErrorReport(errors) {
  if (errors.length === 0) {
    return { ok: true, errors: [] };
  }

  const critical = errors.filter((e) => e.severity === "critical");
  const warnings = errors.filter((e) => e.severity === "warning");

  return {
    ok: critical.length === 0,
    critical: critical.map((e) => ({ code: e.code, message: e.message })),
    warnings: warnings.map((e) => ({ code: e.code, message: e.message })),
    total: errors.length,
  };
}

/**
 * Backtest quality check
 * Ensures backtest results are statistically valid
 */
export function validateBacktestResults(backtest) {
  const issues = [];

  if (!backtest || backtest.trades.length === 0) {
    issues.push("No trades generated in backtest");
    return issues;
  }

  if (backtest.trades.length < 5) {
    issues.push(
      `Only ${backtest.trades.length} trades; consider longer period for statistical significance`
    );
  }

  const winRate = backtest.winRate || 0;
  if (winRate < 30) {
    issues.push(
      `Low win rate: ${winRate.toFixed(1)}%; strategy may be unreliable`
    );
  }

  if (backtest.maxDrawdown && backtest.maxDrawdown > 50) {
    issues.push(
      `High max drawdown: ${backtest.maxDrawdown.toFixed(1)}%; risky strategy`
    );
  }

  if (backtest.profitFactor && backtest.profitFactor < 1.5) {
    issues.push(
      `Low profit factor: ${backtest.profitFactor.toFixed(2)}; consider refinement`
    );
  }

  return issues;
}
