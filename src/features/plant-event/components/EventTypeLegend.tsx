import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  EVENT_TYPE_VALUES,
  getEventTypeIcon,
  getEventCategory,
} from "./plant-event.types";
import { CATEGORY_DOT_COLORS } from "./calendarConstants";

export function EventTypeLegend() {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap border-t border-slate-100 dark:border-slate-800 px-4 py-3 gap-y-3">
      {EVENT_TYPE_VALUES.map((type) => {
        const Icon = getEventTypeIcon(type);
        const color = CATEGORY_DOT_COLORS[getEventCategory(type)];
        return (
          <View
            key={type}
            className="w-[33%] flex-row items-center pr-2 gap-1.5"
          >
            <View
              style={{ backgroundColor: color }}
              className="w-4 h-4 rounded-md items-center justify-center shrink-0"
            >
              <Icon size={10} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text
              className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex-1"
              numberOfLines={1}
            >
              {t(`plantEvent.eventType.${type}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
