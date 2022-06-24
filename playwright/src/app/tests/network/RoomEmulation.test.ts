import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;

test.beforeEach(async () => {});

test.afterEach(async () => {});

const networkDisconnectedDurations = [5000, 35000];

test(`Verify network disconnection/reconnection notifications`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.assertVisible(page.center.first_person_img);
  await page.setInternetEnabled(false);
  await page.assertVisible(page.center.network_offline_notification);
  await page.delay(5000);
  await page.setInternetEnabled(true);
  await page.assertVisible(page.center.network_connected_notification);
  await page.close();
});

networkDisconnectedDurations.forEach(networkDisconnectedDuration => {
  test(`Verify local peer room state is updated for remote peer after network is restored after ${waitTime} ms`, async ({
    context,
  }) => {
    const pages = await PageWrapper.openPages(context, 2, {
      mic: true,
    });
    await pages[0].timeout(5000);
    await pages[0].setInternetEnabled(false);
    await pages[0].assertVisible(pages[0].center.network_offline_notification);
    await pages[0].click(pages[0].footer.meeting_audio_btn);
    await pages[0].delay(networkDisconnectedDuration);
    await pages[0].setInternetEnabled(true);
    await pages[1].assertVisible(pages[1].center.audio_mute_icon_onTile);
    await context.close();
  });
});
