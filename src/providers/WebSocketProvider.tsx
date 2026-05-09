import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Client } from "@stomp/stompjs";
import { getAccessToken } from "@/src/lib/axios";
import { useAuthContext } from "@/src/features/auth";

// React Native ships with a native WebSocket — no SockJS needed.
// STOMP over plain WebSocket works out of the box.
const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL || "ws://192.168.100.55:8060/ws";

interface WebSocketContextValue {
  client: Client | null;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  client: null,
  connected: false,
});

export const useWebSocketClient = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isRestoringAuth } = useAuthContext();
  const stompClientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isRestoringAuth) return;

    if (!isAuthenticated) {
      // Disconnect and clean up when logged out
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Already connected — skip
    if (stompClientRef.current?.active) return;

    let cancelled = false;

    const connect = async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;

      console.log(`[WebSocket] Connecting to ${WS_URL}...`);

      const client = new Client({
        brokerURL: WS_URL,
        reconnectDelay: 5000,
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          if (!cancelled) {
            console.log("[WebSocket] Connected");
            setConnected(true);
          }
        },
        onStompError: (frame) => {
          console.error(
            "[WebSocket] STOMP error",
            frame.headers["message"],
            frame.body,
          );
        },
        onWebSocketError: (event) => {
          console.error("[WebSocket] native WS error", event);
        },
        onDisconnect: () => {
          console.log("[WebSocket] Disconnected");
          if (!cancelled) setConnected(false);
        },
      });

      client.activate();
      if (!cancelled) stompClientRef.current = client;
    };

    connect();

    return () => {
      cancelled = true;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [isAuthenticated, isRestoringAuth]);

  return (
    <WebSocketContext.Provider
      value={{ client: stompClientRef.current, connected }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
