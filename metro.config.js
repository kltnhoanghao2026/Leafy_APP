const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow metro to bundle .tflite model files as assets
config.resolver.assetExts.push("tflite");

module.exports = withNativeWind(config, { input: "./global.css" });
