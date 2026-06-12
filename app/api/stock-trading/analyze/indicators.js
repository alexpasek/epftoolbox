/**
 * Technical indicator calculations with validation and edge-case handling
 * All calculations follow standard trading definitions
 */

/**
 * Simple Moving Average with warmup protection
 */
export function sma(data, period) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result[i] = null; // Not enough data
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += Number(data[j]) || 0;
      }
      result[i] = sum / period;
    }
  }
  return result;
}

/**
 * Exponential Moving Average with SMA warmup
 * First period candles use SMA, then switch to EMA
 */
export function ema(data, period) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const result = new Array(data.length);
  const multiplier = 2 / (period + 1);
  
  // Warmup: find first SMA value
  let sum = 0;
  let warmupIndex = -1;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += Number(data[i]) || 0;
    if (i === period - 1) {
      result[i] = sum / period;
      warmupIndex = i;
    } else {
      result[i] = null;
    }
  }
  
  if (warmupIndex === -1) return result; // Not enough data
  
  // Apply EMA formula after warmup
  for (let i = warmupIndex + 1; i < data.length; i++) {
    result[i] = (Number(data[i]) || 0) * multiplier + result[i - 1] * (1 - multiplier);
  }
  return result;
}

/**
 * RSI (Relative Strength Index) with edge-case handling
 */
export function rsi(data, period = 14) {
  if (!Array.isArray(data) || data.length < period + 1) {
    return new Array(data?.length || 0).fill(null);
  }
  
  const result = new Array(data.length);
  const changes = new Array(data.length);
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = (Number(data[i]) || 0) - (Number(data[i - 1]) || 0);
    changes[i] = change;
  }
  
  // Warmup: initial average gain/loss
  let sumGain = 0;
  let sumLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = changes[i];
    if (change > 0) sumGain += change;
    else sumLoss += Math.abs(change);
  }
  
  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;
  
  // Store initial RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs);
  
  // Apply smoothing for remaining candles
  for (let i = period + 1; i < data.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs2);
  }
  
  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function macd(data, fast = 12, slow = 26, signal = 9) {
  if (!Array.isArray(data) || data.length < slow + signal) {
    return { line: [], signal: [], histogram: [] };
  }
  
  const ema12 = ema(data, fast);
  const ema26 = ema(data, slow);
  const line = new Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    line[i] = (ema12[i] !== null && ema26[i] !== null) ? ema12[i] - ema26[i] : null;
  }
  
  const signalLine = ema(line.filter(x => x !== null), signal);
  const histogram = new Array(data.length);
  
  let signalIdx = 0;
  for (let i = 0; i < data.length; i++) {
    if (line[i] !== null) {
      histogram[i] = signalLine[signalIdx] !== null ? line[i] - signalLine[signalIdx] : null;
      signalIdx++;
    } else {
      histogram[i] = null;
    }
  }
  
  return { line, signal: signalLine, histogram };
}

/**
 * Bollinger Bands with configurable periods
 */
export function bollinger(data, period = 20, stdDev = 2) {
  if (!Array.isArray(data) || data.length < period) {
    return { upper: [], middle: [], lower: [] };
  }
  
  const middle = sma(data, period);
  const upper = new Array(data.length);
  const lower = new Array(data.length);
  
  for (let i = period - 1; i < data.length; i++) {
    const mean = middle[i];
    if (mean === null) {
      upper[i] = null;
      lower[i] = null;
      continue;
    }
    
    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const val = Number(data[j]) || 0;
      sumSquaredDiff += Math.pow(val - mean, 2);
    }
    const std = Math.sqrt(sumSquaredDiff / period);
    
    upper[i] = mean + stdDev * std;
    lower[i] = mean - stdDev * std;
  }
  
  return { upper, middle, lower };
}

/**
 * ATR (Average True Range) with proper TR calculation
 */
