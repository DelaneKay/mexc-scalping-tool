import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ScanResponse, 
  SymbolDetailResponse, 
  SymbolInfo, 
  Timeframe, 
  UniverseFilter,
  NotificationPayload 
} from '@mexc-scalping/shared';
import { useAppStore } from '../store/useAppStore';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// API client functions
const apiClient = {
  async fetchSymbols(universe: UniverseFilter, minVolume?: number): Promise<{
    symbols: SymbolInfo[];
    universe: UniverseFilter;
    minVolume: number;
    count: number;
    timestamp: number;
  }> {
    const params = new URLSearchParams({
      universe,
      ...(minVolume && { minVolume: minVolume.toString() }),
    });
    
    const response = await fetch(`${API_BASE}/symbols?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch symbols: ${response.statusText}`);
    }
    return response.json();
  },

  async fetchScan(
    timeframe: Timeframe,
    universe: UniverseFilter,
    limit?: number,
    minVolume?: number
  ): Promise<ScanResponse> {
    const params = new URLSearchParams({
      tf: timeframe,
      universe,
      ...(limit && { limit: limit.toString() }),
      ...(minVolume && { minVolume: minVolume.toString() }),
    });
    
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/scan?${params}`);
    const responseTime = Date.now() - startTime;
    
    // Update performance metrics
    useAppStore.getState().updatePerformanceMetrics({ 
      apiResponseTime: responseTime,
      lastRefresh: Date.now(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch scan results: ${response.statusText}`);
    }
    return response.json();
  },

  async fetchSymbolDetail(
    symbol: string,
    timeframe: Timeframe
  ): Promise<SymbolDetailResponse> {
    const params = new URLSearchParams({
      symbol,
      tf: timeframe,
    });
    
    const response = await fetch(`${API_BASE}/detail?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch symbol detail: ${response.statusText}`);
    }
    return response.json();
  },

  async sendDiscordNotification(payload: NotificationPayload): Promise<void> {
    const response = await fetch(`${API_BASE}/notify-discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
  },

  async fetchHealth(): Promise<any> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  },
};

// React Query hooks
export const useSymbols = (universe: UniverseFilter, minVolume?: number) => {
  return useQuery({
    queryKey: ['symbols', universe, minVolume],
    queryFn: () => apiClient.fetchSymbols(universe, minVolume),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useScan = (
  timeframe: Timeframe,
  universe: UniverseFilter,
  limit?: number,
  minVolume?: number
) => {
  const { setLastUpdate, setPreviousResults, previousResults } = useAppStore();
  
  return useQuery({
    queryKey: ['scan', timeframe, universe, limit, minVolume],
    queryFn: () => apiClient.fetchScan(timeframe, universe, limit, minVolume),
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // Refresh every 10 seconds
    keepPreviousData: true,
    notifyOnChangeProps: ['data'],
    onSuccess: (data) => {
      setLastUpdate(Date.now());
      // Store previous results for delta calculations
      if (previousResults.length > 0) {
        setPreviousResults(data.results);
      } else {
        setPreviousResults(data.results);
      }
    },
  });
};

export const useSymbolDetail = (symbol: string, timeframe: Timeframe) => {
  return useQuery({
    queryKey: ['symbolDetail', symbol, timeframe],
    queryFn: () => apiClient.fetchSymbolDetail(symbol, timeframe),
    enabled: !!symbol,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
  });
};

export const useDiscordNotification = () => {
  return useMutation({
    mutationFn: apiClient.sendDiscordNotification,
    onError: (error) => {
      console.error('Failed to send Discord notification:', error);
    },
  });
};

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: apiClient.fetchHealth,
    staleTime: 30000,
    refetchInterval: 30000,
    retry: 1,
  });
};

// Custom hook for handling notifications
export const useNotifications = () => {
  const { notificationsEnabled } = useAppStore();
  const discordMutation = useDiscordNotification();
  
  const sendNotification = async (payload: NotificationPayload) => {
    if (!notificationsEnabled) return;
    
    try {
      // Send Discord notification if configured
      await discordMutation.mutateAsync(payload);
    } catch (error) {
      console.error('Notification failed:', error);
    }
  };
  
  return {
    sendNotification,
    isLoading: discordMutation.isLoading,
  };
};

// Custom hook for real-time data management
export const useRealTimeData = () => {
  const { filters, previousResults, setPreviousResults } = useAppStore();
  const { sendNotification } = useNotifications();
  
  const scanQuery = useScan(
    filters.timeframe,
    filters.universe,
    50,
    500000
  );
  
  // Detect significant changes and send notifications
  React.useEffect(() => {
    if (!scanQuery.data?.results || previousResults.length === 0) return;
    
    const currentResults = scanQuery.data.results;
    const previousMap = new Map(previousResults.map(r => [r.symbol, r]));
    
    for (const current of currentResults) {
      const previous = previousMap.get(current.symbol);
      if (!previous) continue;
      
      // Check for state transitions
      if (previous.burst.state !== current.burst.state) {
        if (['ABOUT_TO_BURST', 'LOSING_VOL'].includes(current.burst.state)) {
          sendNotification({
            symbol: current.symbol,
            timeframe: current.timeframe,
            state: current.burst.state,
            burstScore: current.burst.burstScore,
            volatilityScore: current.volatility.volatilityScore,
            volumeSurge: current.volatility.volumeSurge,
            atrPercent: current.indicators.atrPercent,
            leverageSuggestion: current.burst.leverageSuggestion,
            timestamp: Date.now(),
          });
        }
      }
    }
    
    setPreviousResults(currentResults);
  }, [scanQuery.data?.results, previousResults, sendNotification, setPreviousResults]);
  
  return scanQuery;
};