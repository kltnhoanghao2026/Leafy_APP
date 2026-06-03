import { useChatWebSocket } from '@/src/features/chat/hooks/useChatWebSocket';
import { useNotificationWebSocket } from '@/src/features/notifications/hooks/useNotificationWebSocket';

/**
 * Mounted at the main layout level so WebSocket subscriptions cover all screens
 * (chat list, chat detail, notifications drawer, etc.) instead of being scoped to
 * individual screens that get unmounted on navigation.
 */
export function GlobalWebSocketListener() {
  useChatWebSocket();
  useNotificationWebSocket();
  return null;
}
