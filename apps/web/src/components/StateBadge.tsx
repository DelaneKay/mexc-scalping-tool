import React from 'react';
import { motion } from 'framer-motion';
import { SignalState } from '@mexc-scalping/shared';

interface StateBadgeProps {
  state: SignalState;
  showIcon?: boolean;
}

export const StateBadge: React.FC<StateBadgeProps> = ({ state, showIcon = true }) => {
  const getStateConfig = (state: SignalState) => {
    switch (state) {
      case 'ABOUT_TO_BURST':
        return {
          label: 'About to Burst',
          className: 'badge-burst',
          icon: '🚀',
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-500/30',
        };
      case 'VOLATILE':
        return {
          label: 'Volatile',
          className: 'badge-volatile',
          icon: '⚡',
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30',
        };
      case 'LOSING_VOL':
        return {
          label: 'Losing Vol',
          className: 'badge-losing',
          icon: '📉',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
        };
      case 'NORMAL':
      default:
        return {
          label: 'Normal',
          className: 'badge-normal',
          icon: '📊',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
        };
    }
  };

  const config = getStateConfig(state);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}
    >
      {showIcon && (
        <span className="text-xs">{config.icon}</span>
      )}
      <span>{config.label}</span>
    </motion.div>
  );
};