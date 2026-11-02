import { defineConfig } from '@playwright/test';

const reference = process.env.TARGET === 'reference';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  workers: 1,
  retries: 0,
  snapshotPathTemplate: 'tests/e2e/baseline/{arg}{ext}',
  use: {
    baseURL: reference ? undefined : 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 640, height: 420 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }
  },
  webServer: reference ? undefined : {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000
  }
});
