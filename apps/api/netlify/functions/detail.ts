import { Handler } from '@netlify/functions';
import { MexcClient } from '../../src/mexc-client';
import { DataProcessor } from '../../src/data-processor';
import { validateEnv, SymbolDetailResponse } from '@mexc-scalping/shared';

const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate environment
    const env = validateEnv(process.env);
    
    // Parse query parameters
    const symbol = event.queryStringParameters?.symbol;
    const timeframe = (event.queryStringParameters?.tf || '1m') as '1m' | '5m';
    
    if (!symbol) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Symbol parameter is required' 
        }),
      };
    }

    if (!['1m', '5m'].includes(timeframe)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid timeframe. Must be "1m" or "5m"' 
        }),
      };
    }

    // Initialize clients
    const mexcClient = new MexcClient(
      env.MEXC_API_KEY,
      env.MEXC_API_SECRET,
      env.MEXC_SANDBOX
    );
    const dataProcessor = new DataProcessor();

    // Fetch symbol info and klines
    const [symbolStats, klines] = await Promise.all([
      mexcClient.fetch24hStats([symbol]),
      mexcClient.fetchKlines(symbol, timeframe, 200),
    ]);

    const symbolInfo = symbolStats[symbol];
    if (!symbolInfo) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Symbol not found or not available' 
        }),
      };
    }

    if (klines.length < 50) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Insufficient data for analysis' 
        }),
      };
    }

    // Process symbol detail
    const detail = await dataProcessor.processSymbolDetail(
      symbol,
      klines,
      symbolInfo,
      timeframe
    );

    const response: SymbolDetailResponse = {
      symbol,
      timeframe,
      klines,
      indicators: detail.indicators,
      volatility: detail.volatility,
      burst: detail.burst,
      symbolInfo,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in detail function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      }),
    };
  }
};

export { handler };