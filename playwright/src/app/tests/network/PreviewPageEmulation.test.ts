import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = new PageWrapper(nativePage);
  await page.prepreview.gotoPreviewPage(page.localName);
});

test.afterEach(async () => {
  await page.close();
});

test.skip(`Verify network connection/disconnection notification on preview page`, async () => {
  await page.assertVisible(page.preview.preview_audio_on_btn);
  await page.setInternetEnabled(false);
  await page.assertVisible(page.center.network_offline_notification);
  await page.delay(5000);
  await page.setInternetEnabled(true);
  await page.assertVisible(page.center.network_connected_notification);
});
