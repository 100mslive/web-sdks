import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = new PageWrapper(nativePage);
  await page.preview.gotoPreviewPage();
});

test.afterEach(async () => {
  await page.close();
});


test(`Verify you are offline now notification`, async () => {
  await page.assertVisible(page.preview.preview_audio_on_btn);
  await page.emulateNetwork(true, -1, -1, -1);
  await page.assertVisible(page.center.network_offline_notification);
});

test(`Verify you are now connected notification`, async () => {
  await page.assertVisible(page.preview.preview_audio_on_btn);
  await page.emulateNetwork(true, -1, -1, -1);
    await page.assertVisible(page.center.network_offline_notification);
    await page.emulateNetwork(false, 0, 500, 500);
    await page.assertVisible(page.center.network_connected_notification);
});
