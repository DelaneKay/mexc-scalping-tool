import ccxt from 'ccxt';
import { SymbolInfo, Kline, Timeframe, UniverseFilter } from '@mexc-scalping/shared';
import { RateLimiter, CircuitBreaker, retry } from '@mexc-scalping/shared';

export class MexcClient {
  private exchange: any; // ccxt.mexc
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  
  constructor(apiKey?: string, secret?: string, sandbox: boolean = false) {
    this.exchange = new ccxt.mexc({
      apiKey,
      secret,
      sandbox,
      options: {
        defaultType: 'swap', // Use futures/perpetual contracts
      },
    });
    
    // MEXC allows 20 requests per second for public endpoints
    this.rateLimiter = new RateLimiter(15, 1000);
    this.circuitBreaker = new CircuitBreaker(5, 60000);
  }

  /**
   * Fetch all USDT perpetual futures symbols
   */
  async fetchSymbols(): Promise<SymbolInfo[]> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.waitIfNeeded();
      
      const markets = await this.exchange.loadMarkets();
      const symbols: SymbolInfo[] = [];
      
      for (const [symbol, market] of Object.entries(markets)) {
        const marketData = market as any;
        if (
          marketData.type === 'swap' &&
          marketData.quote === 'USDT' &&
          marketData.active
        ) {
          // Fetch 24h ticker data
          const ticker = await this.exchange.fetchTicker(symbol);
          
          symbols.push({
            symbol: marketData.symbol,
            baseAsset: marketData.base,
            quoteAsset: marketData.quote,
            status: marketData.active ? 'TRADING' : 'INACTIVE',
            volume24h: ticker.quoteVolume || 0,
            priceChange24h: ticker.change || 0,
            priceChangePercent24h: ticker.percentage || 0,
            lastPrice: ticker.last || 0,
          });
        }
      }
      
      return symbols;
    });
  }

  /**
   * Fetch filtered universe of symbols
   */
  async fetchUniverse(filter: UniverseFilter, minVolume: number = 500000): Promise<SymbolInfo[]> {
    const allSymbols = await this.fetchSymbols();
    
    // Filter by minimum volume
    const volumeFiltered = allSymbols.filter(s => s.volume24h >= minVolume);
    
    if (filter === 'oi200') {
      // Fetch open interest data and sort by OI
      const symbolsWithOI = await this.fetchOpenInterest(volumeFiltered);
      return symbolsWithOI
        .sort((a, b) => (b.openInterest || 0) - (a.openInterest || 0))
        .slice(0, 200);
    } else if (filter === 'gainers50') {
      // Sort by 24h percentage change
      return volumeFiltered
        .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
        .slice(0, 50);
    }
    
    return volumeFiltered;
  }

  /**
   * Fetch open interest for symbols
   */
  async fetchOpenInterest(symbols: SymbolInfo[]): Promise<SymbolInfo[]> {
    const results: SymbolInfo[] = [];
    
    for (const symbol of symbols) {
      try {
        await this.rateLimiter.waitIfNeeded();
        
        // MEXC doesn't have direct OI endpoint in ccxt, simulate with volume
        // In production, you'd use the actual MEXC API endpoint
        const openInterest = symbol.volume24h * 0.1; // Rough estimation
        
        results.push({
          ...symbol,
          openInterest,
        });
      } catch (error) {
        console.warn(`Failed to fetch OI for ${symbol.symbol}:`, error);
        results.push(symbol);
      }
    }
    
    return results;
  }

  /**
   * Fetch kline/candlestick data
   */
  async fetchKlines(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 200,
    since?: number
  ): Promise<Kline[]> {
    return this.circuitBreaker.execute(async () => {
      await this.rateLimiter.waitIfNeeded();
      
      const ohlcv = await this.exchange.fetchOHLCV(
        symbol,
        timeframe,
        since,
        limit
      );
      
      return ohlcv.map(([timestamp, open, high, low, close, volume]: any[]) => ({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      }));
    });
  }

  /**
   * Fetch multiple symbols' klines in batch
   */
  async fetchMultipleKlines(
    symbols: string[],
    timeframe: Timeframe,
    limit: number = 200
  ): Promise<Record<string, Kline[]>> {
    const results: Record<string, Kline[]> = {};
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async symbol => {
        try {
          const klines = await this.fetchKlines(symbol, timeframe, limit);
          return { symbol, klines };
        } catch (error) {
          console.warn(`Failed to fetch klines for ${symbol}:`, error);
          return { symbol, klines: [] };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      for (const { symbol, klines } of batchResults) {
        results[symbol] = klines;
      }
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Fetch 24h ticker statistics
   */
  async fetch24hStats(symbols: string[]): Promise<Record<string, SymbolInfo>> {
    const results: Record<string, SymbolInfo> = {};
    
    for (const symbol of symbols) {
      try {
        await this.rateLimiter.waitIfNeeded();
        
        const ticker = await this.exchange.fetchTicker(symbol);
        const market = this.exchange.market(symbol);
        
        results[symbol] = {
          symbol: market.symbol,
          baseAsset: market.base,
          quoteAsset: market.quote,
          status: market.active ? 'TRADING' : 'INACTIVE',
          volume24h: ticker.quoteVolume || 0,
          priceChange24h: ticker.change || 0,
          priceChangePercent24h: ticker.percentage || 0,
          lastPrice: ticker.last || 0,
        };
      } catch (error) {
        console.warn(`Failed to fetch 24h stats for ${symbol}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: number; exchange: string }> {
    try {
      await this.exchange.fetchStatus();
      return {
        status: 'healthy',
        timestamp: Date.now(),
        exchange: 'MEXC',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        exchange: 'MEXC',
      };
    }
  }

  /**
   * Get exchange info
   */
  getExchangeInfo() {
    return {
      name: this.exchange.name,
      countries: this.exchange.countries,
      rateLimit: this.exchange.rateLimit,
      has: this.exchange.has,
      circuitBreakerState: this.circuitBreaker.getState(),
    };
  }
}