import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;
const beamWaitTimeout = Number(process.env.beam_wait_timeout);

test.beforeEach(async ({ page: nativePage }, testInfo) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  if (testInfo.retry) {
    await page.delay(5000);
    await page.evaluateCommand('window.__hms.actions.stopHLSStreaming()');
  }
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test(`Start and Stop Browser Recording @qaonly`, async () => {

  await page.click(page.header.start_recording_btn, page.header.start_recording_confirm_btn);

  await page.clickWithTimeout(beamWaitTimeout, page.header.stop_recording_btn, page.header.stop_recording_confirm_btn);
});

test(`Start and Stop HLS @qaonly`, async () => {
  await page.click(page.header.go_live_btn, page.header.hls_stream_btn, page.header.start_hls_btn);
  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_hls_btn);
});

test(`Start and Stop HLS Recording @qaonly`, async () => {
  await page.click(
    page.header.go_live_btn,
    page.header.hls_stream_btn,
    page.header.hls_recording_toggle,
    page.header.start_hls_btn,
  );
  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_hls_btn);
});

test(`Start and Stop Rtmp @qaonly`, async () => {
  await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);
  await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
  await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);
  await page.click(page.header.start_rtmp_btn);

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_rtmp_btn);
});

test(`Start and Stop Rtmp Recording @qaonly`, async () => {
  await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);

  await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
  await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);

  await page.click(page.header.rtmp_recording_btn, page.header.start_rtmp_btn);

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.stop_rtmp_btn);
});
