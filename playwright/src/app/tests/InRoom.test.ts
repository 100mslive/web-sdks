import { test } from '@playwright/test';
import { PageWrapper } from '../PageWrapper';

let page: PageWrapper[];

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
  await context.close();
});

test('User is able to start/stop Beam recording @ignore', async ({ context }) => {
  page = await PageWrapper.openPages(context, ['host']);
  await page[0].click(page[0].header.start_recording_btn);
  await page[0].click(page[0].header.stop_recording_btn);
  await page[0].click(page[0].header.stop_recording_confirm_btn);
  await page[0].assertVisible(page[0].header.start_recording_btn);
});
