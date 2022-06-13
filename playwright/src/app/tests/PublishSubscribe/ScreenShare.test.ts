import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

// doesn't work in headless mode
test.skip(`Screenshare check`, async () => {
  page.acceptDialogWhenPrompted(); // for screenshare
  await page.click(page.footer.screen_share_btn);
  await page.click(page.footer.stop_screen_share_btn);
});
