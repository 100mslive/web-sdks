import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;
const beamWaitTimeout = Number(process.env.beam_wait_timeout);

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test.describe('Beam tests @beam', () => {
  test.skip(`Start and Stop Browser Recording`, async () => {
    await page.click(page.header.start_recording_btn, page.header.start_recording_confirm_btn);

    await page.clickWithTimeout(
      beamWaitTimeout,
      page.header.stop_recording_btn,
      page.header.stop_recording_confirm_btn,
    );
  });

  //hit hls m3u8 file and download
  test.skip(`Start and Stop HLS`, async () => {
    await page.click(page.header.go_live_btn, page.header.hls_stream_btn, page.header.start_hls_btn);
    await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_hls_btn);
  });

  test.skip(`Start and Stop HLS Recording`, async () => {
    await page.click(
      page.header.go_live_btn,
      page.header.hls_stream_btn,
      page.header.hls_recording_toggle,
      page.header.start_hls_btn,
    );
    await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_hls_btn);
  });

  test.skip(`Start and Stop Rtmp`, async () => {
    await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);

    await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
    await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);

    await page.click(page.header.start_rtmp_btn);

    await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_rtmp_btn);
  });

  test.skip(`Start and Stop Rtmp Recording`, async () => {
    await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);

    await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
    await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);

    await page.click(page.header.rtmp_recording_btn, page.header.start_rtmp_btn);

    await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_rtmp_btn);
  });
});
