/**
 * Vendor-agnostic monitoring surface.
 *
 * Nothing is bundled by default — Sentry, PostHog, Google Analytics and
 * Microsoft Clarity are wired in by registering a provider at boot. Product
 * code only ever calls captureError / trackEvent / trackPageView / trackTiming,
 * so swapping vendors never touches feature code.
 */

export interface MonitoringProvider {
  name: string;
  captureError?(error: unknown, context?: Record<string, unknown>): void;
  trackEvent?(name: string, props?: Record<string, unknown>): void;
  trackPageView?(path: string): void;
  trackTiming?(metric: string, valueMs: number): void;
  identify?(userId: string | null, traits?: Record<string, unknown>): void;
}

const providers: MonitoringProvider[] = [];

export function registerMonitoringProvider(provider: MonitoringProvider) {
  if (!providers.some((p) => p.name === provider.name)) providers.push(provider);
  return () => {
    const index = providers.findIndex((p) => p.name === provider.name);
    if (index >= 0) providers.splice(index, 1);
  };
}

function fanOut<K extends keyof MonitoringProvider>(
  method: K,
  run: (provider: MonitoringProvider) => void,
) {
  for (const provider of providers) {
    if (typeof provider[method] !== "function") continue;
    try {
      run(provider);
    } catch {
      // Monitoring must never break the app.
    }
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (import.meta.env.DEV) console.error("[monitoring]", error, context);
  fanOut("captureError", (p) => p.captureError?.(error, context));
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  fanOut("trackEvent", (p) => p.trackEvent?.(name, props));
}

export function trackPageView(path: string) {
  fanOut("trackPageView", (p) => p.trackPageView?.(path));
}

export function trackTiming(metric: string, valueMs: number) {
  fanOut("trackTiming", (p) => p.trackTiming?.(metric, valueMs));
}

export function identifyUser(userId: string | null, traits?: Record<string, unknown>) {
  fanOut("identify", (p) => p.identify?.(userId, traits));
}

/** Console provider used in development so events are visible without a vendor. */
export const consoleProvider: MonitoringProvider = {
  name: "console",
  trackEvent: (name, props) => console.debug("[event]", name, props ?? {}),
  trackPageView: (path) => console.debug("[pageview]", path),
  trackTiming: (metric, value) => console.debug("[timing]", metric, `${Math.round(value)}ms`),
};

/**
 * Reports Core Web Vitals via trackTiming. Safe to call on every client boot;
 * it no-ops when the browser lacks PerformanceObserver.
 */
export function observeWebVitals() {
  if (typeof PerformanceObserver === "undefined") return;

  const observe = (type: string, handle: (entry: PerformanceEntry) => void) => {
    try {
      const observer = new PerformanceObserver((list) => list.getEntries().forEach(handle));
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
    } catch {
      // Entry type unsupported in this browser.
    }
  };

  observe("largest-contentful-paint", (entry) => trackTiming("LCP", entry.startTime));
  observe("first-input", (entry) => {
    const e = entry as PerformanceEventTiming;
    trackTiming("INP", e.processingStart - e.startTime);
  });
  observe("layout-shift", (entry) => {
    const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
    if (!shift.hadRecentInput) trackTiming("CLS", shift.value * 1000);
  });
}
