import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketClient } from "@/src/providers/WebSocketProvider";
import type { InAppNotificationPayload } from "../types";
import { notificationKeys } from "../queries/keys";

/**
 * Subscribe to `/user/queue/notifications` over STOMP.
 * On each incoming message, invalidate both the state (badge count)
 * and history queries so the UI re-fetches fresh data automatically.
 *
 * Mount this hook inside any screen that should react to real-time
 * notifications (e.g., the notifications screen and main layout).
 */
export const useNotificationWebSocket = () => {
  const { client, connected } = useWebSocketClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connected || !client) return;

    const subscription = client.subscribe(
      "/user/queue/notifications",
      (message) => {
        try {
          console.log("[NotificationWS] Received message:", message.body);
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _payload = JSON.parse(
            message.body,
          ) as InAppNotificationPayload;

          // Invalidate so badge + list update in real-time
          queryClient.invalidateQueries({
            queryKey: notificationKeys.state(),
          });
          queryClient.invalidateQueries({
            queryKey: [...notificationKeys.all(), "history"],
          });
        } catch (err) {
          console.error(
            "[NotificationWS] Failed to parse notification payload",
            err,
          );
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client, connected, queryClient]);
};
