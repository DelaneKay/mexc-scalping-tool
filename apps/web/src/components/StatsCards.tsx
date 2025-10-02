import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Activity, Target } from 'lucide-react';
import { ScanResult } from '@mexc-scalping/shared';
import { LoadingSpinner } from './LoadingSpinner';

interface StatsCardsProps {
  results: ScanResult[];
  filteredCount: number;
  totalSymbols: number;
  isLoading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  results,
  filteredCount,
  totalSymbols,
  isLoading,
}) => {
  const stats = React.useMemo(() => {
    const aboutToBurst = results.filter(r => r.burst.state === 'ABOUT_TO_BURST').length;
    const volatile = results.filter(r => r.burst.state === 'VOLATILE').length;
    const avgBurstScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.burst.burstScore, 0) / results.length 
      : 0;
    const highVolumeSurge = results.filter(r => r.volatility.volumeSurge > 3).length;

    return {
      aboutToBurst,
      volatile,
      avgBurstScore,
      highVolumeSurge,
    };
  }, [results]);

  const cards = [
    {
      title: 'About to Burst',
      value: stats.aboutToBurst,
      icon: Target,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Volatile',
      value: stats.volatile,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Avg Burst Score',
      value: stats.avgBurstScore.toFixed(1),
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'High Volume Surge',
      value: stats.highVolumeSurge,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`glass-card p-4 ${card.bgColor} border ${card.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{card.title}</p>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <motion.p
                    key={card.value}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`text-2xl font-bold ${card.color}`}
                  >
                    {card.value}
                  </motion.p>
                )}
              </div>
            </div>
            <card.icon className={`w-8 h-8 ${card.color} opacity-60`} />
          </div>
        </motion.div>
      ))}
      
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4 md:col-span-2 lg:col-span-4"
      >
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {filteredCount} of {results.length} results from {totalSymbols} total symbols
          </span>
          {isLoading && (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Refreshing data...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};