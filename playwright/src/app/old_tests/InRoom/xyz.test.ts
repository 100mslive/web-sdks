import { PageWrapper } from "../../PageWrapper";
import { test } from '@playwright/test';


let page: PageWrapper;

test(`Verify greeting tile for first participant @mock`, async ({ page: nativePage }) => {
    page = await PageWrapper.openMeetingPage(nativePage);

  await page.delay(40000);

});
