import React from 'react';
import { 
  Settings, 
  Search, 
  Clock, 
  TrendingUp, 
  Wifi, 
  WifiOff,
  RefreshCw 
} from 'lucide-react';
import { useAppStore, useAppActions } from '../store/useAppStore';
import { formatTimeframe } from '@mexc-scalping/shared';

export const Header: React.FC = () => {
  const { 
    filters, 
    wsConnected, 
    lastUpdate, 
    performanceMetrics,
    setSettingsOpen 
  } = useAppStore();
  
  const { 
    toggleTimeframe, 
    toggleUniverse, 
    updateSearchQuery 
  } = useAppActions();

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <header className="sticky top-0 z-50 bg-crypto-card/80 backdrop-blur-sm border-b border-crypto-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">
                MEXC Scalping Tool
              </h1>
              <p className="text-xs text-gray-400">
                Real-time volatility detection
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            {/* Timeframe Toggle */}
            <button
              onClick={toggleTimeframe}
              className="btn-secondary flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {formatTimeframe(filters.timeframe)}
            </button>

            {/* Universe Filter */}
            <button
              onClick={toggleUniverse}
              className="btn-secondary"
            >
              {filters.universe === 'oi200' ? 'Top 200 OI' : 'Top 50 Gainers'}
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search symbols..."
                value={filters.searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                className="input pl-10 w-48"
              />
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              {wsConnected ? (
                <div className="flex items-center gap-1 text-crypto-success">
                  <Wifi className="w-4 h-4" />
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-crypto-danger">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              )}
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <RefreshCw className="w-4 h-4" />
              <span>{formatLastUpdate(lastUpdate)}</span>
            </div>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="btn-ghost"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceMetrics.apiResponseTime > 0 && (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>API: {performanceMetrics.apiResponseTime}ms</span>
            {wsConnected && (
              <span>WS: {performanceMetrics.wsLatency}ms</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};