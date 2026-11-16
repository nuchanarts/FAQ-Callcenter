import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    env: { DATA_BACKEND: "memory", SESSION_SECRET: "test-secret-test-secret-test-secret-1234" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/repositories/supabase.ts",
        "src/content/**",
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        "src/domain/**": { lines: 90, branches: 90, functions: 90, statements: 90 },
        "src/services/**": { lines: 90, branches: 90, functions: 90, statements: 90 },
      },
    },
  },
});
