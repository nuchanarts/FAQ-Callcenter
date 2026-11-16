import { expect, test } from "@playwright/test";

// Constitution XI budgets, measured on the production build.
const JS_BUDGET_BYTES = 200 * 1024; // first-load JS per route, compressed transfer size
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.1;

for (const path of ["/", "/report", "/guide", "/login"]) {
  test(`${path} stays within the JS, LCP and CLS budgets`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(async () => {
      const js = performance
        .getEntriesByType("resource")
        .filter((e) => (e as PerformanceResourceTiming).initiatorType === "script")
        .reduce((sum, e) => sum + (e as PerformanceResourceTiming).encodedBodySize, 0);
      const lcp = await new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1]?.startTime ?? 0);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve(0), 1000);
      });
      const cls = (
        performance.getEntriesByType("layout-shift") as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]
      )
        .filter((e) => !e.hadRecentInput)
        .reduce((sum, e) => sum + e.value, 0);
      return { js, lcp, cls };
    });
    test.info().annotations.push({
      type: "metrics",
      description: `${path}: JS ${(metrics.js / 1024).toFixed(1)} KB, LCP ${Math.round(metrics.lcp)} ms, CLS ${metrics.cls.toFixed(3)}`,
    });
    console.log(
      `[perf] ${path}: JS ${(metrics.js / 1024).toFixed(1)} KB, LCP ${Math.round(metrics.lcp)} ms, CLS ${metrics.cls.toFixed(3)}`,
    );
    expect(metrics.js).toBeLessThanOrEqual(JS_BUDGET_BYTES);
    expect(metrics.lcp).toBeLessThanOrEqual(LCP_BUDGET_MS);
    expect(metrics.cls).toBeLessThanOrEqual(CLS_BUDGET);
  });
}
