import { View, Text } from "react-native";
import { CloudSun } from "lucide-react-native";
import { homeStyles as styles } from "./home.styles";

type WeatherStripProps = {
  cardBg: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
};

export function WeatherStrip({
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
}: WeatherStripProps) {
  return (
    <View
      style={[
        styles.weatherCard,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <View style={styles.weatherLeft}>
        <CloudSun size={40} color="#F59E0B" />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.weatherLocation, { color: subTextColor }]}>
            Đắk Lắk, VN
          </Text>
          <Text style={[styles.weatherTemp, { color: textColor }]}>
            28°C • Nắng nhẹ
          </Text>
        </View>
      </View>
      <View style={styles.weatherRight}>
        <Text style={[styles.weatherUpdatedLabel, { color: subTextColor }]}>
          Cập nhật
        </Text>
        <Text style={[styles.weatherUpdatedValue, { color: textColor }]}>
          10 phút trước
        </Text>
      </View>
    </View>
  );
}
