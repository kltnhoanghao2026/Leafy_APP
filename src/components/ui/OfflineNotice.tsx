import React from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { useIsOffline } from '@/src/store/useNetworkStore';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';

export function OfflineNotice() {
  const isOffline = useIsOffline();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!isOffline) {
    return null;
  }

  return (
    <MotiView
      from={{ translateY: -100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      exit={{ translateY: -100, opacity: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#EF4444', // Tailwind Red-500
        paddingTop: insets.top > 0 ? insets.top + 8 : 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        elevation: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
    >
      <WifiOff color="#FFFFFF" size={20} />
      <Text style={{ marginLeft: 8, fontWeight: '600', color: '#FFFFFF' }}>
        {t('network.offline', 'No Internet Connection. Leafy App is offline.')}
      </Text>
    </MotiView>
  );
}
