import * as SecureStore from "expo-secure-store";
import type { ProfileResponse } from "@/src/features/user-profile/schema/user.schema";

/**
 * Secure storage keys for user & profile info.
 * These sit alongside the token keys in `axios.ts`.
 */
const USER_INFO_KEY = "leafy_user_info";
const PROFILE_INFO_KEY = "leafy_profile_info";

// ─── User Info (lightweight auth identity) ────────────────────────────

export interface PersistedUserInfo {
  userId: string;
  email?: string;
  role?: string;
}

export const saveUserInfo = async (info: PersistedUserInfo): Promise<void> => {
  await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(info));
};

export const getUserInfo = async (): Promise<PersistedUserInfo | null> => {
  const raw = await SecureStore.getItemAsync(USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedUserInfo;
  } catch {
    return null;
  }
};

export const clearUserInfo = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(USER_INFO_KEY);
};

// ─── Profile Info (full profile from profile-service) ─────────────────

export const saveProfileInfo = async (
  profile: ProfileResponse,
): Promise<void> => {
  await SecureStore.setItemAsync(PROFILE_INFO_KEY, JSON.stringify(profile));
};

export const getProfileInfo = async (): Promise<ProfileResponse | null> => {
  const raw = await SecureStore.getItemAsync(PROFILE_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProfileResponse;
  } catch {
    return null;
  }
};

export const clearProfileInfo = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PROFILE_INFO_KEY);
};

// ─── Convenience: clear everything at once ────────────────────────────

export const clearAllUserStorage = async (): Promise<void> => {
  await Promise.all([clearUserInfo(), clearProfileInfo()]);
};
