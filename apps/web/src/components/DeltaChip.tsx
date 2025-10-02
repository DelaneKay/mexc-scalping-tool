import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DeltaChipProps {
  value: number;
  suffix?: string;
  threshold?: number;
}

export const DeltaChip: React.FC<DeltaChipProps> = ({ 
  value, 
  suffix = '', 
  threshold = 0.1 
}) => {
  // Don't show chip for very small changes
  if (Math.abs(value) < threshold) {
    return null;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const getChipConfig = () => {
    if (isPositive) {
      return {
        className: 'delta-positive',
        icon: TrendingUp,
        prefix: '+',
      };
    } else if (isNegative) {
      return {
        className: 'delta-negative',
        icon: TrendingDown,
        prefix: '',
      };
    } else {
      return {
        className: 'delta-neutral',
        icon: Minus,
        prefix: '',
      };
    }
  };

  const config = getChipConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30,
        duration: 0.3 
      }}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      <span className="font-mono-tabular">
        Δ{config.prefix}{Math.abs(value).toFixed(1)}{suffix}
      </span>
    </motion.div>
  );
};