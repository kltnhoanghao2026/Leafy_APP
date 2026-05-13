/**
 * Tiny event bus to decouple the Axios interceptor (which has no access to
 * React context) from the AuthContext (which handles logout + redirect).
 *
 * Usage:
 *   - Axios response interceptor fires `authEvents.emit("SESSION_EXPIRED")`
 *     when a token refresh attempt fails.
 *   - AuthContext subscribes on mount and calls `logoutLocal()` in response.
 */

type AuthEvent = "SESSION_EXPIRED";

type Listener = () => void;

class AuthEventBus {
  private listeners: Map<AuthEvent, Set<Listener>> = new Map();

  on(event: AuthEvent, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: AuthEvent): void {
    this.listeners.get(event)?.forEach((listener) => listener());
  }
}

export const authEvents = new AuthEventBus();
