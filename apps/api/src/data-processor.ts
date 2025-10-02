import {
  Kline,
  SymbolInfo,
  TechnicalIndicators as TI,
  ScanResult,
  Timeframe,
  IndicatorCalculator,
  ScoringEngine,
  defaultConfig,
} from '@mexc-scalping/shared';

export class DataProcessor {
  private cache: Map<string, { klines: Kline[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Process multiple symbols and calculate scores
   */
  async processSymbols(
    symbolsData: Record<string, Kline[]>,
    symbolsInfo: Record<string, SymbolInfo>,
    timeframe: Timeframe
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const allVolatilities: number[] = [];

    // First pass: calculate all volatilities for universe comparison
    for (const [symbol, klines] of Object.entries(symbolsData)) {
      if (klines.length < 50) continue; // Need enough data

      try {
        const closes = klines.map(k => k.close);
        const realizedVols = IndicatorCalculator.realizedVolatility(closes, 20);
        if (realizedVols.length > 0) {
          allVolatilities.push(realizedVols[realizedVols.length - 1]);
        }
      } catch (error) {
        console.warn(`Error calculating volatility for ${symbol}:`, error);
      }
    }

    // Second pass: calculate full analysis with universe context
    for (const [symbol, klines] of Object.entries(symbolsData)) {
      if (klines.length < 50) continue;

      try {
        const symbolInfo = symbolsInfo[symbol];
        if (!symbolInfo) continue;

        const indicators = this.calculateIndicators(klines);
        const burstAnalysis = ScoringEngine.calculateBurstScore(
          klines,
          indicators,
          allVolatilities
        );

        const volatilityMetrics = ScoringEngine.calculateVolatilityMetrics(
          klines,
          indicators,
          allVolatilities
        );

        results.push({
          symbol,
          timeframe,
          indicators,
          volatility: volatilityMetrics,
          burst: burstAnalysis,
          symbolInfo,
          lastUpdate: Date.now(),
        });
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
      }
    }

    // Sort by burst score descending
    return results.sort((a, b) => b.burst.burstScore - a.burst.burstScore);
  }

  /**
   * Calculate all technical indicators for a symbol
   */
  private calculateIndicators(klines: Kline[]): TI {
    const closes = klines.map(k => k.close);
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);
    const volumes = klines.map(k => k.volume);

    // RSI
    const rsiValues = IndicatorCalculator.rsi(closes, 14);
    const rsi14 = rsiValues[rsiValues.length - 1] || 50;

    // ATR
    const atrValues = IndicatorCalculator.atr(klines, 14);
    const atr = atrValues[atrValues.length - 1] || 0;
    const atrPercent = (atr / closes[closes.length - 1]) * 100;

    // ADX
    const adxData = IndicatorCalculator.adx(klines, 14);
    const adx14 = adxData.adx[adxData.adx.length - 1] || 0;

    // EMAs
    const ema20Values = IndicatorCalculator.ema(closes, 20);
    const ema50Values = IndicatorCalculator.ema(closes, 50);
    const ema20 = ema20Values[ema20Values.length - 1] || closes[closes.length - 1];
    const ema50 = ema50Values[ema50Values.length - 1] || closes[closes.length - 1];

    // Donchian Channels
    const donchian = IndicatorCalculator.donchian(klines, 20);
    const donchianHigh20 = donchian.high[donchian.high.length - 1] || highs[highs.length - 1];
    const donchianLow20 = donchian.low[donchian.low.length - 1] || lows[lows.length - 1];

    // Volume EMA
    const volumeEmaValues = IndicatorCalculator.ema(volumes, 20);
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
  getCachedKlines(symbol: string): Kline[] | null {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.klines;
    }
    return null;
  }

  /**
   * Cache klines data
   */
  setCachedKlines(symbol: string, klines: Kline[]): void {
    this.cache.set(symbol, {
      klines,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
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
  getCacheStats(): { size: number; symbols: string[] } {
    return {
      size: this.cache.size,
      symbols: Array.from(this.cache.keys()),
    };
  }

  /**
   * Process single symbol for detailed view
   */
  async processSymbolDetail(
    symbol: string,
    klines: Kline[],
    symbolInfo: SymbolInfo,
    timeframe: Timeframe
  ): Promise<{
    indicators: TI[];
    volatility: any[];
    burst: any;
  }> {
    if (klines.length < 50) {
      throw new Error('Insufficient data for analysis');
    }

    const indicatorsSeries: TI[] = [];
    const volatilitySeries: any[] = [];

    // Calculate indicators for each point (rolling window)
    const windowSize = 50;
    for (let i = windowSize; i < klines.length; i++) {
      const windowKlines = klines.slice(i - windowSize, i);
      const indicators = this.calculateIndicators(windowKlines);
      indicatorsSeries.push(indicators);

      // Calculate volatility metrics for this window
      const volatilityMetrics = ScoringEngine.calculateVolatilityMetrics(
        windowKlines,
        indicators,
        []
      );
      volatilitySeries.push(volatilityMetrics);
    }

    // Calculate final burst analysis
    const finalIndicators = this.calculateIndicators(klines);
    const burstAnalysis = ScoringEngine.calculateBurstScore(
      klines,
      finalIndicators,
      []
    );

    return {
      indicators: indicatorsSeries,
      volatility: volatilitySeries,
      burst: burstAnalysis,
    };
  }

  /**
   * Detect significant changes for notifications
   */
  detectSignificantChanges(
    current: ScanResult[],
    previous: ScanResult[]
  ): ScanResult[] {
    const significantChanges: ScanResult[] = [];
    const previousMap = new Map(previous.map(r => [r.symbol, r]));

    for (const currentResult of current) {
      const previousResult = previousMap.get(currentResult.symbol);
      
      if (!previousResult) continue;

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
  filterByThresholds(
    results: ScanResult[],
    thresholds: {
      minBurstScore?: number;
      minVolatilityScore?: number;
      minVolumeSurge?: number;
      states?: string[];
    }
  ): ScanResult[] {
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
  getTopPerformers(results: ScanResult[], limit: number = 20): {
    byBurstScore: ScanResult[];
    byVolatility: ScanResult[];
    byVolumeSurge: ScanResult[];
    aboutToBurst: ScanResult[];
  } {
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