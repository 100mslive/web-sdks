import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;
let timeout: 2000;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test(`Playlist Video`, async () => {
  await page.clickWithTimeout(
    timeout,
    page.footer.video_playlist,
    page.footer.audio_playlist_item.replace("?", "1")
  );

  await page.click(
    page.footer.playlist_play_pause_btn,
    page.footer.playlist_play_pause_btn,
    page.footer.playlist_next_btn
  );
  await page.timeout(2000);

  await page.click(
    page.footer.playlist_play_pause_btn,
    page.footer.playlist_play_pause_btn,
    page.footer.playlist_prev_btn
  );
  await page.click(page.footer.videoplayer_cross_btn);
});
