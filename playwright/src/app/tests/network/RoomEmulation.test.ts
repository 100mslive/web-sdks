import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let pages: PageWrapper[];

test.beforeEach(async () => {});

test.afterEach(async () => {
  [0, 1].forEach(async i => {
    await pages[i].close();
  });
});

const networkDisconnectedDurations = [5000, 25000];

test.skip(`Verify network disconnection/reconnection notifications`, async ({ context }) => {
  pages = await PageWrapper.openPages(context, 2, {
    mic: true,
  });
  await pages[0].delay(10000);
  await pages[0].setInternetEnabled(false);
  await pages[0].assertVisible(pages[0].center.network_offline_notification);
  await pages[0].delay(5000);
  await pages[0].setInternetEnabled(true);
  await pages[0].assertVisible(pages[0].center.network_connected_notification);
});

networkDisconnectedDurations.forEach(networkDisconnectedDuration => {
  test(`Verify local peer room state is updated for remote peer after network is restored after ${networkDisconnectedDuration} ms`, async ({
    context,
  }) => {
    pages = await PageWrapper.openPages(context, 2, {
      mic: true,
    });
    await pages[0].timeout(5000);
    await pages[0].setInternetEnabled(false);
    await pages[0].assertVisible(pages[0].center.network_offline_notification);
    await pages[0].click(pages[0].footer.meeting_audio_btn);
    await pages[0].delay(networkDisconnectedDuration);
    await pages[0].setInternetEnabled(true);
    await pages[1].assertVisible(pages[1].center.audio_mute_icon_onTile);
  });
});
