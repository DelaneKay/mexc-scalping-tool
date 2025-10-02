import React from 'react';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { getLeverageColor } from '@mexc-scalping/shared';

interface LeverageSuggestionProps {
  leverage: number;
  atrPercent: number;
}

export const LeverageSuggestion: React.FC<LeverageSuggestionProps> = ({ 
  leverage, 
  atrPercent 
}) => {
  const getRiskLevel = (leverage: number, atrPercent: number) => {
    if (leverage <= 5 || atrPercent > 1.2) {
      return {
        level: 'HIGH',
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
      };
    } else if (leverage <= 7 || atrPercent > 0.8) {
      return {
        level: 'MEDIUM',
        icon: Shield,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
      };
    } else {
      return {
        level: 'LOW',
        icon: TrendingUp,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
      };
    }
  };

  const risk = getRiskLevel(leverage, atrPercent);
  const Icon = risk.icon;

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <div>Suggested Leverage: {leverage}x</div>
      <div>Current ATR: {atrPercent.toFixed(2)}%</div>
      <div>Risk Level: {risk.level}</div>
      <div className="text-gray-400 mt-2">
        Based on current volatility. Lower leverage for higher volatility.
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${risk.bgColor} ${risk.color} ${risk.borderColor} cursor-help`}>
        <Icon className="w-3 h-3" />
        <span className="font-mono-tabular">{leverage}x</span>
      </div>
    </Tooltip>
  );
};