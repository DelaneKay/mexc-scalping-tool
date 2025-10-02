export interface Kline {
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
  status: string;
  openInterest?: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  lastPrice: number;
  markPrice?: number;
  indexPrice?: number;
  fundingRate?: number;
  nextFundingTime?: number;
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
}

export interface VolatilityMetrics {
  realizedVolatility: number;
  volatilityZScore: number;
  volatilityScore: number; // 0-100
  volumeSurge: number;
  volumeSurgeNormalized: number; // 0-1
  breakoutProximity: number;
  breakoutScore: number; // 0-1
  momentum: number;
  momentumNormalized: number; // 0-1
  trendQuality: number;
  trendQualityNormalized: number; // 0-1
}

export interface BurstAnalysis {
  burstScore: number; // 0-100
  burstRaw: number;
  state: SignalState;
  leverageSuggestion: number;
  lastUpdate: number;
  deltaScore?: number; // Change in last 10s
  deltaVolatility?: number; // Change in last 10s
}

export type SignalState = 
  | 'ABOUT_TO_BURST'
  | 'VOLATILE' 
  | 'LOSING_VOL'
  | 'NORMAL';

export interface ScanResult {
  symbol: string;
  timeframe: Timeframe;
  indicators: TechnicalIndicators;
  volatility: VolatilityMetrics;
  burst: BurstAnalysis;
  symbolInfo: SymbolInfo;
  lastUpdate: number;
}

export type Timeframe = '1m' | '5m';

export type UniverseFilter = 'oi200' | 'gainers50';

export interface ScanRequest {
  timeframe?: Timeframe;
  universe?: UniverseFilter;
  minVolume?: number;
  limit?: number;
}

export interface ScanResponse {
  results: ScanResult[];
  timestamp: number;
  universe: UniverseFilter;
  timeframe: Timeframe;
  totalSymbols: number;
}

export interface SymbolDetailResponse {
  symbol: string;
  timeframe: Timeframe;
  klines: Kline[];
  indicators: TechnicalIndicators[];
  volatility: VolatilityMetrics[];
  burst: BurstAnalysis;
  symbolInfo: SymbolInfo;
}

export interface NotificationPayload {
  symbol: string;
  timeframe: Timeframe;
  state: SignalState;
  burstScore: number;
  volatilityScore: number;
  volumeSurge: number;
  atrPercent: number;
  leverageSuggestion: number;
  timestamp: number;
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

export interface AppConfig {
  defaultTimeframe: Timeframe;
  defaultUniverse: UniverseFilter;
  minVolume24h: number;
  refreshInterval: number;
  burstThreshold: number;
  volatilityThreshold: number;
  volumeSurgeThreshold: number;
  discordWebhookUrl?: string;
  featureWindows: {
    rsi: number;
    atr: number;
    adx: number;
    ema: number;
    donchian: number;
    volume: number;
  };
}

export interface StateTransition {
  symbol: string;
  timeframe: Timeframe;
  fromState: SignalState;
  toState: SignalState;
  timestamp: number;
  burstScore: number;
  volatilityScore: number;
}