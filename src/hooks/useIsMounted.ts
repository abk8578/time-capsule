import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * React 18 & 19 recommended hook for detecting client-side hydration.
 * Returns `false` on the server and `true` on the client without cascading
 * re-renders or violating React 19 `react-hooks/set-state-in-effect`.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client snapshot
    () => false  // Server snapshot
  );
}
