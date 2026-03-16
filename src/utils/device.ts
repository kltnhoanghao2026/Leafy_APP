import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "device_id";

const createFallbackDeviceId = (): string => {
  return `leafy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getDeviceId = async (): Promise<string> => {
  const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (storedDeviceId) {
    return storedDeviceId;
  }

  const nativeDeviceId = createFallbackDeviceId();

  await SecureStore.setItemAsync(DEVICE_ID_KEY, nativeDeviceId);
  return nativeDeviceId;
};
