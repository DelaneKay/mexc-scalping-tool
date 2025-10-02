import React from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSymbolDetail } from '../hooks/useApi';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { StateBadge } from './StateBadge';
import { LeverageSuggestion } from './LeverageSuggestion';
import { formatNumber, formatPercent } from '@mexc-scalping/shared';

export const SymbolDrawer: React.FC = () => {
  const { selectedSymbol, setSelectedSymbol, filters } = useAppStore();
  
  const detailQuery = useSymbolDetail(
    selectedSymbol || '', 
    filters.timeframe
  );

  const handleClose = () => {
    setSelectedSymbol(null);
  };

  if (!selectedSymbol) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
      onClick={handleClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-card h-full w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedSymbol.replace('USDT', '')}
                <span className="text-gray-400 text-lg">/USDT</span>
              </h2>
              <p className="text-sm text-gray-400">
                Detailed analysis for {filters.timeframe} timeframe
              </p>
            </div>
            <button
              onClick={handleClose}
              className="btn-ghost p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {detailQuery.isLoading && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {detailQuery.isError && (
            <ErrorMessage
              title="Failed to load symbol details"
              message={detailQuery.error?.message || 'Unknown error'}
              onRetry={() => detailQuery.refetch()}
            />
          )}

          {detailQuery.data && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-crypto-accent" />
                    <span className="text-sm font-medium text-gray-300">Burst Score</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {detailQuery.data.burst.burstScore.toFixed(1)}
                  </div>
                  <StateBadge state={detailQuery.data.burst.state} />
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-300">Volatility</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {detailQuery.data.volatility[detailQuery.data.volatility.length - 1]?.volatilityScore.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">
                    ATR: {formatPercent(detailQuery.data.indicators[detailQuery.data.indicators.length - 1]?.atrPercent / 100 || 0)}
                  </div>
                </div>
              </div>

              {/* Symbol Info */}
              <div className="glass-card p-4">
                <h3 className="text-lg font-medium text-white mb-4">Market Data</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Last Price:</span>
                    <span className="ml-2 font-mono text-white">
                      ${formatNumber(detailQuery.data.symbolInfo.lastPrice, 4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h Change:</span>
                    <span className={`ml-2 font-mono ${
                      detailQuery.data.symbolInfo.priceChangePercent24h >= 0 
                        ? 'text-crypto-success' 
                        : 'text-crypto-danger'
                    }`}>
                      {detailQuery.data.symbolInfo.priceChangePercent24h >= 0 ? '+' : ''}
                      {formatPercent(detailQuery.data.symbolInfo.priceChangePercent24h / 100)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h Volume:</span>
                    <span className="ml-2 font-mono text-white">
                      ${formatNumber(detailQuery.data.symbolInfo.volume24h, 0, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Volume Surge:</span>
                    <span className="ml-2 font-mono text-white">
                      {formatNumber(detailQuery.data.volatility[detailQuery.data.volatility.length - 1]?.volumeSurge || 0, 2)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="glass-card p-4">
                <h3 className="text-lg font-medium text-white mb-4">Technical Indicators</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {detailQuery.data.indicators.length > 0 && (
                    <>
                      <div>
                        <span className="text-gray-400">RSI (14):</span>
                        <span className="ml-2 font-mono text-white">
                          {detailQuery.data.indicators[detailQuery.data.indicators.length - 1].rsi14.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">ADX (14):</span>
                        <span className="ml-2 font-mono text-white">
                          {detailQuery.data.indicators[detailQuery.data.indicators.length - 1].adx14.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">EMA 20:</span>
                        <span className="ml-2 font-mono text-white">
                          ${formatNumber(detailQuery.data.indicators[detailQuery.data.indicators.length - 1].ema20, 4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">EMA 50:</span>
                        <span className="ml-2 font-mono text-white">
                          ${formatNumber(detailQuery.data.indicators[detailQuery.data.indicators.length - 1].ema50, 4)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Leverage Suggestion */}
              <div className="glass-card p-4">
                <h3 className="text-lg font-medium text-white mb-4">Risk Assessment</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Suggested Leverage</p>
                    <LeverageSuggestion
                      leverage={detailQuery.data.burst.leverageSuggestion}
                      atrPercent={detailQuery.data.indicators[detailQuery.data.indicators.length - 1]?.atrPercent || 0}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Based on current volatility</p>
                    <p className="text-xs text-amber-400 mt-1">
                      ⚠️ This is for informational purposes only
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-crypto-accent" />
                  <h3 className="text-lg font-medium text-white">Price Chart</h3>
                </div>
                <div className="h-64 bg-crypto-darker rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization coming soon</p>
                    <p className="text-xs">Last {detailQuery.data.klines.length} candles loaded</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};