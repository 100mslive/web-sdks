import { test } from '@playwright/test';

const baseUrl = 'https://automation2.app.100ms.live/meeting/';
const JoinBtn = 'Join Now';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
  await context.close();
});


  test(`Verify Virtual background button on preview and in Room`, async ({ page: nativePage }) => {
    const URL = baseUrl + 'ufx-vfgw-yge';
    console.log(`URL - `, URL);
    await nativePage.goto(URL);
    await nativePage.getByPlaceholder('Enter name').fill('Automation User');
    await nativePage.getByTestId('virtual_bg_btn').isVisible();
    await nativePage.getByText(JoinBtn).click();
    await nativePage.waitForTimeout(2000);
    await nativePage.getByTestId('virtual_bg_btn').isVisible();
  });
