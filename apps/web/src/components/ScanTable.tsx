import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp,
  Info 
} from 'lucide-react';
import { ScanResult } from '@mexc-scalping/shared';
import { useAppStore, useAppActions } from '../store/useAppStore';
import { StateBadge } from './StateBadge';
import { DeltaChip } from './DeltaChip';
import { LeverageSuggestion } from './LeverageSuggestion';
import { Tooltip } from './Tooltip';
import { formatNumber, formatPercent } from '@mexc-scalping/shared';

interface ScanTableProps {
  results: ScanResult[];
  isLoading: boolean;
}

export const ScanTable: React.FC<ScanTableProps> = ({ results, isLoading }) => {
  const { filters, setSelectedSymbol, previousResults } = useAppStore();
  const { updateSorting } = useAppActions();
  
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  // Create previous results map for delta calculations
  const previousMap = useMemo(() => {
    return new Map(previousResults.map(r => [r.symbol, r]));
  }, [previousResults]);
  
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const columns = [
    {
      key: 'symbol',
      label: 'Symbol',
      sortable: true,
      width: 'w-32',
    },
    {
      key: 'burstScore',
      label: 'Burst Score',
      sortable: true,
      width: 'w-28',
    },
    {
      key: 'volatilityScore',
      label: 'Volatility',
      sortable: true,
      width: 'w-28',
    },
    {
      key: 'volumeSurge',
      label: 'Volume Surge',
      sortable: true,
      width: 'w-32',
    },
    {
      key: 'atrPercent',
      label: 'ATR%',
      sortable: false,
      width: 'w-24',
    },
    {
      key: 'state',
      label: 'State',
      sortable: false,
      width: 'w-32',
    },
    {
      key: 'leverage',
      label: 'Leverage',
      sortable: false,
      width: 'w-28',
    },
    {
      key: 'lastUpdate',
      label: 'Updated',
      sortable: false,
      width: 'w-24',
    },
  ];

  const getSortIcon = (columnKey: string) => {
    if (filters.sortBy !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-500" />;
    }
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-crypto-accent" />
      : <ArrowDown className="w-4 h-4 text-crypto-accent" />;
  };

  const formatLastUpdate = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const getRowAnimation = (result: ScanResult) => {
    const previous = previousMap.get(result.symbol);
    if (!previous) return {};
    
    // Check if state changed
    if (previous.burst.state !== result.burst.state) {
      return {
        initial: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
        animate: { backgroundColor: 'transparent' },
        transition: { duration: 2 },
      };
    }
    
    return {};
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No results found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 right-4 z-10 mt-4"
          >
            <div className="bg-crypto-accent/20 text-crypto-accent px-3 py-1 rounded-full text-xs font-medium">
              Updating...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Header */}
      <div className="table-header sticky top-0 z-20">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`table-cell ${column.width} ${
                column.sortable ? 'cursor-pointer hover:bg-white/5' : ''
              }`}
              onClick={() => column.sortable && updateSorting(column.key as any)}
            >
              <div className="flex items-center gap-2">
                <span>{column.label}</span>
                {column.sortable && getSortIcon(column.key)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const result = results[virtualItem.index];
            const previous = previousMap.get(result.symbol);
            
            return (
              <motion.div
                key={result.symbol}
                className="table-row absolute top-0 left-0 w-full cursor-pointer"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => setSelectedSymbol(result.symbol)}
                {...getRowAnimation(result)}
              >
                <div className="flex items-center h-full">
                  {/* Symbol */}
                  <div className="table-cell w-32">
                    <div className="font-mono font-medium text-white">
                      {result.symbol.replace('USDT', '')}
                      <span className="text-gray-500 text-xs">/USDT</span>
                    </div>
                  </div>

                  {/* Burst Score */}
                  <div className="table-cell w-28">
                    <div className="flex items-center gap-2">
                      <motion.span
                        key={result.burst.burstScore}
                        initial={{ scale: 1.1, color: '#3b82f6' }}
                        animate={{ scale: 1, color: 'inherit' }}
                        transition={{ duration: 0.3 }}
                        className="font-mono-tabular font-medium"
                      >
                        {result.burst.burstScore.toFixed(1)}
                      </motion.span>
                      {previous && (
                        <DeltaChip
                          value={result.burst.burstScore - previous.burst.burstScore}
                          suffix=""
                        />
                      )}
                    </div>
                  </div>

                  {/* Volatility Score */}
                  <div className="table-cell w-28">
                    <div className="flex items-center gap-2">
                      <motion.span
                        key={result.volatility.volatilityScore}
                        initial={{ scale: 1.1, color: '#a855f7' }}
                        animate={{ scale: 1, color: 'inherit' }}
                        transition={{ duration: 0.3 }}
                        className="font-mono-tabular"
                      >
                        {result.volatility.volatilityScore.toFixed(1)}
                      </motion.span>
                      {previous && (
                        <DeltaChip
                          value={result.volatility.volatilityScore - previous.volatility.volatilityScore}
                          suffix=""
                        />
                      )}
                    </div>
                  </div>

                  {/* Volume Surge */}
                  <div className="table-cell w-32">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular">
                        {formatNumber(result.volatility.volumeSurge, 2)}x
                      </span>
                      <Tooltip content={`Volume: ${formatNumber(result.symbolInfo.volume24h, 0, true)} USDT`}>
                        <Info className="w-3 h-3 text-gray-500" />
                      </Tooltip>
                    </div>
                  </div>

                  {/* ATR% */}
                  <div className="table-cell w-24">
                    <span className="font-mono-tabular">
                      {formatPercent(result.indicators.atrPercent / 100, 2)}
                    </span>
                  </div>

                  {/* State */}
                  <div className="table-cell w-32">
                    <StateBadge state={result.burst.state} />
                  </div>

                  {/* Leverage Suggestion */}
                  <div className="table-cell w-28">
                    <LeverageSuggestion 
                      leverage={result.burst.leverageSuggestion}
                      atrPercent={result.indicators.atrPercent}
                    />
                  </div>

                  {/* Last Update */}
                  <div className="table-cell w-24">
                    <span className="text-xs text-gray-500">
                      {formatLastUpdate(result.lastUpdate)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};