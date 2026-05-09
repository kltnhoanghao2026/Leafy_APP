import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type { ApiResponse } from "@/src/shared/api";
import type {
  UserNotificationResponse,
  NotificationStateResponse,
} from "../types";

export const notificationApi = {
  getHistory: async (params?: { cursor?: string; limit?: number }) => {
    const { data } = await apiClient.get<
      ApiResponse<UserNotificationResponse[]>
    >(API_ENDPOINTS.NOTIFICATIONS.HISTORY, { params });
    return data;
  },

  getUnreadHistory: async (params?: { cursor?: string; limit?: number }) => {
    const { data } = await apiClient.get<
      ApiResponse<UserNotificationResponse[]>
    >(API_ENDPOINTS.NOTIFICATIONS.HISTORY_UNREAD, { params });
    return data;
  },

  getState: async () => {
    const { data } = await apiClient.get<ApiResponse<NotificationStateResponse>>(
      API_ENDPOINTS.NOTIFICATIONS.STATE,
    );
    return data;
  },

  markChecked: async () => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.NOTIFICATIONS.CHECKED,
    );
    return data;
  },

  markAsRead: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.NOTIFICATIONS.READ(id),
    );
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.NOTIFICATIONS.READ_ALL,
    );
    return data;
  },
};
