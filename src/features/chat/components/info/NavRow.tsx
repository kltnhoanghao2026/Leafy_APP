import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface NavRowProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeType?: 'count' | 'dot';
  onClick: () => void;
  destructive?: boolean;
}

export function NavRow({ icon, label, badge, badgeType, onClick, destructive }: NavRowProps) {
  return (
    <Pressable
      onPress={onClick}
      className="flex-row items-center justify-between py-4 px-4 bg-white border-b border-gray-50 active:opacity-70 active:bg-gray-50"
    >
      <View className="flex-row items-center">
        <View className="mr-3 w-6 items-center justify-center">
          {icon}
        </View>
        <Text className={`text-[15px] font-medium ${destructive ? 'text-red-600' : 'text-gray-800'}`}>
          {label}
        </Text>
      </View>
      
      <View className="flex-row items-center">
        {badge !== undefined && badge > 0 && (
          <View className={badgeType === 'dot' ? "bg-red-500 w-2.5 h-2.5 rounded-full mr-2" : "bg-red-500 rounded-full min-w-[20px] h-[20px] items-center justify-center mr-2 px-1.5"}>
            {badgeType === 'count' && <Text className="text-white text-[10px] font-bold">{badge > 99 ? '99+' : badge}</Text>}
          </View>
        )}
        <ChevronRight size={18} color="#9ca3af" />
      </View>
    </Pressable>
  );
}
