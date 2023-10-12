import { test } from '@playwright/test';
import { PageWrapper } from '../PageWrapper';

const URL = 'https://prebuilt-automation.qa-app.100ms.live/preview/651d164fa1eeca31647ebc6f/broadcaster';
let page: PageWrapper;

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
  await context.close();
});
const testdata = [
  {
    testCaseNo: 1,
    feature: 'title',
    state: 'visible',
    value: 'Custom Title',
    assert: 'text=Custom Title',
  },
  {
    testCaseNo: 2,
    feature: 'subTitle',
    state: 'visible',
    value: 'Custom Sub Title',
    assert: 'text=Custom Sub Title',
  },
  {
    testCaseNo: 3,
    feature: 'joinButton',
    state: 'visible',
    value: 'JOIN_BTN_TYPE_JOIN_ONLY',
    assert: 'text=Join Now',
  },
  {
    testCaseNo: 4,
    feature: 'joinButton',
    state: 'visible',
    value: 'JOIN_BTN_TYPE_JOIN_AND_GO_LIVE',
    assert: 'text=Go Live',
  },
];
testdata.forEach(data => {
  test(`${data.testCaseNo} ${data.feature} on preview is customizable and should be ${data.value}`, async ({
    page: nativePage,
  }) => {
    page = await PageWrapper.openMeetingPage(nativePage);
    await page.goto({ url: URL });
    await page.interceptAndMockLayoutApi(data);
    console.log(data.assert);
    if (data.state === 'visible') {
      await page.assertVisible(`${data.assert}`);
    } else if (data.state === 'hidden') {
      await page.assertNotVisible(`${data.assert}`);
    }
    await page.delay(4000);
  });
});
