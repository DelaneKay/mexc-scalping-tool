export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  openInterest: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  lastPrice: number;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  nextFundingTime: number;
  maxLeverage: number;
  tickSize: number;
  stepSize: number;
  minNotional: number;
  isActive: boolean;
}

export interface TechnicalIndicators {
  rsi14: number;
  atr: number;
  atrPercent: number;
  adx14: number;
  ema20: number;
  ema50: number;
  donchianHigh20: number;
  donchianLow20: number;
  volumeEma: number;
  roc3: number;
}

export interface VolatilityMetrics {
  realizedVolatility: number;
  zScore: number;
  zScoreNormalized: number;
  volumeSurge: number;
  volumeSurgeNormalized: number;
  breakoutProximity: number;
  breakoutScore: number;
  momentum: number;
  momentumNormalized: number;
  trendQuality: number;
  trendQualityNormalized: number;
}

export interface BurstScore {
  raw: number;
  final: number;
  components: {
    volatility: number;
    volumeSurge: number;
    breakout: number;
    momentum: number;
    trend?: number;
  };
}

export type MarketState = 
  | 'ABOUT_TO_BURST'
  | 'VOLATILE' 
  | 'LOSING_VOL'
  | 'NORMAL';

export interface StateConditions {
  aboutToBurst: {
    burstScore: number;
    volumeSurgeMin: number;
    breakoutScoreMin: number;
    volatilityTrending: boolean;
  };
  volatile: {
    zScoreThreshold: number;
    atrPercentThreshold: number;
  };
  losingVol: {
    zScoreDropThreshold: number;
    adxDropThreshold: number;
    volumeEmaSlope: number;
  };
}

export interface ScanResult {
  symbol: string;
  timeframe: '1m' | '5m';
  burstScore: BurstScore;
  volatilityScore: number;
  state: MarketState;
  indicators: TechnicalIndicators;
  metrics: VolatilityMetrics;
  leverageSuggestion: number;
  lastUpdate: number;
  priceChange10s?: number;
  burstScoreChange10s?: number;
  volatilityScoreChange10s?: number;
  breakoutFlag: boolean;
  pullbackRisk: number;
}

export interface UniverseFilter {
  type: 'oi200' | 'gainers50';
  minVolume24h: number;
  minOpenInterest?: number;
}

export interface ScanParams {
  timeframe: '1m' | '5m';
  universe: UniverseFilter;
  limit?: number;
  minBurstScore?: number;
  states?: MarketState[];
}

export interface NotificationPayload {
  symbol: string;
  timeframe: '1m' | '5m';
  state: MarketState;
  burstScore: number;
  volatilityScore: number;
  leverageSuggestion: number;
  timestamp: number;
  message: string;
}

export interface WebSocketTicker {
  symbol: string;
  lastPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  openInterest?: number;
  timestamp: number;
}

export interface FeatureWindow {
  volatility: number;
  volume: number;
  breakout: number;
  momentum: number;
  trend: number;
}

export interface UserSettings {
  defaultTimeframe: '1m' | '5m';
  thresholds: {
    burstScore: number;
    volatilityScore: number;
    volumeSurge: number;
  };
  minVolume24h: number;
  featureWindows: FeatureWindow;
  discordWebhookUrl?: string;
  notifications: {
    inApp: boolean;
    discord: boolean;
    states: MarketState[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    mexc: 'up' | 'down' | 'rate_limited';
    websocket: 'connected' | 'disconnected' | 'reconnecting';
    database: 'up' | 'down';
  };
  lastUpdate: number;
  uptime: number;
}