import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async () => {});

test.afterEach(async () => {});

test(`Verify you are offline now notification`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.assertVisible(page.center.first_person_img);
  await page.emulateNetwork(true, -1, -1, -1);
  await page.assertVisible(page.center.network_offline_notification);
  await page.close();
});

test(`Verify you are now connected notification @network`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.assertVisible(page.center.first_person_img);
  await page.emulateNetwork(true, -1, -1, -1);
  await page.assertVisible(page.center.network_offline_notification);
  await page.emulateNetwork(false, 0, 500, 500);
  await page.assertVisible(page.center.network_connected_notification);
  await page.close();
});

test(`Verify local peer room state is updated for remote peer after network is restored`, async ({
  context,
}) => {
  const pages = await PageWrapper.openPages(context, 2, {
    mic: true,
  });
  await pages[0].timeout(5000);
  await pages[0].emulateNetwork(true, -1, -1, -1);
  await pages[0].assertVisible(pages[0].center.network_offline_notification);
  await pages[0].click(pages[0].footer.meeting_audio_btn);
  await pages[0].emulateNetwork(false, 0, 500, 500);
  await pages[1].assertVisible(pages[1].center.audio_mute_icon_onTile);
  await context.close();
});
