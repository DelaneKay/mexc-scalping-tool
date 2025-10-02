import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Timeframe, UniverseFilter, ScanResult, SignalState } from '@mexc-scalping/shared';

interface AppSettings {
  defaultTimeframe: Timeframe;
  defaultUniverse: UniverseFilter;
  minVolume24h: number;
  refreshInterval: number;
  burstThreshold: number;
  volatilityThreshold: number;
  volumeSurgeThreshold: number;
  discordWebhookUrl?: string;
  featureWindows: {
    rsi: number;
    atr: number;
    adx: number;
    ema: number;
    donchian: number;
    volume: number;
  };
}

interface AppFilters {
  timeframe: Timeframe;
  universe: UniverseFilter;
  searchQuery: string;
  stateFilter: SignalState | 'ALL';
  minBurstScore: number;
  minVolatilityScore: number;
  sortBy: 'burstScore' | 'volatilityScore' | 'volumeSurge' | 'symbol';
  sortOrder: 'asc' | 'desc';
}

interface AppState {
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Filters
  filters: AppFilters;
  updateFilters: (filters: Partial<AppFilters>) => void;
  
  // UI State
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
  
  // Real-time data
  lastUpdate: number;
  setLastUpdate: (timestamp: number) => void;
  
  previousResults: ScanResult[];
  setPreviousResults: (results: ScanResult[]) => void;
  
  // WebSocket connection state
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  
  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  // Performance tracking
  performanceMetrics: {
    apiResponseTime: number;
    wsLatency: number;
    lastRefresh: number;
  };
  updatePerformanceMetrics: (metrics: Partial<AppState['performanceMetrics']>) => void;
}

const defaultSettings: AppSettings = {
  defaultTimeframe: '1m',
  defaultUniverse: 'oi200',
  minVolume24h: 500000,
  refreshInterval: 10000,
  burstThreshold: 75,
  volatilityThreshold: 1.5,
  volumeSurgeThreshold: 0.6,
  featureWindows: {
    rsi: 14,
    atr: 14,
    adx: 14,
    ema: 20,
    donchian: 20,
    volume: 20,
  },
};

const defaultFilters: AppFilters = {
  timeframe: '1m',
  universe: 'oi200',
  searchQuery: '',
  stateFilter: 'ALL',
  minBurstScore: 0,
  minVolatilityScore: 0,
  sortBy: 'burstScore',
  sortOrder: 'desc',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // Filters
      filters: defaultFilters,
      updateFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      
      // UI State
      isSettingsOpen: false,
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      
      selectedSymbol: null,
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      
      // Real-time data
      lastUpdate: 0,
      setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),
      
      previousResults: [],
      setPreviousResults: (results) => set({ previousResults: results }),
      
      // WebSocket connection state
      wsConnected: false,
      setWsConnected: (connected) => set({ wsConnected: connected }),
      
      // Notifications
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      
      // Performance tracking
      performanceMetrics: {
        apiResponseTime: 0,
        wsLatency: 0,
        lastRefresh: 0,
      },
      updatePerformanceMetrics: (metrics) =>
        set((state) => ({
          performanceMetrics: { ...state.performanceMetrics, ...metrics },
        })),
    }),
    {
      name: 'mexc-scalping-store',
      partialize: (state) => ({
        settings: state.settings,
        filters: {
          timeframe: state.filters.timeframe,
          universe: state.filters.universe,
          sortBy: state.filters.sortBy,
          sortOrder: state.filters.sortOrder,
        },
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);

// Selectors for computed values
export const useFilteredResults = (results: ScanResult[]) => {
  const { filters } = useAppStore();
  
  return results
    .filter((result) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!result.symbol.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // State filter
      if (filters.stateFilter !== 'ALL' && result.burst.state !== filters.stateFilter) {
        return false;
      }
      
      // Score filters
      if (result.burst.burstScore < filters.minBurstScore) {
        return false;
      }
      
      if (result.volatility.volatilityScore < filters.minVolatilityScore) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const { sortBy, sortOrder } = filters;
      let aValue: number;
      let bValue: number;
      
      switch (sortBy) {
        case 'burstScore':
          aValue = a.burst.burstScore;
          bValue = b.burst.burstScore;
          break;
        case 'volatilityScore':
          aValue = a.volatility.volatilityScore;
          bValue = b.volatility.volatilityScore;
          break;
        case 'volumeSurge':
          aValue = a.volatility.volumeSurge;
          bValue = b.volatility.volumeSurge;
          break;
        case 'symbol':
          return sortOrder === 'asc' 
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        default:
          aValue = a.burst.burstScore;
          bValue = b.burst.burstScore;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
};

// Action creators for common operations
export const useAppActions = () => {
  const store = useAppStore();
  
  return {
    resetFilters: () => store.updateFilters(defaultFilters),
    resetSettings: () => store.updateSettings(defaultSettings),
    
    toggleTimeframe: () => {
      const currentTf = store.filters.timeframe;
      store.updateFilters({ timeframe: currentTf === '1m' ? '5m' : '1m' });
    },
    
    toggleUniverse: () => {
      const currentUniverse = store.filters.universe;
      store.updateFilters({ 
        universe: currentUniverse === 'oi200' ? 'gainers50' : 'oi200' 
      });
    },
    
    updateSearchQuery: (query: string) => {
      store.updateFilters({ searchQuery: query });
    },
    
    updateSorting: (sortBy: AppFilters['sortBy']) => {
      const currentSort = store.filters.sortBy;
      const currentOrder = store.filters.sortOrder;
      
      if (currentSort === sortBy) {
        // Toggle order if same column
        store.updateFilters({ 
          sortOrder: currentOrder === 'asc' ? 'desc' : 'asc' 
        });
      } else {
        // New column, default to desc
        store.updateFilters({ 
          sortBy, 
          sortOrder: 'desc' 
        });
      }
    },
  };
};