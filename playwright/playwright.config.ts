import { PlaywrightTestConfig } from "@playwright/test";

const envPath = process.env.ENV_PATH;
require("dotenv").config({ path: envPath });
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

let workers = 1;
if (process.env.room_ids) {
  // number of workers will be equal to number of room ids given
  // find number of commas and add 1
  workers = (process.env.room_ids.match(/,/g) || []).length + 1;
  if (process.env.CI) {
    workers = 8;
  }
  console.log("using number of workers", workers);
}

const isCI = !!process.env.CI;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const config: PlaywrightTestConfig = {
  //globalSetup: require.resolve('./global-setup'),
  testDir: "./src/app/tests",
  //   testMatch: '**.test.js',

  /* Maximum time one test can run for. */
  timeout: 180 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: isCI ? 30000 : 10000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  // forbidOnly: isCI,
  /* Retry on CI only */
  retries: 1,
  /* Opt out of parallel tests on CI. */
  workers: workers,
  fullyParallel: true,
  // workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: process.env.CI ? 'allure-playwright' : 'github',
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["./src/slackReporter.ts"],
    ["dot"],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: isCI ? 30000 : 30000,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL,
    headless: isCI,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    // Tell all tests to load signed-in state from 'storageState.json'.
    // storageState: `auth${env}.json`,
    screenshot: "only-on-failure",
    // capturing and discarding video takes CPU, avoid it on CI
    video: isCI ? "on-first-retry" : "retain-on-failure",
    permissions: ["microphone", "camera"],
  },

  /* Configure projects for major browsers */
  projects: [
    //  {
    //   name: 'chromium',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //   },
    // },

    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },

    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    //     },

    {
      name: "Google Chrome",
      use: {
        channel: "chrome",
        launchOptions: {
          args: [
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
            "--autoplay-policy=no-user-gesture-required",
          ],
        },
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: "detailed-report",

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

const setupEnv = () => {
  const workerIndex = Number(process.env.TEST_PARALLEL_INDEX);
  const roomIDsStr = process.env.room_ids;
  if (roomIDsStr && workerIndex !== undefined) {
    const roomIds = roomIDsStr.split(",");
    const roomId = roomIds[workerIndex];
    const baseUrl = process.env.base_url;

    const getUrl = (role: string) => {
      return baseUrl + "/" + roomId + "/" + role;
    };

    console.log("env setup before all tests for worker - ", workerIndex, baseUrl, roomId);

    process.env.audio_url = getUrl("audio");
    process.env.audio_video_url = getUrl("audio-video");
    process.env.audio_video_screenshare_url = getUrl("audio-video-sshare");
    process.env.screen_share_url = getUrl("screenshare");
    process.env.video_url = getUrl("video");
    process.env.viewer_url = getUrl("viewer");
    process.env.hls_viewer_url = getUrl("hls-viewer");

    const randomNumber = Math.floor(Math.random() * 10000);
    process.env.peer_name = `peer_${randomNumber}_`;
  }
};

setupEnv();

module.exports = config;
