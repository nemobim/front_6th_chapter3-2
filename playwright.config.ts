import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: false, // CI에서는 false로 설정
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // CI에서는 항상 1로 설정
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
