import { test } from "@playwright/test";
import { PageWrapper } from "../../PageWrapper";

test(`Verify text when no stream running`, async ({ page: nativePage }) => {
  const page = await PageWrapper.openHLSMeetingPage(nativePage,{});
  await page.hasText(page.center.no_stream_text, page.hlsViewer.waiting_stream_start_text);
  await page.close();
});
