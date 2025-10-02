import { Handler } from '@netlify/functions';
import { MexcClient } from '../../src/mexc-client';
import { DataProcessor } from '../../src/data-processor';
import { validateEnv, ScanResponse } from '@mexc-scalping/shared';

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
    const timeframe = (event.queryStringParameters?.tf || '1m') as '1m' | '5m';
    const universe = event.queryStringParameters?.universe || 'oi200';
    const limit = parseInt(event.queryStringParameters?.limit || '50', 10);
    const minVolume = parseInt(event.queryStringParameters?.minVolume || '500000', 10);
    
    // Validation
    if (!['1m', '5m'].includes(timeframe)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid timeframe. Must be "1m" or "5m"' 
        }),
      };
    }

    if (!['oi200', 'gainers50'].includes(universe)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid universe. Must be "oi200" or "gainers50"' 
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

    // Fetch universe of symbols
    const symbols = await mexcClient.fetchUniverse(
      universe as 'oi200' | 'gainers50',
      minVolume
    );

    if (symbols.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          results: [],
          timestamp: Date.now(),
          universe,
          timeframe,
          totalSymbols: 0,
        } as ScanResponse),
      };
    }

    // Limit symbols for processing (to avoid timeouts)
    const symbolsToProcess = symbols.slice(0, Math.min(100, symbols.length));
    const symbolNames = symbolsToProcess.map(s => s.symbol);

    // Fetch klines data for all symbols
    const klinesData = await mexcClient.fetchMultipleKlines(
      symbolNames,
      timeframe,
      200
    );

    // Create symbol info map
    const symbolsInfo = symbolsToProcess.reduce((acc, symbol) => {
      acc[symbol.symbol] = symbol;
      return acc;
    }, {} as Record<string, any>);

    // Process all symbols and calculate scores
    const results = await dataProcessor.processSymbols(
      klinesData,
      symbolsInfo,
      timeframe
    );

    // Apply additional filtering and limiting
    const filteredResults = results
      .filter(r => r.burst.burstScore > 0) // Only include valid scores
      .slice(0, limit);

    const response: ScanResponse = {
      results: filteredResults,
      timestamp: Date.now(),
      universe: universe as 'oi200' | 'gainers50',
      timeframe,
      totalSymbols: symbols.length,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in scan function:', error);
    
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

exports.handler = handler;