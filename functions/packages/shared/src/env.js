"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DISCORD_WEBHOOK_URL: zod_1.z.string().url().optional(),
    MEXC_API_KEY: zod_1.z.string().optional(),
    MEXC_API_SECRET: zod_1.z.string().optional(),
    MEXC_SANDBOX: zod_1.z.string().transform(val => val === 'true').default('false'),
    DEFAULT_TIMEFRAME: zod_1.z.enum(['1m', '5m']).default('1m'),
    DEFAULT_UNIVERSE: zod_1.z.enum(['oi200', 'gainers50']).default('oi200'),
    MIN_VOLUME_24H: zod_1.z.string().transform(val => parseInt(val, 10)).default('500000'),
    REFRESH_INTERVAL: zod_1.z.string().transform(val => parseInt(val, 10)).default('10000'),
    BURST_THRESHOLD: zod_1.z.string().transform(val => parseInt(val, 10)).default('75'),
    VOLATILITY_THRESHOLD: zod_1.z.string().transform(val => parseFloat(val)).default('1.5'),
    VOLUME_SURGE_THRESHOLD: zod_1.z.string().transform(val => parseFloat(val)).default('0.6'),
});
function validateEnv(env) {
    try {
        return exports.envSchema.parse(env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
        }
        throw error;
    }
}
exports.defaultConfig = {
    featureWindows: {
        rsi: 14,
        atr: 14,
        adx: 14,
        ema: 20,
        donchian: 20,
        volume: 20,
    },
    leverageMap: {
        0.5: 10,
        0.8: 7,
        1.2: 6,
        Infinity: 5,
    },
    burstWeights: {
        volatilityZScore: 0.35,
        volumeSurge: 0.30,
        breakoutProximity: 0.20,
        momentum: 0.15,
        trendQuality: 0.10, // optional
    },
    stateThresholds: {
        aboutToBurst: {
            burstScore: 75,
            volumeSurgeMin: 0.6,
            breakoutProximityMin: 0.6,
            volatilityTrendBars: 3,
        },
        volatile: {
            volatilityZScore: 1.5,
            atrPercentMin: 1.0,
        },
        losingVolatility: {
            volatilityDropBars: 5,
            volatilityDropThreshold: 0.8,
            adxDropMin: 10,
            volumeSlopeBars: 3,
        },
    },
};
