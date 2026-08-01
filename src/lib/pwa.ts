/**
 * Service worker registration wrapper.
 *
 * The worker is only ever registered in the published production app. Lovable
 * previews, iframes and dev servers must stay worker-free, otherwise a stale
 * cached shell keeps serving deleted chunks. `?sw=off` is a kill switch that
 * unregisters an already-installed worker.
 */

const SW_URL = "/sw.js";

function isBlockedContext() {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;

  const { hostname, search } = window.location;
  if (new URLSearchParams(search).has("sw") && new URLSearchParams(search).get("sw") === "off") {
    return true;
  }
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const url = registration.active?.scriptURL ?? registration.installing?.scriptURL ?? "";
        return url.endsWith(SW_URL);
      })
      .map((registration) => registration.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      // Registration failures are non-fatal — the app still works online.
    });
  });
}
