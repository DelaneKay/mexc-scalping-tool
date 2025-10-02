import React from 'react';
import { ScanTable } from './ScanTable';
import { FilterBar } from './FilterBar';
import { StatsCards } from './StatsCards';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { useRealTimeData } from '../hooks/useApi';
import { useFilteredResults } from '../store/useAppStore';

export const Dashboard: React.FC = () => {
  const scanQuery = useRealTimeData();
  const filteredResults = useFilteredResults(scanQuery.data?.results || []);

  if (scanQuery.isLoading && !scanQuery.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (scanQuery.isError) {
    return (
      <ErrorMessage 
        title="Failed to load data"
        message={scanQuery.error?.message || 'Unknown error occurred'}
        onRetry={() => scanQuery.refetch()}
      />
    );
  }

  const results = scanQuery.data?.results || [];
  const totalSymbols = scanQuery.data?.totalSymbols || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards 
        results={results}
        filteredCount={filteredResults.length}
        totalSymbols={totalSymbols}
        isLoading={scanQuery.isFetching}
      />

      {/* Filter Bar */}
      <FilterBar resultCount={filteredResults.length} />

      {/* Main Table */}
      <div className="glass-card">
        <div className="p-4 border-b border-crypto-border">
          <h2 className="text-lg font-semibold text-white">
            Market Scanner
          </h2>
          <p className="text-sm text-gray-400">
            Real-time volatility and burst analysis
          </p>
        </div>
        
        <ScanTable 
          results={filteredResults}
          isLoading={scanQuery.isFetching}
        />
      </div>
    </div>
  );
};