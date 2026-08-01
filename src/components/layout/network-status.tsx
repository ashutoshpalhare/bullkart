import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Sticky offline banner. Rendered once at the app shell level so every route
 * gets the same signal without wiring per-page state.
 */
export function NetworkStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-sm font-medium text-destructive-foreground"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      You're offline — browsing cached pages. Orders will resume once you reconnect.
    </div>
  );
}
