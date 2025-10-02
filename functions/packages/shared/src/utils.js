"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.RateLimiter = void 0;
exports.sleep = sleep;
exports.exponentialBackoff = exponentialBackoff;
exports.formatNumber = formatNumber;
exports.formatPercent = formatPercent;
exports.formatCurrency = formatCurrency;
exports.formatTimeframe = formatTimeframe;
exports.getStateBadgeColor = getStateBadgeColor;
exports.getLeverageColor = getLeverageColor;
exports.debounce = debounce;
exports.throttle = throttle;
exports.retry = retry;
exports.safeJsonParse = safeJsonParse;
exports.clamp = clamp;
exports.generateId = generateId;
exports.isNumeric = isNumeric;
exports.deepClone = deepClone;
exports.percentageChange = percentageChange;
exports.timeAgo = timeAgo;
exports.isValidSymbol = isValidSymbol;
exports.getBaseAsset = getBaseAsset;
exports.createMexcWsUrl = createMexcWsUrl;
exports.validateRequiredEnvVars = validateRequiredEnvVars;
/**
 * Utility functions for the MEXC scalping tool
 */
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Exponential backoff with jitter
 */
function exponentialBackoff(attempt, baseDelay = 1000, maxDelay = 30000, jitter = true) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
}
/**
 * Rate limiter class
 */
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }
    async waitIfNeeded() {
        const now = Date.now();
        // Remove old requests outside the window
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.windowMs - (now - oldestRequest);
            if (waitTime > 0) {
                await sleep(waitTime);
            }
        }
        this.requests.push(now);
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Circuit breaker for handling failures
 */
class CircuitBreaker {
    constructor(failureThreshold = 5, recoveryTimeMs = 60000) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeMs = recoveryTimeMs;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'CLOSED';
    }
    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
                this.state = 'HALF_OPEN';
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
        }
    }
    getState() {
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Format numbers for display
 */
function formatNumber(value, decimals = 2, compact = false) {
    if (compact && Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    }
    if (compact && Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(decimals);
}
/**
 * Format percentage
 */
function formatPercent(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
}
/**
 * Format currency
 */
function formatCurrency(value, currency = 'USD', compact = false) {
    if (compact) {
        return `$${formatNumber(value, 2, true)}`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(value);
}
/**
 * Format timeframe for display
 */
function formatTimeframe(tf) {
    const map = {
        '1m': '1 Minute',
        '5m': '5 Minutes',
    };
    return map[tf] || tf;
}
/**
 * Get state badge color
 */
function getStateBadgeColor(state) {
    const colors = {
        'ABOUT_TO_BURST': 'bg-amber-500 text-amber-900',
        'VOLATILE': 'bg-purple-500 text-purple-900',
        'LOSING_VOL': 'bg-blue-500 text-blue-900',
        'NORMAL': 'bg-gray-500 text-gray-900',
    };
    return colors[state] || colors.NORMAL;
}
/**
 * Get leverage color based on risk
 */
function getLeverageColor(leverage) {
    if (leverage <= 5)
        return 'text-red-500';
    if (leverage <= 7)
        return 'text-yellow-500';
    return 'text-green-500';
}
/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
/**
 * Retry with exponential backoff
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts - 1) {
                throw lastError;
            }
            const delay = exponentialBackoff(attempt, baseDelay);
            await sleep(delay);
        }
    }
    throw lastError;
}
/**
 * Safe JSON parse
 */
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Generate unique ID
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
/**
 * Check if value is numeric
 */
function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}
/**
 * Deep clone object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
}
/**
 * Calculate percentage change
 */
function percentageChange(oldValue, newValue) {
    if (oldValue === 0)
        return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}
/**
 * Time ago formatter
 */
function timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ago`;
    if (hours > 0)
        return `${hours}h ago`;
    if (minutes > 0)
        return `${minutes}m ago`;
    return `${seconds}s ago`;
}
/**
 * Validate symbol format
 */
function isValidSymbol(symbol) {
    return /^[A-Z0-9]+USDT$/.test(symbol);
}
/**
 * Extract base asset from symbol
 */
function getBaseAsset(symbol) {
    return symbol.replace(/USDT$/, '');
}
/**
 * Create WebSocket URL for MEXC
 */
function createMexcWsUrl(streams) {
    const baseUrl = 'wss://contract.mexc.com/ws';
    return `${baseUrl}?streams=${streams.join('/')}`;
}
/**
 * Validate environment variables
 */
function validateRequiredEnvVars(vars) {
    const missing = vars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
