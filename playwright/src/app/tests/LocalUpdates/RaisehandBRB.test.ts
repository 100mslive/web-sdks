import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test(`Verify Raise Hand Brb on Tile`, async () => {
  for (let i = 0; i < 3; i++) {
    await page.timeout(3000);
    await page.click(page.footer.raise_hand_btn);
    await page.assertVisible(page.center.raiseHand_icon_onTile);
    await page.assertNotVisible(page.center.brb_icon_onTile);
    await page.timeout(3000);
    await page.click(page.footer.brb_btn);
    await page.assertVisible(page.center.brb_icon_onTile);
    await page.assertNotVisible(page.center.raiseHand_icon_onTile);
  }
});
