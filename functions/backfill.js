"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const mexc_client_1 = require("./src/mexc-client");
const data_processor_1 = require("./src/data-processor");
const shared_1 = require("./packages/shared/src");
const handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const startTime = Date.now();
    console.log('Starting backfill job at:', new Date().toISOString());
    try {
        // Validate environment
        const env = (0, shared_1.validateEnv)(process.env);
        // Initialize clients
        const mexcClient = new mexc_client_1.MexcClient(env.MEXC_API_KEY, env.MEXC_API_SECRET, env.MEXC_SANDBOX);
        const dataProcessor = new data_processor_1.DataProcessor();
        const results = {
            timestamp: Date.now(),
            duration: 0,
            processed: {
                symbols: 0,
                klines: 0,
                errors: 0,
            },
            cache: {
                cleared: 0,
                remaining: 0,
            },
            status: 'success',
        };
        // Clear expired cache entries
        const cacheStatsBefore = dataProcessor.getCacheStats();
        dataProcessor.clearExpiredCache();
        const cacheStatsAfter = dataProcessor.getCacheStats();
        results.cache.cleared = cacheStatsBefore.size - cacheStatsAfter.size;
        results.cache.remaining = cacheStatsAfter.size;
        // Fetch current universe for both filters
        const [oi200Symbols, gainers50Symbols] = await Promise.all([
            mexcClient.fetchUniverse('oi200', 500000),
            mexcClient.fetchUniverse('gainers50', 500000),
        ]);
        // Combine and deduplicate symbols
        const allSymbols = Array.from(new Set([
            ...oi200Symbols.map(s => s.symbol),
            ...gainers50Symbols.map(s => s.symbol),
        ]));
        console.log(`Processing ${allSymbols.length} symbols for backfill`);
        // Process symbols in batches to avoid timeouts
        const batchSize = 20;
        const timeframes = ['1m', '5m'];
        for (let i = 0; i < allSymbols.length; i += batchSize) {
            const batch = allSymbols.slice(i, i + batchSize);
            for (const timeframe of timeframes) {
                try {
                    // Fetch klines for batch
                    const klinesData = await mexcClient.fetchMultipleKlines(batch, timeframe, 200);
                    // Cache the data
                    for (const [symbol, klines] of Object.entries(klinesData)) {
                        if (klines.length > 0) {
                            dataProcessor.setCachedKlines(`${symbol}_${timeframe}`, klines);
                            results.processed.klines += klines.length;
                        }
                    }
                    results.processed.symbols += batch.length;
                }
                catch (error) {
                    console.error(`Error processing batch ${i}-${i + batchSize} for ${timeframe}:`, error);
                    results.processed.errors++;
                }
            }
            // Small delay between batches to respect rate limits
            if (i + batchSize < allSymbols.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        // Determine final status
        if (results.processed.errors === 0) {
            results.status = 'success';
        }
        else if (results.processed.symbols > results.processed.errors) {
            results.status = 'partial';
        }
        else {
            results.status = 'failed';
        }
        results.duration = Date.now() - startTime;
        console.log('Backfill job completed:', results);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(results),
        };
    }
    catch (error) {
        console.error('Backfill job failed:', error);
        const results = {
            timestamp: Date.now(),
            duration: Date.now() - startTime,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify(results),
        };
    }
};
exports.handler = handler;
