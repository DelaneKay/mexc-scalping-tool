import React from 'react';
import { motion } from 'framer-motion';
import { X, Save, Bell, BellOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SettingsPanel: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    setSettingsOpen,
    notificationsEnabled,
    setNotificationsEnabled 
  } = useAppStore();

  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    setSettingsOpen(false);
  };

  const handleClose = () => {
    setLocalSettings(settings); // Reset to original
    setSettingsOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button
              onClick={handleClose}
              className="btn-ghost p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Notifications */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Enable Notifications
                    </label>
                    <p className="text-xs text-gray-400">
                      Receive alerts for significant market events
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      notificationsEnabled 
                        ? 'bg-crypto-accent text-white' 
                        : 'bg-crypto-border text-gray-400'
                    }`}
                  >
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    value={localSettings.discordWebhookUrl || ''}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      discordWebhookUrl: e.target.value
                    })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Optional: Receive notifications in Discord
                  </p>
                </div>
              </div>
            </div>

            {/* Thresholds */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Alert Thresholds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Burst Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.burstThreshold}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      burstThreshold: parseInt(e.target.value)
                    })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Volatility Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localSettings.volatilityThreshold}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      volatilityThreshold: parseFloat(e.target.value)
                    })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Volume Surge Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localSettings.volumeSurgeThreshold}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      volumeSurgeThreshold: parseFloat(e.target.value)
                    })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min 24h Volume (USDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={localSettings.minVolume24h}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      minVolume24h: parseInt(e.target.value)
                    })}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-crypto-border">
              <button
                onClick={handleClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};