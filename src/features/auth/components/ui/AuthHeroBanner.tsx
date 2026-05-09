import React from "react";
import { StyleSheet, Text, View, ImageBackground, View as RNView } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const BACKGROUND_IMAGE =
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1773284624/login-background_mwwssi.webp";

interface AuthHeroBannerProps {
  palette: any;
  icon: string;
  title: string;
  tagline: string;
  minHeight?: number;
}

export function AuthHeroBanner({
  palette,
  icon,
  title,
  tagline,
  minHeight,
}: AuthHeroBannerProps) {
  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE }}
      style={[styles.heroBanner, minHeight ? { minHeight } : undefined]}
      imageStyle={{ opacity: 0.6 }}
    >
      <RNView pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="headerOverlay" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={palette.background} stopOpacity={0} />
              <Stop offset="65%" stopColor={palette.background} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={palette.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerOverlay)" />
        </Svg>
      </RNView>

      <View style={styles.heroContent}>
        <RNView
          style={[
            styles.logoCircle,
            { backgroundColor: palette.textInputBackground },
          ]}
        >
          <Text style={[styles.logoEmoji, { color: palette.green }]}>
            {icon}
          </Text>
        </RNView>

        <Text style={[styles.appTitle, { color: palette.text }]}>{title}</Text>

        <Text style={[styles.tagline, { color: palette.textGray }]}>
          {tagline}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    width: "auto",
    marginHorizontal: -40,
    marginTop: -32,
    paddingHorizontal: 0,
  },
  heroContent: {
    alignItems: "center",
    gap: 12,
    paddingTop: 24,
    paddingBottom: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  logoEmoji: {
    fontSize: 46,
    fontWeight: "bold",
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 21,
  },
});
