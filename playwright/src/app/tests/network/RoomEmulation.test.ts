import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let pages: PageWrapper[];

test.beforeEach(async () => {});

test.afterEach(async () => {
  [0, 1].forEach(async i => {
    await pages[i].close();
  });
});

test(`Verify network disconnection notifications`, async ({ context }) => {
  pages = await PageWrapper.openPages(context, 2, {
    mic: true,
  });
  await pages[0].delay(10000);
  await pages[0].setInternetEnabled(false);
  await pages[0].assertVisible(pages[0].center.network_offline_notification);
});
