import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const RiskBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border-b border-amber-500/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">
            Signals only. No account connection. Leverage suggestion is informational.
          </span>
        </div>
      </div>
    </div>
  );
};