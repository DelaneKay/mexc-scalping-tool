import { Kline, TechnicalIndicators as TI, VolatilityMetrics, BurstAnalysis, SignalState } from './types';
import { TechnicalIndicators } from './indicators';
import { defaultConfig } from './env';

export class ScoringEngine {
  /**
   * Calculate comprehensive burst score for a symbol
   */
  static calculateBurstScore(
    klines: Kline[],
    indicators: TI,
    universeVolatilities: number[] = []
  ): BurstAnalysis {
    const volatilityMetrics = this.calculateVolatilityMetrics(klines, indicators, universeVolatilities);
    const burstRaw = this.calculateRawBurstScore(volatilityMetrics);
    const burstScore = this.normalizeBurstScore(burstRaw);
    const state = this.determineSignalState(klines, indicators, volatilityMetrics, burstScore);
    const leverageSuggestion = this.calculateLeverageSuggestion(indicators.atrPercent);

    return {
      burstScore,
      burstRaw,
      state,
      leverageSuggestion,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Calculate volatility metrics including z-scores and normalized values
   */
  static calculateVolatilityMetrics(
    klines: Kline[],
    indicators: TI,
    universeVolatilities: number[] = []
  ): VolatilityMetrics {
    const closes = klines.map(k => k.close);
    const volumes = klines.map(k => k.volume);
    
    // Realized volatility calculation
    const realizedVols = TechnicalIndicators.realizedVolatility(closes, 20);
    const realizedVolatility = realizedVols[realizedVols.length - 1] || 0;
    
    // Volatility Z-Score vs universe
    let volatilityZScore = 0;
    let volatilityScore = 0;
    
    if (universeVolatilities.length > 0) {
      const universeMedian = this.median(universeVolatilities);
      const universeMad = TechnicalIndicators.mad(universeVolatilities);
      volatilityZScore = TechnicalIndicators.zScore(realizedVolatility, universeMedian, universeMad);
      volatilityScore = Math.max(0, Math.min(100, 50 + volatilityZScore * 20));
    }
    
    // Volume surge calculation
    const lastVolume = volumes[volumes.length - 1];
    const volumeSurge = lastVolume / indicators.volumeEma;
    const volumeSurgeNormalized = Math.min(1, volumeSurge / 5); // Cap at 5x
    
    // Breakout proximity
    const currentPrice = closes[closes.length - 1];
    const distanceToHigh = (indicators.donchianHigh20 - currentPrice) / (indicators.atr || 1);
    const breakoutProximity = Math.max(0, 1 - Math.abs(distanceToHigh) / 2);
    const breakoutScore = currentPrice >= indicators.donchianHigh20 ? 1 : breakoutProximity;
    
    // Momentum calculation
    const rsiNormalized = (indicators.rsi14 - 50) / 50; // -1 to 1
    const rocValues = TechnicalIndicators.roc(closes, 3);
    const roc = rocValues[rocValues.length - 1] || 0;
    const rocNormalized = Math.tanh(roc / 5); // Normalize ROC
    const momentum = (rsiNormalized + rocNormalized) / 2;
    const momentumNormalized = TechnicalIndicators.normalize(momentum);
    
    // Trend quality (ADX)
    const trendQuality = indicators.adx14;
    const trendQualityNormalized = Math.min(1, trendQuality / 50);
    
    return {
      realizedVolatility,
      volatilityZScore,
      volatilityScore,
      volumeSurge,
      volumeSurgeNormalized,
      breakoutProximity,
      breakoutScore,
      momentum,
      momentumNormalized,
      trendQuality,
      trendQualityNormalized,
    };
  }

  /**
   * Calculate raw burst score using weighted components
   */
  static calculateRawBurstScore(metrics: VolatilityMetrics): number {
    const weights = defaultConfig.burstWeights;
    const volatilityComponent = TechnicalIndicators.normalize(metrics.volatilityZScore);
    
    return (
      weights.volatilityZScore * volatilityComponent +
      weights.volumeSurge * metrics.volumeSurgeNormalized +
      weights.breakoutProximity * metrics.breakoutScore +
      weights.momentum * metrics.momentumNormalized +
      weights.trendQuality * metrics.trendQualityNormalized
    );
  }

  /**
   * Normalize burst score to 0-100 range using tanh
   */
  static normalizeBurstScore(rawScore: number): number {
    return Math.max(0, Math.min(100, 50 + 50 * Math.tanh(rawScore)));
  }

  /**
   * Determine signal state based on thresholds and conditions
   */
  static determineSignalState(
    klines: Kline[],
    indicators: TI,
    volatility: VolatilityMetrics,
    burstScore: number
  ): SignalState {
    const thresholds = defaultConfig.stateThresholds;
    
    // Check ABOUT_TO_BURST conditions
    if (
      burstScore >= thresholds.aboutToBurst.burstScore &&
      (volatility.volumeSurgeNormalized >= thresholds.aboutToBurst.volumeSurgeMin ||
       volatility.breakoutScore >= thresholds.aboutToBurst.breakoutProximityMin)
    ) {
      // Check if volatility is trending up over last 3 bars
      const closes = klines.map(k => k.close);
      const recentVols = TechnicalIndicators.realizedVolatility(closes.slice(-10), 5);
      if (recentVols.length >= 3) {
        const isVolTrendingUp = recentVols[recentVols.length - 1] > recentVols[recentVols.length - 3];
        if (isVolTrendingUp) {
          return 'ABOUT_TO_BURST';
        }
      }
    }
    
    // Check VOLATILE conditions
    if (
      volatility.volatilityZScore >= thresholds.volatile.volatilityZScore ||
      indicators.atrPercent >= thresholds.volatile.atrPercentMin
    ) {
      return 'VOLATILE';
    }
    
    // Check LOSING_VOL conditions
    const closes = klines.map(k => k.close);
    const recentVols = TechnicalIndicators.realizedVolatility(closes.slice(-10), 5);
    if (recentVols.length >= 5) {
      const volDrop = recentVols[recentVols.length - 5] - recentVols[recentVols.length - 1];
      const normalizedVolDrop = volDrop / (recentVols[recentVols.length - 5] || 1);
      
      if (normalizedVolDrop >= thresholds.losingVolatility.volatilityDropThreshold) {
        return 'LOSING_VOL';
      }
    }
    
    return 'NORMAL';
  }

  /**
   * Calculate leverage suggestion based on ATR%
   */
  static calculateLeverageSuggestion(atrPercent: number): number {
    const leverageMap = defaultConfig.leverageMap;
    
    for (const [threshold, leverage] of Object.entries(leverageMap)) {
      if (atrPercent <= parseFloat(threshold)) {
        return leverage;
      }
    }
    
    return 5; // Default fallback
  }

  /**
   * Detect state transitions for notifications
   */
  static detectStateTransition(
    previousState: SignalState,
    currentState: SignalState,
    symbol: string,
    timeframe: string,
    burstScore: number,
    volatilityScore: number
  ): boolean {
    const significantTransitions = [
      'ABOUT_TO_BURST',
      'LOSING_VOL'
    ];
    
    return (
      previousState !== currentState &&
      significantTransitions.includes(currentState)
    );
  }

  /**
   * Calculate delta changes for UI updates
   */
  static calculateDeltas(
    current: BurstAnalysis,
    previous: BurstAnalysis | null
  ): { deltaScore?: number; deltaVolatility?: number } {
    if (!previous) return {};
    
    return {
      deltaScore: current.burstScore - previous.burstScore,
      deltaVolatility: current.burstScore - previous.burstScore, // Simplified for now
    };
  }

  /**
   * Utility function to calculate median
   */
  private static median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Risk assessment for leverage suggestion
   */
  static assessRisk(
    volatility: VolatilityMetrics,
    indicators: TI,
    timeframe: string
  ): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    riskFactors: string[];
    maxSuggestedLeverage: number;
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;
    
    // Volatility risk
    if (volatility.volatilityZScore > 2) {
      riskFactors.push('Extreme volatility');
      riskScore += 3;
    } else if (volatility.volatilityZScore > 1.5) {
      riskFactors.push('High volatility');
      riskScore += 2;
    }
    
    // ATR risk
    if (indicators.atrPercent > 2) {
      riskFactors.push('Very high ATR');
      riskScore += 2;
    } else if (indicators.atrPercent > 1.2) {
      riskFactors.push('High ATR');
      riskScore += 1;
    }
    
    // Volume surge risk
    if (volatility.volumeSurge > 10) {
      riskFactors.push('Extreme volume surge');
      riskScore += 2;
    } else if (volatility.volumeSurge > 5) {
      riskFactors.push('High volume surge');
      riskScore += 1;
    }
    
    // Timeframe risk
    if (timeframe === '1m') {
      riskFactors.push('Short timeframe');
      riskScore += 1;
    }
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    let maxSuggestedLeverage: number;
    
    if (riskScore >= 6) {
      riskLevel = 'EXTREME';
      maxSuggestedLeverage = 3;
    } else if (riskScore >= 4) {
      riskLevel = 'HIGH';
      maxSuggestedLeverage = 5;
    } else if (riskScore >= 2) {
      riskLevel = 'MEDIUM';
      maxSuggestedLeverage = 7;
    } else {
      riskLevel = 'LOW';
      maxSuggestedLeverage = 10;
    }
    
    return {
      riskLevel,
      riskFactors,
      maxSuggestedLeverage,
    };
  }
}