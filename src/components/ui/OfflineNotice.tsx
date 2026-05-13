import React, { useEffect, useState } from 'react';
import { Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, X } from 'lucide-react-native';
import { useIsOffline } from '@/src/providers/NetworkProvider';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';

export function OfflineNotice() {
  const isOffline = useIsOffline();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isOffline) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!isOffline || !isVisible) {
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
        justifyContent: 'space-between',
        zIndex: 9999,
        elevation: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <WifiOff color="#FFFFFF" size={20} />
        <Text style={{ marginLeft: 8, fontWeight: '600', color: '#FFFFFF' }}>
          {t('network.offline', 'No Internet Connection. Leafy App is offline.')}
        </Text>
      </View>
      <Pressable onPress={() => setIsVisible(false)} hitSlop={15}>
        <X color="#FFFFFF" size={20} />
      </Pressable>
    </MotiView>
  );
}
