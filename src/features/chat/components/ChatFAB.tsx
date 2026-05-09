import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';

export function ChatFAB() {
  const insets = useSafeAreaInsets();
  
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: Math.max(insets.bottom + 20, 20) }]}
      onPress={() => router.push('/chat')}
    >
      <MessageCircle size={28} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
});
