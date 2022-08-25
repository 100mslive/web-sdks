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

//not present in prod
test.skip(`white board check`, async () => {
  await page.click(
    page.footer.white_board_btn,
    page.footer.white_board_btn,
    page.footer.white_board_btn
  );

  await page.click(page.header.record_status_dropdown);
  await page.assertVisible(page.header.whiteboard_owner);
  await page.click(page.header.whiteboard_stop);
});
