/**
 * Portfolio tracking and performance analytics
 * Tracks entry/exit signals, P&L, and strategy performance
 */

export class Trade {
  constructor(ticker, entryPrice, entryDate, entrySignal, accountRisk) {
    this.ticker = ticker;
    this.entryPrice = entryPrice;
    this.entryDate = entryDate;
    this.entrySignal = entrySignal; // "ENTRY CONFIRMED" | "ENTRY WATCH"
    this.accountRisk = accountRisk;
    this.exitPrice = null;
    this.exitDate = null;
    this.exitSignal = null;
    this.shares = 0;
    this.status = "open"; // open | closed | stale
  }

  close(exitPrice, exitDate, exitSignal) {
    this.exitPrice = exitPrice;
    this.exitDate = exitDate;
    this.exitSignal = exitSignal;
    this.status = "closed";
  }

  markStale(staleDays = 30) {
    const daysOpen = (Date.now() - new Date(this.entryDate)) / (1000 * 60 * 60 * 24);
    if (daysOpen > staleDays && this.status === "open") {
      this.status = "stale";
      return true;
    }
    return false;
  }

  getMetrics() {
    if (this.status === "open") {
      return {
        status: "open",
        daysOpen: Math.round((Date.now() - new Date(this.entryDate)) / (1000 * 60 * 60 * 24)),
        unrealizedPnL: null,
        realizedPnL: null,
        returnPct: null,
        winLoss: null,
      };
    }

    const realizedPnL = (this.exitPrice - this.entryPrice) * this.shares;
    const returnPct = ((this.exitPrice - this.entryPrice) / this.entryPrice) * 100;
    const daysHeld = Math.round(
      (new Date(this.exitDate) - new Date(this.entryDate)) / (1000 * 60 * 60 * 24)
    );

    return {
      status: "closed",
      daysHeld,
      realizedPnL,
      returnPct,
      winLoss: realizedPnL > 0 ? "WIN" : "LOSS",
      riskMultiple: realizedPnL / this.accountRisk,
    };
  }
}

export class Portfolio {
  constructor() {
    this.trades = [];
    this.watchedTickers = new Set();
  }

  addTrade(trade) {
    this.trades.push(trade);
  }

  closeTrade(ticker, exitPrice, exitDate, exitSignal) {
    const trade = this.trades.find(
      (t) => t.ticker === ticker && t.status === "open"
    );
    if (trade) {
      trade.close(exitPrice, exitDate, exitSignal);
      return trade;
    }
    return null;
  }

  getMetrics() {
    const closedTrades = this.trades.filter((t) => t.status === "closed");
    const openTrades = this.trades.filter((t) => t.status === "open");
    const staleTrades = this.trades.filter((t) => t.status === "stale");

    if (closedTrades.length === 0) {
      return {
        totalTrades: this.trades.length,
        closedTrades: 0,
        openTrades: openTrades.length,
        staleTrades: staleTrades.length,
        winRate: 0,
        avgReturn: 0,
        totalPnL: 0,
        profitFactor: 0,
        bestTrade: null,
        worstTrade: null,
      };
    }

    const metrics = closedTrades.map((t) => t.getMetrics());
    const wins = metrics.filter((m) => m.winLoss === "WIN");
    const losses = metrics.filter((m) => m.winLoss === "LOSS");

    const totalPnL = metrics.reduce((sum, m) => sum + m.realizedPnL, 0);
    const avgReturn = metrics.reduce((sum, m) => sum + m.returnPct, 0) / metrics.length;

    const profitFromWins = wins.reduce((sum, m) => sum + m.realizedPnL, 0);
    const lossFromLosses = Math.abs(
      losses.reduce((sum, m) => sum + m.realizedPnL, 0)
    );
    const profitFactor = lossFromLosses > 0 ? profitFromWins / lossFromLosses : 0;

    const bestTrade = metrics.reduce((best, m) =>
      m.realizedPnL > (best?.realizedPnL || 0) ? m : best
    );
    const worstTrade = metrics.reduce((worst, m) =>
      m.realizedPnL < (worst?.realizedPnL || 0) ? m : worst
    );

    return {
      totalTrades: this.trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      staleTrades: staleTrades.length,
      winRate: (wins.length / closedTrades.length) * 100,
      avgReturn: Number(avgReturn.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      bestTrade,
      worstTrade,
      wins: wins.length,
      losses: losses.length,
      avgWinReturn:
        wins.length > 0
          ? Number((wins.reduce((sum, m) => sum + m.returnPct, 0) / wins.length).toFixed(2))
          : 0,
      avgLossReturn:
        losses.length > 0
          ? Number((losses.reduce((sum, m) => sum + m.returnPct, 0) / losses.length).toFixed(2))
          : 0,
    };
  }

  getTradesBySignal() {
    const bySignal = {};
    for (const trade of this.trades.filter((t) => t.status === "closed")) {
      const signal = trade.entrySignal;
      if (!bySignal[signal]) {
        bySignal[signal] = [];
      }
      bySignal[signal].push(trade);
    }

    const results = {};
    for (const [signal, trades] of Object.entries(bySignal)) {
      const metrics = trades.map((t) => t.getMetrics());
      const wins = metrics.filter((m) => m.winLoss === "WIN").length;
      results[signal] = {
        trades: trades.length,
        wins,
        winRate: (wins / trades.length) * 100,
        avgReturn: Number(
          (metrics.reduce((sum, m) => sum + m.returnPct, 0) / metrics.length).toFixed(2)
        ),
        totalPnL: Number(
          metrics.reduce((sum, m) => sum + m.realizedPnL, 0).toFixed(2)
        ),
      };
    }
    return results;
  }

  exportJSON() {
    return {
      exportDate: new Date().toISOString(),
      portfolio: {
        trades: this.trades.map((t) => ({
          ticker: t.ticker,
          entryPrice: t.entryPrice,
          entryDate: t.entryDate,
          entrySignal: t.entrySignal,
          exitPrice: t.exitPrice,
          exitDate: t.exitDate,
          exitSignal: t.exitSignal,
          status: t.status,
          metrics: t.getMetrics(),
        })),
        metrics: this.getMetrics(),
        signalPerformance: this.getTradesBySignal(),
      },
    };
  }
}