export function atr(highs, lows, closes, period = 14) {
  if (!Array.isArray(highs) || highs.length < period + 1) {
    return new Array(highs?.length || 0).fill(null);
  }
  
  const tr = new Array(highs.length);
  
  // Calculate True Range
  for (let i = 0; i < highs.length; i++) {
    const h = Number(highs[i]) || 0;
    const l = Number(lows[i]) || 0;
    const c = i === 0 ? 0 : Number(closes[i - 1]) || 0;
    
    const tr1 = h - l;
    const tr2 = Math.abs(h - c);
    const tr3 = Math.abs(l - c);
    
    tr[i] = Math.max(tr1, tr2, tr3);
  }
  
  // Calculate ATR using RSI-style smoothing
  const result = new Array(highs.length);
  let sum = 0;
  
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }
  
  result[period - 1] = sum / period;
  
  for (let i = period; i < highs.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + tr[i]) / period;
  }
  
  return result;
}

/**
 * ADX / DMI (Average Directional Index + Directional Movement)
 */
export function adx(highs, lows, closes, period = 14) {
  if (!Array.isArray(highs) || highs.length < period + 1) {
    return { adx: [], plusDI: [], minusDI: [] };
  }
  
  const plusDM = new Array(highs.length);
  const minusDM = new Array(highs.length);
  
  // Calculate directional movement
  for (let i = 1; i < highs.length; i++) {
    const upMove = (Number(highs[i]) || 0) - (Number(highs[i - 1]) || 0);
    const downMove = (Number(lows[i - 1]) || 0) - (Number(lows[i]) || 0);
    
    if (upMove > downMove && upMove > 0) {
      plusDM[i] = upMove;
      minusDM[i] = 0;
    } else if (downMove > upMove && downMove > 0) {
      plusDM[i] = 0;
      minusDM[i] = downMove;
    } else {
      plusDM[i] = 0;
      minusDM[i] = 0;
    }
  }
  
  const trValues = atr(highs, lows, closes, period);
  const plusDI = new Array(highs.length);
  const minusDI = new Array(highs.length);
  const adxResult = new Array(highs.length);
  
  // Smooth DM and calculate DI
  for (let i = period; i < highs.length; i++) {
    let sumPlusDM = 0;
    let sumMinusDM = 0;
    let sumTR = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      sumPlusDM += plusDM[j] || 0;
      sumMinusDM += minusDM[j] || 0;
      sumTR += trValues[j] || 0;
    }
    
    const tr = sumTR || 0.01; // Avoid division by zero
    plusDI[i] = (sumPlusDM / tr) * 100;
    minusDI[i] = (sumMinusDM / tr) * 100;
  }
  
  // Calculate ADX
  let adxSum = 0;
  for (let i = period; i < period + period - 1; i++) {
    const di = Math.abs((plusDI[i] || 0) - (minusDI[i] || 0));
    adxSum += di;
  }
  
  adxResult[period + period - 2] = adxSum / period;
  
  for (let i = period + period - 1; i < highs.length; i++) {
    const di = Math.abs((plusDI[i] || 0) - (minusDI[i] || 0));
    const prevADX = adxResult[i - 1] || 0;
    adxResult[i] = (prevADX * (period - 1) + di) / period;
  }
  
  return { adx: adxResult, plusDI, minusDI };
}

/**
 * Williams %R with division-by-zero protection
 */
export function williamsR(highs, lows, closes, period = 14) {
  if (!Array.isArray(highs) || highs.length < period) {
    return new Array(highs?.length || 0).fill(null);
  }
  
  const result = new Array(highs.length);
  
  for (let i = period - 1; i < highs.length; i++) {
    let highestHigh = Number(highs[i]) || 0;
    let lowestLow = Number(lows[i]) || 0;
    
    for (let j = i - period + 1; j < i; j++) {
      highestHigh = Math.max(highestHigh, Number(highs[j]) || 0);
      lowestLow = Math.min(lowestLow, Number(lows[j]) || 0);
    }
    
    const close = Number(closes[i]) || 0;
    const range = highestHigh - lowestLow;
    
    if (range === 0) {
      result[i] = -50; // Neutral when no range
    } else {
      result[i] = ((highestHigh - close) / range) * -100;
    }
  }
  
  return result;
}
