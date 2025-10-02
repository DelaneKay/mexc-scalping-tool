import React from 'react';
import { Filter, X } from 'lucide-react';
import { useAppStore, useAppActions } from '../store/useAppStore';
import { SignalState } from '@mexc-scalping/shared';

interface FilterBarProps {
  resultCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({ resultCount }) => {
  const { filters } = useAppStore();
  const { updateFilters, resetFilters } = useAppActions();

  const stateOptions: { value: SignalState | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All States' },
    { value: 'ABOUT_TO_BURST', label: 'About to Burst' },
    { value: 'VOLATILE', label: 'Volatile' },
    { value: 'LOSING_VOL', label: 'Losing Volume' },
    { value: 'NORMAL', label: 'Normal' },
  ];

  const hasActiveFilters = 
    filters.stateFilter !== 'ALL' ||
    filters.minBurstScore > 0 ||
    filters.minVolatilityScore > 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-white">Filters</h3>
          <span className="text-sm text-gray-400">({resultCount} results)</span>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn-ghost text-sm flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* State Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Signal State
          </label>
          <select
            value={filters.stateFilter}
            onChange={(e) => updateFilters({ stateFilter: e.target.value as SignalState | 'ALL' })}
            className="input w-full"
          >
            {stateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Min Burst Score */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Min Burst Score
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minBurstScore}
            onChange={(e) => updateFilters({ minBurstScore: parseInt(e.target.value) })}
            className="w-full h-2 bg-crypto-border rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span className="font-medium text-white">{filters.minBurstScore}</span>
            <span>100</span>
          </div>
        </div>

        {/* Min Volatility Score */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Min Volatility Score
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minVolatilityScore}
            onChange={(e) => updateFilters({ minVolatilityScore: parseInt(e.target.value) })}
            className="w-full h-2 bg-crypto-border rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span className="font-medium text-white">{filters.minVolatilityScore}</span>
            <span>100</span>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              updateFilters({ 
                sortBy: sortBy as any, 
                sortOrder: sortOrder as 'asc' | 'desc' 
              });
            }}
            className="input w-full"
          >
            <option value="burstScore_desc">Burst Score (High to Low)</option>
            <option value="burstScore_asc">Burst Score (Low to High)</option>
            <option value="volatilityScore_desc">Volatility (High to Low)</option>
            <option value="volatilityScore_asc">Volatility (Low to High)</option>
            <option value="volumeSurge_desc">Volume Surge (High to Low)</option>
            <option value="volumeSurge_asc">Volume Surge (Low to High)</option>
            <option value="symbol_asc">Symbol (A to Z)</option>
            <option value="symbol_desc">Symbol (Z to A)</option>
          </select>
        </div>
      </div>
    </div>
  );
};