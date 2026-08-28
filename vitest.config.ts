import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    projects: [
      {
        test: {
          name: "unit",
          environment: "jsdom",
          include: [
            "packages/**/*.test.ts",
            "packages/**/*.test.tsx",
            "scripts/**/*.test.ts",
          ],
          exclude: ["packages/cli/app/**"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          testTimeout: 180_000,
          hookTimeout: 180_000,
          fileParallelism: false,
        },
      },
      {
        test: {
          name: "render",
          environment: "node",
          include: ["tests/render/**/*.test.ts"],
          testTimeout: 300_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },
      {
        test: {
          name: "smoke",
          environment: "node",
          include: ["tests/smoke/**/*.test.ts"],
          testTimeout: 600_000,
          hookTimeout: 600_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
