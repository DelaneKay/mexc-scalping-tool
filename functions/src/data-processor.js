"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataProcessor = void 0;
const shared_1 = require("../packages/shared/src");
class DataProcessor {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 60000; // 1 minute
    }
    /**
     * Process multiple symbols and calculate scores
     */
    async processSymbols(symbolsData, symbolsInfo, timeframe) {
        const results = [];
        const allVolatilities = [];
        // First pass: calculate all volatilities for universe comparison
        for (const [symbol, klines] of Object.entries(symbolsData)) {
            if (klines.length < 50)
                continue; // Need enough data
            try {
                const closes = klines.map(k => k.close);
                const realizedVols = shared_1.IndicatorCalculator.realizedVolatility(closes, 20);
                if (realizedVols.length > 0) {
                    allVolatilities.push(realizedVols[realizedVols.length - 1]);
                }
            }
            catch (error) {
                console.warn(`Error calculating volatility for ${symbol}:`, error);
            }
        }
        // Second pass: calculate full analysis with universe context
        for (const [symbol, klines] of Object.entries(symbolsData)) {
            if (klines.length < 50)
                continue;
            try {
                const symbolInfo = symbolsInfo[symbol];
                if (!symbolInfo)
                    continue;
                const indicators = this.calculateIndicators(klines);
                const burstAnalysis = shared_1.ScoringEngine.calculateBurstScore(klines, indicators, allVolatilities);
                const volatilityMetrics = shared_1.ScoringEngine.calculateVolatilityMetrics(klines, indicators, allVolatilities);
                results.push({
                    symbol,
                    timeframe,
                    indicators,
                    volatility: volatilityMetrics,
                    burst: burstAnalysis,
                    symbolInfo,
                    lastUpdate: Date.now(),
                });
            }
            catch (error) {
                console.error(`Error processing ${symbol}:`, error);
            }
        }
        // Sort by burst score descending
        return results.sort((a, b) => b.burst.burstScore - a.burst.burstScore);
    }
    /**
     * Calculate all technical indicators for a symbol
     */
    calculateIndicators(klines) {
        const closes = klines.map(k => k.close);
        const highs = klines.map(k => k.high);
        const lows = klines.map(k => k.low);
        const volumes = klines.map(k => k.volume);
        // RSI
        const rsiValues = shared_1.IndicatorCalculator.rsi(closes, 14);
        const rsi14 = rsiValues[rsiValues.length - 1] || 50;
        // ATR
        const atrValues = shared_1.IndicatorCalculator.atr(klines, 14);
        const atr = atrValues[atrValues.length - 1] || 0;
        const atrPercent = (atr / closes[closes.length - 1]) * 100;
        // ADX
        const adxData = shared_1.IndicatorCalculator.adx(klines, 14);
        const adx14 = adxData.adx[adxData.adx.length - 1] || 0;
        // EMAs
        const ema20Values = shared_1.IndicatorCalculator.ema(closes, 20);
        const ema50Values = shared_1.IndicatorCalculator.ema(closes, 50);
        const ema20 = ema20Values[ema20Values.length - 1] || closes[closes.length - 1];
        const ema50 = ema50Values[ema50Values.length - 1] || closes[closes.length - 1];
        // Donchian Channels
        const donchian = shared_1.IndicatorCalculator.donchian(klines, 20);
        const donchianHigh20 = donchian.high[donchian.high.length - 1] || highs[highs.length - 1];
        const donchianLow20 = donchian.low[donchian.low.length - 1] || lows[lows.length - 1];
        // Volume EMA
        const volumeEmaValues = shared_1.IndicatorCalculator.ema(volumes, 20);
        const volumeEma = volumeEmaValues[volumeEmaValues.length - 1] || volumes[volumes.length - 1];
        return {
            rsi14,
            atr,
            atrPercent,
            adx14,
            ema20,
            ema50,
            donchianHigh20,
            donchianLow20,
            volumeEma,
        };
    }
    /**
     * Get cached klines or fetch new ones
     */
    getCachedKlines(symbol) {
        const cached = this.cache.get(symbol);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.klines;
        }
        return null;
    }
    /**
     * Cache klines data
     */
    setCachedKlines(symbol, klines) {
        this.cache.set(symbol, {
            klines,
            timestamp: Date.now(),
        });
    }
    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [symbol, data] of this.cache.entries()) {
            if (now - data.timestamp > this.CACHE_TTL) {
                this.cache.delete(symbol);
            }
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            symbols: Array.from(this.cache.keys()),
        };
    }
    /**
     * Process single symbol for detailed view
     */
    async processSymbolDetail(symbol, klines, symbolInfo, timeframe) {
        if (klines.length < 50) {
            throw new Error('Insufficient data for analysis');
        }
        const indicatorsSeries = [];
        const volatilitySeries = [];
        // Calculate indicators for each point (rolling window)
        const windowSize = 50;
        for (let i = windowSize; i < klines.length; i++) {
            const windowKlines = klines.slice(i - windowSize, i);
            const indicators = this.calculateIndicators(windowKlines);
            indicatorsSeries.push(indicators);
            // Calculate volatility metrics for this window
            const volatilityMetrics = shared_1.ScoringEngine.calculateVolatilityMetrics(windowKlines, indicators, []);
            volatilitySeries.push(volatilityMetrics);
        }
        // Calculate final burst analysis
        const finalIndicators = this.calculateIndicators(klines);
        const burstAnalysis = shared_1.ScoringEngine.calculateBurstScore(klines, finalIndicators, []);
        return {
            indicators: indicatorsSeries,
            volatility: volatilitySeries,
            burst: burstAnalysis,
        };
    }
    /**
     * Detect significant changes for notifications
     */
    detectSignificantChanges(current, previous) {
        const significantChanges = [];
        const previousMap = new Map(previous.map(r => [r.symbol, r]));
        for (const currentResult of current) {
            const previousResult = previousMap.get(currentResult.symbol);
            if (!previousResult)
                continue;
            // Check for state transitions
            if (previousResult.burst.state !== currentResult.burst.state) {
                if (['ABOUT_TO_BURST', 'LOSING_VOL'].includes(currentResult.burst.state)) {
                    significantChanges.push(currentResult);
                }
            }
            // Check for significant score changes
            const scoreDelta = currentResult.burst.burstScore - previousResult.burst.burstScore;
            if (Math.abs(scoreDelta) >= 10) {
                significantChanges.push({
                    ...currentResult,
                    burst: {
                        ...currentResult.burst,
                        deltaScore: scoreDelta,
                    },
                });
            }
        }
        return significantChanges;
    }
    /**
     * Filter results by thresholds
     */
    filterByThresholds(results, thresholds) {
        return results.filter(result => {
            if (thresholds.minBurstScore && result.burst.burstScore < thresholds.minBurstScore) {
                return false;
            }
            if (thresholds.minVolatilityScore && result.volatility.volatilityScore < thresholds.minVolatilityScore) {
                return false;
            }
            if (thresholds.minVolumeSurge && result.volatility.volumeSurge < thresholds.minVolumeSurge) {
                return false;
            }
            if (thresholds.states && !thresholds.states.includes(result.burst.state)) {
                return false;
            }
            return true;
        });
    }
    /**
     * Get top performers by different metrics
     */
    getTopPerformers(results, limit = 20) {
        return {
            byBurstScore: [...results]
                .sort((a, b) => b.burst.burstScore - a.burst.burstScore)
                .slice(0, limit),
            byVolatility: [...results]
                .sort((a, b) => b.volatility.volatilityScore - a.volatility.volatilityScore)
                .slice(0, limit),
            byVolumeSurge: [...results]
                .sort((a, b) => b.volatility.volumeSurge - a.volatility.volumeSurge)
                .slice(0, limit),
            aboutToBurst: results
                .filter(r => r.burst.state === 'ABOUT_TO_BURST')
                .sort((a, b) => b.burst.burstScore - a.burst.burstScore)
                .slice(0, limit),
        };
    }
}
exports.DataProcessor = DataProcessor;
