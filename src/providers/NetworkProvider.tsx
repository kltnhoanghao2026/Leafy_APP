import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetworkContextState {
  isOffline: boolean;
  isForceOffline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
  setNetworkState: (state: NetInfoState) => void;
  toggleForceOffline: () => void;
}

const NetworkContext = createContext<NetworkContextState | null>(null);

export const useNetworkContext = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
};

export const useIsOffline = () => {
  const { isOffline } = useNetworkContext();
  return isOffline;
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [forceOffline, setForceOffline] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [networkState, setInternalState] = useState<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string | null;
    isNetworkOffline: boolean;
  }>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
    isNetworkOffline: false,
  });

  const toggleForceOffline = useCallback(async () => {
    setForceOffline(prev => {
      const next = !prev;
      console.log(`[Network] Force offline mode ${next ? 'ENABLED' : 'DISABLED'}`);
      AsyncStorage.setItem('leafy_force_offline', next.toString()).catch(console.error);
      return next;
    });
  }, []);

  const setNetworkState = useCallback((state: NetInfoState) => {
    setInternalState(prevState => {
      const isNetworkOffline = state.isConnected === false || state.isInternetReachable === false;
      
      // Log state changes to help with debugging
      if (prevState.isNetworkOffline !== isNetworkOffline) {
        if (isNetworkOffline) {
          console.warn(`[Network] App is OFFLINE. Type: ${state.type}, Reachable: ${state.isInternetReachable}, Connected: ${state.isConnected}`);
        } else {
          console.log(`[Network] App is ONLINE. Type: ${state.type}, Reachable: ${state.isInternetReachable}, Connected: ${state.isConnected}`);
        }
      }

      return {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isNetworkOffline,
      };
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const storedForceOffline = await AsyncStorage.getItem('leafy_force_offline');
        if (storedForceOffline === 'true') {
          setForceOffline(true);
        }
      } catch (error) {
        console.error('[Network] Failed to load force offline state:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    init();

    import('@react-native-community/netinfo').then(NetInfo => {
      NetInfo.default.fetch().then(setNetworkState);
      const unsubscribe = NetInfo.default.addEventListener(setNetworkState);
      return unsubscribe;
    });
  }, [setNetworkState]);

  const isOffline = forceOffline || networkState.isNetworkOffline;

  const value = useMemo(() => ({
    isOffline,
    isForceOffline: forceOffline,
    isConnected: networkState.isConnected,
    isInternetReachable: networkState.isInternetReachable,
    type: networkState.type,
    setNetworkState,
    toggleForceOffline,
  }), [isOffline, forceOffline, networkState, setNetworkState, toggleForceOffline]);

  // Optionally, don't render children until initialization is done if forceOffline state is critical on first render
  if (isInitializing) return null;

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
