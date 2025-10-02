"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorCalculator = void 0;
class IndicatorCalculator {
    /**
     * Simple Moving Average
     */
    static sma(values, period) {
        const result = [];
        for (let i = period - 1; i < values.length; i++) {
            const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }
    /**
     * Exponential Moving Average
     */
    static ema(values, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        // First EMA is SMA
        const firstSma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
        result.push(firstSma);
        for (let i = period; i < values.length; i++) {
            const ema = (values[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
            result.push(ema);
        }
        return result;
    }
    /**
     * Relative Strength Index
     */
    static rsi(closes, period = 14) {
        const gains = [];
        const losses = [];
        for (let i = 1; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        const avgGains = this.ema(gains, period);
        const avgLosses = this.ema(losses, period);
        const result = [];
        for (let i = 0; i < avgGains.length; i++) {
            if (avgLosses[i] === 0) {
                result.push(100);
            }
            else {
                const rs = avgGains[i] / avgLosses[i];
                result.push(100 - (100 / (1 + rs)));
            }
        }
        return result;
    }
    /**
     * Average True Range
     */
    static atr(klines, period = 14) {
        const trueRanges = [];
        for (let i = 1; i < klines.length; i++) {
            const high = klines[i].high;
            const low = klines[i].low;
            const prevClose = klines[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
        return this.ema(trueRanges, period);
    }
    /**
     * Average Directional Index
     */
    static adx(klines, period = 14) {
        const plusDM = [];
        const minusDM = [];
        const trueRanges = [];
        for (let i = 1; i < klines.length; i++) {
            const highDiff = klines[i].high - klines[i - 1].high;
            const lowDiff = klines[i - 1].low - klines[i].low;
            plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
            minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
            const high = klines[i].high;
            const low = klines[i].low;
            const prevClose = klines[i - 1].close;
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
        const smoothedPlusDM = this.ema(plusDM, period);
        const smoothedMinusDM = this.ema(minusDM, period);
        const smoothedTR = this.ema(trueRanges, period);
        const plusDI = [];
        const minusDI = [];
        const dx = [];
        for (let i = 0; i < smoothedTR.length; i++) {
            const plusDIValue = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
            const minusDIValue = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
            plusDI.push(plusDIValue);
            minusDI.push(minusDIValue);
            const diSum = plusDIValue + minusDIValue;
            const diDiff = Math.abs(plusDIValue - minusDIValue);
            dx.push(diSum === 0 ? 0 : (diDiff / diSum) * 100);
        }
        const adx = this.ema(dx, period);
        return { adx, plusDI, minusDI };
    }
    /**
     * Donchian Channels
     */
    static donchian(klines, period = 20) {
        const highs = [];
        const lows = [];
        const middles = [];
        for (let i = period - 1; i < klines.length; i++) {
            const periodKlines = klines.slice(i - period + 1, i + 1);
            const high = Math.max(...periodKlines.map(k => k.high));
            const low = Math.min(...periodKlines.map(k => k.low));
            const middle = (high + low) / 2;
            highs.push(high);
            lows.push(low);
            middles.push(middle);
        }
        return { high: highs, low: lows, middle: middles };
    }
    /**
     * Rate of Change
     */
    static roc(values, period) {
        const result = [];
        for (let i = period; i < values.length; i++) {
            const current = values[i];
            const previous = values[i - period];
            const roc = ((current - previous) / previous) * 100;
            result.push(roc);
        }
        return result;
    }
    /**
     * Standard Deviation
     */
    static stdDev(values, period) {
        const result = [];
        for (let i = period - 1; i < values.length; i++) {
            const slice = values.slice(i - period + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b, 0) / period;
            const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
            result.push(Math.sqrt(variance));
        }
        return result;
    }
    /**
     * Z-Score calculation
     */
    static zScore(value, mean, stdDev) {
        return stdDev === 0 ? 0 : (value - mean) / stdDev;
    }
    /**
     * Median Absolute Deviation
     */
    static mad(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const deviations = values.map(v => Math.abs(v - median));
        const sortedDeviations = deviations.sort((a, b) => a - b);
        return sortedDeviations[Math.floor(sortedDeviations.length / 2)];
    }
    /**
     * Normalize value to 0-1 range using tanh
     */
    static normalize(value, scale = 1) {
        return Math.max(0, Math.min(1, 0.5 + 0.5 * Math.tanh(value / scale)));
    }
    /**
     * Calculate realized volatility from returns
     */
    static realizedVolatility(closes, period = 20) {
        const returns = [];
        for (let i = 1; i < closes.length; i++) {
            returns.push(Math.log(closes[i] / closes[i - 1]));
        }
        const volatilities = [];
        for (let i = period - 1; i < returns.length; i++) {
            const periodReturns = returns.slice(i - period + 1, i + 1);
            const mean = periodReturns.reduce((a, b) => a + b, 0) / period;
            const variance = periodReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (period - 1);
            const volatility = Math.sqrt(variance * 252); // Annualized
            volatilities.push(volatility);
        }
        return volatilities;
    }
}
exports.IndicatorCalculator = IndicatorCalculator;
