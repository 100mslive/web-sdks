import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }, testInfo) => {
    page = await PageWrapper.openMeetingPage(nativePage);
    if (testInfo.retry) {
      await page.delay(2000);
    }
  });
  
  test.afterEach(async () => {
    await page.endRoom();
    await page.close();
  });


  test(`Verify change layout window`, async () => {

    await page.footer.openMoreSettings();
    await page.click(page.footer.device_settings_btn);
    await expect(page.locator(page.footer.layout_button)).toBeEnabled();
    await page.click(page.footer.layout_button);
    
    await expect(page.locator(page.footer.activespeaker_toggle)).toBeEnabled();
    //await expect(page.locator(page.footer.activespeakersorting_toggle)).toBeEnabled();
    await expect(page.locator(page.footer.audioonly_toggle)).toBeEnabled();
    await expect(page.locator(page.footer.mirrorlocal_toggle)).toBeEnabled();
    await expect(page.locator(page.footer.hidelocal_toggle)).toBeEnabled();
    await expect(page.locator(page.footer.tilesinview_bar)).toBeEnabled();

  });
  