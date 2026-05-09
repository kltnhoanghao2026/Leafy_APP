import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextState {
  isOffline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
  setNetworkState: (state: NetInfoState) => void;
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
  const [networkState, setInternalState] = useState<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string | null;
    isOffline: boolean;
  }>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
    isOffline: false,
  });

  const setNetworkState = useCallback((state: NetInfoState) => {
    setInternalState(prevState => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      
      // Log state changes to help with debugging
      if (prevState.isOffline !== isOffline) {
        if (isOffline) {
          console.warn(`[Network] App is OFFLINE. Type: ${state.type}, Reachable: ${state.isInternetReachable}, Connected: ${state.isConnected}`);
        } else {
          console.log(`[Network] App is ONLINE. Type: ${state.type}, Reachable: ${state.isInternetReachable}, Connected: ${state.isConnected}`);
        }
      }

      return {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOffline,
      };
    });
  }, []);

  useEffect(() => {
    import('@react-native-community/netinfo').then(NetInfo => {
      NetInfo.default.fetch().then(setNetworkState);
      const unsubscribe = NetInfo.default.addEventListener(setNetworkState);
      return unsubscribe;
    });
  }, [setNetworkState]);

  const value = useMemo(() => ({
    ...networkState,
    setNetworkState,
  }), [networkState, setNetworkState]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
