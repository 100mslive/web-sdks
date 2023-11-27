import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.close();
});

test(`Verify bulk role change`, async() => {
    await page.footer.openMoreSettings();
    await page.footer.openBulkRoleChange();
    await page.footer.openRoleForChange();
    await page.footer.selectForRoleForChange();
    await page.click(page.footer.for_role_label);
    await page.footer.selectToRoleDropdown();
    await page.footer.selectToRole();
    await page.footer.clickApplyButton();
    await page.header.openParticipantList();
    await page.assertVisible(
        page.header.participant_role_heading.replace("?","audio-video")
      ); 
});