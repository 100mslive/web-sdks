import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;
const beamWaitTimeout = Number(process.env.beam_wait_timeout);

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test.describe("Beam tests @beam", () => {
  test(`Start and Stop Browser Recording`, async () => {
    await page.click(
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.recording_checkbox,
      page.footer.rtmp_recording_start_btn
    );

    await page.clickWithTimeout(
      beamWaitTimeout,
      page.header.record_status_dropdown,
      page.header.browser_recording,
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.rtmp_recording_stop_btn
    );
  });

  //hit hls m3u8 file and download
  test(`Start and Stop HLS`, async () => {
    await page.click(
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.hls_checkbox,
      page.footer.rtmp_recording_start_btn
    );

    await page.clickWithTimeout(
      beamWaitTimeout,
      page.header.record_status_dropdown,
      page.header.streaming_hls,
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.rtmp_recording_stop_btn
    );
  });

  test(`Start and Stop Rtmp`, async () => {
    await page.click(page.footer.more_settings_btn, page.footer.streaming_recording_btn);

    await page.sendText(page.footer.streaming_rtmp_url_field, process.env.twitch_rtmp_url);

    await page.click(page.footer.rtmp_recording_start_btn);

    await page.clickWithTimeout(
      beamWaitTimeout,
      page.header.record_status_dropdown,
      page.header.streaming_rtmp,
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.rtmp_recording_stop_btn
    );

    // const page2 = await context.newPage();
    // await page2.waitForTimeout(2000)
    // await page2.goto(footer.twitch_url)
    // // result =  (page2.locator(footer.twitch_live_now)).innerText("Live Now");
    // result = await pageMethods.isElementVisible(page, footer.twitch_live_now, "twitch_live_now visibility-")
    // pageMethods.assertResult(result, "twitch_live_now")
    // await page2.close()
  });

  test(`Start and Stop Rtmp Recording`, async () => {
    await page.click(
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.recording_checkbox
    );

    await page.sendText(page.footer.streaming_rtmp_url_field, process.env.yt_rtmp_url);

    await page.click(page.footer.rtmp_recording_start_btn);

    await page.clickWithTimeout(
      beamWaitTimeout,
      page.header.record_status_dropdown,
      page.header.browser_recording,
      page.header.record_status_dropdown,
      page.header.streaming_rtmp,
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.rtmp_recording_stop_btn
    );
    //add twitch check
  });

  test(`Start and Stop HLS Recording`, async () => {
    await page.click(
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.hls_checkbox,
      page.footer.recording_checkbox,
      page.footer.rtmp_recording_start_btn
    );

    await page.clickWithTimeout(
      beamWaitTimeout,
      page.header.record_status_dropdown,
      page.header.streaming_hls,
      page.header.record_status_dropdown,
      page.header.hls_recording,
      page.footer.more_settings_btn,
      page.footer.streaming_recording_btn,
      page.footer.rtmp_recording_stop_btn
    );
  });
});
