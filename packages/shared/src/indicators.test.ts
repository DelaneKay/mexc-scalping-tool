import { describe, it, expect } from 'vitest';
import { IndicatorCalculator } from './indicators';
import { Kline } from './types';

describe('IndicatorCalculator', () => {
  const mockKlines: Kline[] = [
    { timestamp: 1, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { timestamp: 2, open: 102, high: 108, low: 98, close: 106, volume: 1200 },
    { timestamp: 3, open: 106, high: 110, low: 104, close: 108, volume: 800 },
    { timestamp: 4, open: 108, high: 112, low: 106, close: 110, volume: 1500 },
    { timestamp: 5, open: 110, high: 115, low: 108, close: 112, volume: 900 },
  ];

  describe('SMA', () => {
    it('should calculate simple moving average correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const sma = IndicatorCalculator.sma(values, 3);
      
      expect(sma).toHaveLength(3);
      expect(sma[0]).toBe(2); // (1+2+3)/3
      expect(sma[1]).toBe(3); // (2+3+4)/3
      expect(sma[2]).toBe(4); // (3+4+5)/3
    });
  });

  describe('EMA', () => {
    it('should calculate exponential moving average', () => {
      const values = [1, 2, 3, 4, 5];
      const ema = IndicatorCalculator.ema(values, 3);
      
      expect(ema).toHaveLength(3);
      expect(ema[0]).toBe(2); // First EMA is SMA
      expect(ema[1]).toBeCloseTo(2.5, 1); // Subsequent EMAs use multiplier
    });
  });

  describe('RSI', () => {
    it('should calculate RSI values', () => {
      const closes = mockKlines.map(k => k.close);
      const rsi = IndicatorCalculator.rsi(closes, 3);
      
      expect(rsi).toHaveLength(2); // Length should be closes.length - period
      expect(rsi[0]).toBeGreaterThan(0);
      expect(rsi[0]).toBeLessThan(100);
    });
  });

  describe('ATR', () => {
    it('should calculate Average True Range', () => {
      const atr = IndicatorCalculator.atr(mockKlines, 3);
      
      expect(atr).toHaveLength(2); // Length should be klines.length - period
      expect(atr[0]).toBeGreaterThan(0);
    });
  });

  describe('Donchian Channels', () => {
    it('should calculate Donchian channels', () => {
      const donchian = IndicatorCalculator.donchian(mockKlines, 3);
      
      expect(donchian.high).toHaveLength(3);
      expect(donchian.low).toHaveLength(3);
      expect(donchian.middle).toHaveLength(3);
      
      // High should be >= Low
      expect(donchian.high[0]).toBeGreaterThanOrEqual(donchian.low[0]);
    });
  });

  describe('Standard Deviation', () => {
    it('should calculate standard deviation', () => {
      const values = [1, 2, 3, 4, 5];
      const stdDev = IndicatorCalculator.stdDev(values, 3);
      
      expect(stdDev).toHaveLength(3);
      expect(stdDev[0]).toBeCloseTo(0.816, 2); // Known std dev of [1,2,3]
    });
  });

  describe('Z-Score', () => {
    it('should calculate z-score correctly', () => {
      const zScore = IndicatorCalculator.zScore(5, 3, 1);
      expect(zScore).toBe(2);
      
      const zScoreZero = IndicatorCalculator.zScore(5, 3, 0);
      expect(zScoreZero).toBe(0);
    });
  });

  describe('Normalize', () => {
    it('should normalize values to 0-1 range', () => {
      expect(IndicatorCalculator.normalize(0)).toBe(0.5);
      expect(IndicatorCalculator.normalize(1)).toBeGreaterThan(0.5);
      expect(IndicatorCalculator.normalize(-1)).toBeLessThan(0.5);
      
      // Should clamp to 0-1 range
      const normalized = IndicatorCalculator.normalize(100);
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(1);
    });
  });

  describe('Realized Volatility', () => {
    it('should calculate realized volatility', () => {
      const closes = mockKlines.map(k => k.close);
      const volatility = IndicatorCalculator.realizedVolatility(closes, 3);
      
      expect(volatility).toHaveLength(1); // closes.length - period
      expect(volatility[0]).toBeGreaterThan(0);
    });
  });
});