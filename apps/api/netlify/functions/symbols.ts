import { Handler } from '@netlify/functions';
import { MexcClient } from '../../src/mexc-client';
import { validateEnv } from '@mexc-scalping/shared';

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
    const universe = event.queryStringParameters?.universe || 'oi200';
    const minVolume = parseInt(event.queryStringParameters?.minVolume || '500000', 10);
    
    if (!['oi200', 'gainers50'].includes(universe)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid universe parameter. Must be "oi200" or "gainers50"' 
        }),
      };
    }

    // Initialize MEXC client
    const mexcClient = new MexcClient(
      env.MEXC_API_KEY,
      env.MEXC_API_SECRET,
      env.MEXC_SANDBOX
    );

    // Fetch filtered universe
    const symbols = await mexcClient.fetchUniverse(
      universe as 'oi200' | 'gainers50',
      minVolume
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        symbols,
        universe,
        minVolume,
        count: symbols.length,
        timestamp: Date.now(),
      }),
    };
  } catch (error) {
    console.error('Error in symbols function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };