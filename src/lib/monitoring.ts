export function initMonitoring() {
  if (typeof window === "undefined") return;

  try {
    // Measure page load performance
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log(
          "[Performance] Time to First Byte:",
          navigation.responseStart - navigation.requestStart
        );
        console.log(
          "[Performance] DOM Content Loaded:",
          navigation.domContentLoadedEventEnd - navigation.requestStart
        );
        console.log(
          "[Performance] Full Page Load:",
          navigation.loadEventEnd - navigation.requestStart
        );
      }
    });

    // Measure largest contentful paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(
        "[Performance] Largest Contentful Paint:",
        lastEntry.startTime
      );
    });
    observer.observe({ entryTypes: ["largest-contentful-paint"] });

    // Measure first input delay
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const fid = entry as PerformanceEventTiming;
        console.log(
          "[Performance] First Input Delay:",
          fid.processingStart - fid.startTime
        );
      });
    });
    fidObserver.observe({ entryTypes: ["first-input"] });

    // Track user interactions
    document.addEventListener("click", () => {
      console.log("[Interaction] User Click:", Date.now());
    });

    // Track page visibility
    document.addEventListener("visibilitychange", () => {
      console.log("[Visibility] State:", document.visibilityState);
    });
  } catch (error) {
    console.error("Failed to initialize monitoring:", error);
  }
}
