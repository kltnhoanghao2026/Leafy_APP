import { create } from 'zustand';
import { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isOffline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
  setNetworkState: (state: NetInfoState) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOffline: false,
  isConnected: null,
  isInternetReachable: null,
  type: null,
  setNetworkState: (state) => set((prevState) => {
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
  }),
}));

export const useIsOffline = () => useNetworkStore((state) => state.isOffline);

