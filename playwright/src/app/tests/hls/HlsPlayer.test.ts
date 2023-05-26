import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;
let hlsViewerPage: any;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.click(page.header.go_live_btn, page.header.hls_stream_btn, page.header.start_hls_btn);
});

test.afterEach(async ({ context }) => {
  await page.endRoom();
  await context.close();
});

test(`Verify HLS stats for hls viewer`, async ({ browser }) => {
  const hlsViewerNativePage = await browser.newPage();
  hlsViewerPage = new PageWrapper(hlsViewerNativePage);
  PageWrapper.openHLSMeetingPage(hlsViewerNativePage, {});
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_play_pause_btn);
  await hlsViewerPage.click(hlsViewerPage.hlsViewer.hls_viewer_more_settings_btn);
  await hlsViewerPage.click(hlsViewerPage.hlsViewer.hls_viewer_hls_stats);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_url);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_video_size);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_buffer_duration);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_connection_speed);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_bitrate);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_distance_from_live);
  await hlsViewerPage.assertVisible(hlsViewerPage.hlsViewer.hls_viewer_stats_dropped_frames);
});
