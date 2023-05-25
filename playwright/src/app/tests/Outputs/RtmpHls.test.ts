import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';
import { expect } from '@playwright/test';
//import exp = require('constants');
import exp from 'constants';


let page: PageWrapper;
const beamWaitTimeout = Number(process.env.beam_wait_timeout);

const testData = [{width:"720", height:"720"}, {width:"1280",height:"1080"},{width:"720",height:"480"},{width:"0",height:"0"}]
const invalidRes = [{width:"20", height:"20"}, {width:"20",height:"0"} ] //{width:"-720",height:"-1080"},{width:"-720",height:"1080"},

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

test(`Start and Stop Browser Recording`, async () => {

  await page.click(page.header.start_recording_btn, page.header.start_recording_confirm_btn);
  await expect(page.locator(page.header.go_live_btn)).toBeDisabled();
  await page.clickWithTimeout(beamWaitTimeout, page.header.stop_recording_btn, page.header.stop_recording_confirm_btn);
  await expect(page.locator(page.header.go_live_btn)).toBeEnabled();
  await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
});

invalidRes.forEach(data =>{
  test(`Start recording only with invalid resolutions ${data.width}X${data.height}`, async() => {

    await page.click(page.header.start_recording_btn);

    await page.sendText(page.header.recording_resolution_width_btn, data.width);
    await page.sendText(page.header.recording_resolution_height_btn, data.height);

    await page.click(page.header.start_recording_confirm_btn);

    await page.assertVisible(page.footer.error_message);
    await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
  });})

testData.forEach(data =>{
  test(`Start recording only with different resolutions ${data.width}X${data.height}`, async() => {

    await page.click(page.header.start_recording_btn);

    await page.sendText(page.header.recording_resolution_width_btn, data.width);
    await page.sendText(page.header.recording_resolution_height_btn, data.height);

    await page.click(page.header.start_recording_confirm_btn);
    await expect(page.locator(page.header.go_live_btn)).toBeDisabled();

    await page.clickWithTimeout(beamWaitTimeout, page.header.stop_recording_btn, page.header.stop_recording_confirm_btn);
    await expect(page.locator(page.header.go_live_btn)).toBeEnabled();
    await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();

  });})

test(`Start and Stop HLS stream only`, async () => {
  await page.click(page.header.go_live_btn, page.header.hls_stream_btn, page.header.start_hls_btn);
  
  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn,page.header.end_stream_btn)
  await expect(page.locator(page.header.go_live_btn)).toBeHidden();
  await expect(page.locator(page.header.live_indicator)).toBeVisible();

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn,page.header.end_stream_btn, page.header.stop_hls_btn);
  await expect(page.locator(page.header.go_live_btn)).toBeEnabled();
  await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
  await expect(page.locator(page.header.live_indicator)).toBeHidden();
});

test(`Start and Stop HLS Recording`, async () => {
  await page.click(
    page.header.go_live_btn,
    page.header.hls_stream_btn,
    page.header.hls_recording_toggle,
    page.header.start_hls_btn,
  );
  await expect(page.locator(page.header.go_live_btn)).toBeHidden();
  await expect(page.locator(page.header.live_indicator)).toBeVisible();  

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.end_stream_btn, page.header.stop_hls_btn);

  await expect(page.locator(page.header.go_live_btn)).toBeEnabled();
  await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
  await expect(page.locator(page.header.live_indicator)).toBeHidden();
});

test(`Start and Stop Rtmp`, async () => {
  await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);
  await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
  await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);
  await page.click(page.header.start_rtmp_btn);

  await expect(page.locator(page.header.start_recording_btn)).toBeDisabled();
  await expect(page.locator(page.header.rtmp_indicator)).toBeVisible();

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.end_stream_btn, page.header.stop_rtmp_btn);

  await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
  await expect(page.locator(page.header.rtmp_indicator)).toBeHidden();
});

test(`Start and Stop Rtmp Recording`, async () => {
  await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);

  await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
  await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);

  await page.click(page.header.rtmp_recording_btn, page.header.start_rtmp_btn);

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.end_stream_btn);

  await expect(page.locator(page.header.start_recording_btn)).toBeHidden();
  await expect(page.locator(page.header.rtmp_indicator)).toBeVisible();
  await expect(page.locator(page.header.stop_recording_btn)).toBeVisible();

  await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn, page.header.end_stream_btn, page.header.stop_rtmp_btn);
  await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
  await expect(page.locator(page.header.rtmp_indicator)).toBeHidden();
  await expect(page.locator(page.header.stop_recording_btn)).toBeHidden();

});


testData.forEach(data =>{
test(`Start RTMP only with different resolutions ${data.width}X${data.height}`, async() => {
  await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);

  await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
  await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);

  await page.sendText(page.header.rtmp_resolution_width_btn, data.width);
  await page.sendText(page.header.rtmp_resolution_height_btn, data.height);

  await page.click(page.header.start_rtmp_btn);

  await expect(page.locator(page.header.start_recording_btn)).toBeDisabled();
  await expect(page.locator(page.header.rtmp_indicator)).toBeVisible();

  await page.clickWithTimeout(beamWaitTimeout,page.header.end_stream_btn ,page.header.end_stream_btn, page.header.stop_rtmp_btn);
  await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
  await expect(page.locator(page.header.rtmp_indicator)).toBeHidden();
  
});})

testData.forEach(data =>{
  test(`Start RTMP with recording with different resulutions ${data.width}X${data.height}`, async() => {
    await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);
  
    await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
    await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);
  
    await page.sendText(page.header.rtmp_resolution_width_btn, data.width);
    await page.sendText(page.header.rtmp_resolution_height_btn, data.height);
  
    await page.click(page.header.rtmp_recording_btn, page.header.start_rtmp_btn);

    await expect(page.locator(page.header.start_recording_btn)).toBeHidden();
    await expect(page.locator(page.header.rtmp_indicator)).toBeVisible();
    await expect(page.locator(page.header.stop_recording_btn)).toBeVisible();
  
    await page.clickWithTimeout(beamWaitTimeout, page.header.end_stream_btn,page.header.end_stream_btn, page.header.stop_rtmp_btn);
    await expect(page.locator(page.header.start_recording_btn)).toBeEnabled();
    await expect(page.locator(page.header.rtmp_indicator)).toBeHidden();
  
  });})
  
invalidRes.forEach(data =>{
test(`Start rtmp with invalid resolutions ${data.width}X${data.height}`,async () => {
  await page.click(page.header.go_live_btn, page.header.rtmp_stream_btn);
  
    await page.sendText(page.header.rtmp_url_btn, process.env.twitch_rtmp_url);
    await page.sendText(page.header.rtmp_key_btn, process.env.twitch_rtmp_key);
  
    await page.sendText(page.header.rtmp_resolution_width_btn, data.width);
    await page.sendText(page.header.rtmp_resolution_height_btn, data.height);

});}) 