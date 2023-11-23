import { test } from '@playwright/test';

const roomCodes = {
  in: 'vyc-uptg-icu',
  us: 'gmo-cosl-ecj',
  eu: 'sxf-icek-ecp',
};
const baseUrl = 'https://automation2.app.100ms.live/meeting/';
const JoinBtn = 'Join Now';

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
  await context.close();
});

const regions = ['in', 'eu', 'us'];

regions.forEach(data => {
  test(`User is able to join ${data} room.`, async ({ page: nativePage }) => {
    const region = `${data}`;
    const URL = baseUrl + roomCodes[region];
    console.log(`Region - `, region);
    console.log(`URL - `, URL);
    await nativePage.goto(URL);
    await nativePage.getByPlaceholder('Enter name').fill('Automation User');
    await nativePage.getByText(JoinBtn).click();
    await nativePage.waitForTimeout(2000);
    await nativePage.getByTestId('participant_video_tile').isVisible();
    await nativePage.getByTestId('footer').isVisible();
    await nativePage.getByTestId('header').isVisible();
  });
});
