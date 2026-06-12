/**
 * Export utilities for CSV, JSON, and summary reports
 */

/**
 * Export analysis results as CSV
 */
export function exportAnalysisAsCSV(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  // Header
  const headers = [
    "Ticker",
    "Date",
    "Price",
    "Signal",
    "Score",
    "Trend",
    "RSI",
    "Williams%R",
    "MACD Status",
    "ADX",
    "+DI",
    "-DI",
    "Support",
    "Resistance",
    "Stop",
    "Target",
    "Risk/Reward",
    "Shares",
    "Max Risk $",
  ];

  const rows = results
    .filter((r) => r.ok)
    .map((r) => [
      r.ticker,
      r.date,
      r.price.toFixed(2),
      r.signal,
      r.score,
      r.trend,
      r.rsi.toFixed(1),
      r.williamsR.toFixed(1),
      r.macdStatus,
      r.adx.toFixed(1),
      r.plusDI.toFixed(1),
      r.minusDI.toFixed(1),
      r.support.toFixed(2),
      r.resistance.toFixed(2),
      r.stop.toFixed(2),
      r.target.toFixed(2),
      r.riskReward.toFixed(2),
      r.shares,
      r.maxRiskDollars.toFixed(2),
    ]);

  const csv = [headers, ...rows].map((row) =>
    row.map((cell) => {
      // Escape quotes and wrap in quotes if contains comma/quotes/newlines
      const str = String(cell);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  ).join("\n");

  return csv;
}

/**
 * Export trade history as CSV
 */
export function exportTradesAsCSV(trades) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return "";
  }

  const headers = [
    "Ticker",
    "Entry Date",
    "Entry Price",
    "Entry Signal",
    "Exit Date",
    "Exit Price",
    "Exit Signal",
    "Shares",
    "P&L ($)",
    "Return (%)",
    "Days Held",
    "Status",
  ];

  const rows = trades.map((t) => {
    const metrics = t.getMetrics();
    return [
      t.ticker,
      t.entryDate,
      t.entryPrice.toFixed(2),
      t.entrySignal,
      t.exitDate || "",
      t.exitPrice ? t.exitPrice.toFixed(2) : "",
      t.exitSignal || "",
      t.shares,
      metrics.realizedPnL ? metrics.realizedPnL.toFixed(2) : "",
      metrics.returnPct ? metrics.returnPct.toFixed(2) : "",
      metrics.daysHeld || "",
      t.status,
    ];
  });

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    )
    .join("\n");

  return csv;
}

/**
 * Generate text-based summary report
 */
export function generateSummaryReport(data, portfolio = null) {
  const timestamp = new Date().toISOString();
  let report = `STOCK TRADING ANALYSIS REPORT\n`;
  report += `Generated: ${timestamp}\n`;
  report += `${"=".repeat(60)}\n\n`;

  // Analysis Summary
  if (Array.isArray(data.results)) {
    const goodResults = data.results.filter((r) => r.ok);
    const badResults = data.results.filter((r) => !r.ok);

    report += `ANALYSIS RESULTS\n`;
    report += `${"-".repeat(60)}\n`;
    report += `Total tickers: ${data.results.length}\n`;
    report += `Successful: ${goodResults.length}\n`;
    report += `Failed: ${badResults.length}\n\n`;

    // Signal distribution
    const signalCount = {};
    for (const r of goodResults) {
      signalCount[r.signal] = (signalCount[r.signal] || 0) + 1;
    }

    report += `SIGNAL DISTRIBUTION\n`;
    report += `${"-".repeat(60)}\n`;
    for (const [signal, count] of Object.entries(signalCount)) {
      const pct = ((count / goodResults.length) * 100).toFixed(1);
      report += `${signal}: ${count} (${pct}%)\n`;
    }
    report += "\n";

    // Top opportunities
    const topByScore = [...goodResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    report += `TOP OPPORTUNITIES (BY SCORE)\n`;
    report += `${"-".repeat(60)}\n`;
    for (const r of topByScore) {
      report += `${r.ticker}: ${r.signal} | Score ${r.score}/100 | ${r.price.toFixed(2)} | R/R ${r.riskReward.toFixed(2)}:1\n`;
    }
    report += "\n";

    // Best risk/reward
    const topByRiskReward = [...goodResults]
      .sort((a, b) => b.riskReward - a.riskReward)
      .slice(0, 5);

    report += `BEST RISK/REWARD\n`;
    report += `${"-".repeat(60)}\n`;
    for (const r of topByRiskReward) {
      report += `${r.ticker}: R/R ${r.riskReward.toFixed(2)}:1 | Target ${r.target.toFixed(2)} | Stop ${r.stop.toFixed(2)}\n`;
    }
    report += "\n";

    // Entries
    const entryConfirmed = goodResults.filter((r) => r.signal === "ENTRY CONFIRMED");
    const entryWatch = goodResults.filter((r) => r.signal === "ENTRY WATCH");

    report += `ENTRY SIGNALS\n`;
    report += `${"-".repeat(60)}\n`;
    report += `Entry Confirmed: ${entryConfirmed.length}\n`;
    for (const r of entryConfirmed.slice(0, 3)) {
      report += `  - ${r.ticker} at ${r.price.toFixed(2)} | Shares: ${r.shares}\n`;
    }
    report += `Entry Watch: ${entryWatch.length}\n`;
    report += "\n";
  }

  // Portfolio Statistics
  if (portfolio) {
    const metrics = portfolio.getMetrics();
    report += `PORTFOLIO STATISTICS\n`;
    report += `${"-".repeat(60)}\n`;
    report += `Total trades: ${metrics.totalTrades}\n`;
    report += `Closed trades: ${metrics.closedTrades}\n`;
    report += `Open trades: ${metrics.openTrades}\n`;
    report += `Win rate: ${metrics.winRate.toFixed(1)}%\n`;
    report += `Avg return: ${metrics.avgReturn.toFixed(2)}%\n`;
    report += `Total P&L: $${metrics.totalPnL.toFixed(2)}\n`;
    report += `Profit factor: ${metrics.profitFactor.toFixed(2)}\n`;

    if (metrics.bestTrade) {
      report += `Best trade: ${metrics.bestTrade.realizedPnL.toFixed(2)} (${metrics.bestTrade.returnPct.toFixed(2)}%)\n`;
    }
    if (metrics.worstTrade) {
      report += `Worst trade: ${metrics.worstTrade.realizedPnL.toFixed(2)} (${metrics.worstTrade.returnPct.toFixed(2)}%)\n`;
    }
    report += "\n";

    // Signal performance
    const signalPerf = portfolio.getTradesBySignal();
    report += `SIGNAL PERFORMANCE\n`;
    report += `${"-".repeat(60)}\n`;
    for (const [signal, perf] of Object.entries(signalPerf)) {
      report += `${signal}:\n`;
      report += `  Trades: ${perf.trades} | Win rate: ${perf.winRate.toFixed(1)}% | Avg return: ${perf.avgReturn.toFixed(2)}%\n`;
    }
    report += "\n";
  }

  report += `${"=".repeat(60)}\n`;
  report += `Disclaimer: This is analysis only. Not financial advice. No broker connection or automatic trading.\n`;

  return report;
}

/**
 * Download helper - creates data URL for download
 */
export function createDownloadUrl(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return { url, filename };
}

/**
 * Trigger browser download
 */
export function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
