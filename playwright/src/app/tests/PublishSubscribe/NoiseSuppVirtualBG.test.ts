import { PageWrapper } from '../../PageWrapper';
import { expect, test } from '@playwright/test';

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage, { cam: true });
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test(`Verify virtual background`, async () => {
  const virtualBg = page.locator(page.footer.virtual_bg_btn);
  const btnDisabled = /active-true/;
  const btnEnabled = /active-false/;
  await expect(virtualBg).toHaveClass(btnDisabled);
  await virtualBg.click();
  await page.delay(3000);
  await expect(virtualBg).toHaveClass(btnEnabled);
  await virtualBg.click();
  await page.delay(3000);
  await expect(virtualBg).toHaveClass(btnDisabled);
});
