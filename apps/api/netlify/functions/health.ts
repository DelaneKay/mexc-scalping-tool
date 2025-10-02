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

  const startTime = Date.now();

  try {
    // Validate environment
    const env = validateEnv(process.env);
    
    // Initialize MEXC client
    const mexcClient = new MexcClient(
      env.MEXC_API_KEY,
      env.MEXC_API_SECRET,
      env.MEXC_SANDBOX
    );

    // Perform health checks
    const [exchangeHealth, exchangeInfo] = await Promise.all([
      mexcClient.healthCheck(),
      mexcClient.getExchangeInfo(),
    ]);

    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: Date.now(),
      responseTime,
      version: '1.0.0',
      environment: env.NODE_ENV,
      exchange: {
        name: exchangeInfo.name,
        status: exchangeHealth.status,
        circuitBreaker: exchangeInfo.circuitBreakerState,
        rateLimit: exchangeInfo.rateLimit,
      },
      services: {
        api: 'healthy',
        mexc: exchangeHealth.status,
        discord: env.DISCORD_WEBHOOK_URL ? 'configured' : 'not_configured',
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthStatus),
    };
  } catch (error) {
    console.error('Health check failed:', error);
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: Date.now(),
      responseTime,
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        api: 'degraded',
        mexc: 'unknown',
        discord: 'unknown',
      },
    };

    return {
      statusCode: 503,
      headers,
      body: JSON.stringify(healthStatus),
    };
  }
};

exports.handler = handler;