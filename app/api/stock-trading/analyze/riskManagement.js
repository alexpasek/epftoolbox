/**
 * Enhanced risk management calculations with slippage and realistic spreads
 */

/**
 * Calculate position size based on Kelly Criterion and account risk
 * Kelly Criterion: (bp - q) / b where:
 * - b = odds (risk/reward ratio)
 * - p = win probability
 * - q = loss probability (1 - p)
 */
export function calculatePositionSizeKelly(accountSize, riskPercent, winRate, avgWinReturn, avgLossReturn) {
  if (winRate <= 0 || avgWinReturn <= 0 || avgLossReturn >= 0) {
    return 0; // Invalid inputs
  }

  // Kelly Criterion
  const b = avgWinReturn / Math.abs(avgLossReturn);
  const p = winRate / 100;
  const q = 1 - p;
  const kellyPercent = (b * p - q) / b;

  // Conservative: use half Kelly to avoid overleverage
  const conservativeKelly = Math.max(0, Math.min(kellyPercent * 0.5, 0.25)); // Cap at 25%

  return (accountSize * conservativeKelly) / 100;
}

/**
 * Calculate shares with slippage and commission built in
 */
export function calculateShares(
  entryPrice,
  stopPrice,
  accountSize,
  riskPercent,
  slippagePercent = 0.1,
  commissionPercent = 0.05
) {
  if (!entryPrice || entryPrice <= 0 || !accountSize || accountSize <= 0) {
    return {
      shares: 0,
      entryPriceWithSlippage: entryPrice,
      actualRiskDollars: 0,
      riskPerShare: 0,
      commissionCost: 0,
    };
  }

  const riskDollars = (accountSize * riskPercent) / 100;
  const entryWithSlippage = entryPrice * (1 + slippagePercent / 100);
  const riskPerShare = Math.max(entryWithSlippage - stopPrice, 0.01);

  if (riskPerShare <= 0) {
    return {
      shares: 0,
      entryPriceWithSlippage: entryWithSlippage,
      actualRiskDollars: riskDollars,
      riskPerShare: 0,
      commissionCost: 0,
    };
  }

  let shares = Math.floor(riskDollars / riskPerShare);

  // Apply commission to entry cost
  const entryValue = shares * entryWithSlippage;
  const commissionCost = (entryValue * commissionPercent) / 100;

  // Adjust shares if commission is significant
  if (commissionCost > 0) {
    const availableForTrade = riskDollars - commissionCost;
    shares = Math.floor(availableForTrade / riskPerShare);
  }

  return {
    shares: Math.max(0, shares),
    entryPriceWithSlippage: Number(entryWithSlippage.toFixed(2)),
    actualRiskDollars: Number((shares * riskPerShare).toFixed(2)),
    riskPerShare: Number(riskPerShare.toFixed(2)),
    commissionCost: Number(commissionCost.toFixed(2)),
  };
}

/**
 * Calculate realistic exit prices with slippage
 */
export function calculateExitPrice(targetPrice, slippagePercent = 0.1) {
  return targetPrice * (1 - slippagePercent / 100);
}

/**
 * Scenario analysis: what if different stop levels?
 */
export function scenarioAnalysis(
  entryPrice,
  targetPrice,
  currentPrice,
  accountSize,
  riskPercent,
  scenarios = {
    tighter: 0.5, // 50% tighter stop
    normal: 1.0,
    wider: 1.5,
  }
) {
  const results = {};

  for (const [scenarioName, multiplier] of Object.entries(scenarios)) {
    // Calculate stop for this scenario
    const baseRisk = currentPrice - entryPrice; // Current unrealized move
    const adjustedStop = entryPrice - baseRisk * multiplier;

    const calc = calculateShares(entryPrice, adjustedStop, accountSize, riskPercent);

    const riskReward = calc.riskPerShare > 0
      ? (targetPrice - entryPrice) / calc.riskPerShare
      : 0;

    results[scenarioName] = {
      stop: Number(adjustedStop.toFixed(2)),
      shares: calc.shares,
      maxRisk: calc.actualRiskDollars,
      potentialProfit: calc.shares > 0 
        ? Number((calc.shares * (targetPrice - entryPrice)).toFixed(2))
        : 0,
      riskReward: Number(riskReward.toFixed(2)),
      recommendFull: riskReward >= 2.5,
    };
  }

  return results;
}

/**
 * Calculate optimal position size across multiple positions
 * Ensures total portfolio risk doesn't exceed max
 */
export function calculatePortfolioPositionSize(
  positions, // Array of {entryPrice, stopPrice, winRate, avgReturn}
  accountSize,
  maxPortfolioRisk = 2 // Max 2% portfolio risk
) {
  if (positions.length === 0) return [];

  const riskPerPosition = maxPortfolioRisk / positions.length;

  return positions.map((pos) => 
    calculateShares(pos.entryPrice, pos.stopPrice, accountSize, riskPerPosition)
  );
}

/**
 * Volatility-adjusted position sizing
 * More volatile = smaller position
 */
export function volatilityAdjustedPositionSize(
  atr, // Average True Range
  currentPrice,
  accountSize,
  baseRiskPercent = 1
) {
  if (!atr || atr <= 0 || !currentPrice || currentPrice <= 0) {
    return 0;
  }

  // ATR as percent of price
  const atrPercent = (atr / currentPrice) * 100;

  // Reduce position size if volatility is high
  // High volatility (ATR > 3% of price) → reduce by 50%
  const volatilityFactor = atrPercent > 3 ? 0.5 : 1.0;

  const adjustedRiskPercent = baseRiskPercent * volatilityFactor;

  return {
    adjustedRiskPercent: Number(adjustedRiskPercent.toFixed(2)),
    atrPercent: Number(atrPercent.toFixed(2)),
    message:
      atrPercent > 3
        ? "High volatility detected; reducing position size"
        : "Normal volatility",
  };
}
