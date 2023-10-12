import { test } from '@playwright/test';
import { PageWrapper } from '../PageWrapper';

let page: PageWrapper;

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
  await context.close();
});
const testdata = [
  {
    testCaseNo: 1,
    feature: 'emojiReactions',
    state: 'visible',
    assert: 'button[data-testid="emoji_reaction_btn"]',
  },
  {
    testCaseNo: 2,
    feature: 'emojiReactions',
    state: 'hidden',
    assert: 'button[data-testid="emoji_reaction_btn"]',
  },
  {
    testCaseNo: 3,
    feature: 'participantList',
    state: 'visible',
    assert: 'button[data-testid="participant_list"]',
  },
  {
    testCaseNo: 4,
    feature: 'participantList',
    state: 'hidden',
    assert: 'button[data-testid="participant_list"]',
  },
  {
    testCaseNo: 5,
    feature: 'chatPanel',
    state: 'visible',
    value: {
      initial_state: 'CHAT_STATE_OPEN',
      is_overlay: true,
      allow_pinning_messages: true,
    },
    assert: 'text=Chat',
  },
  {
    testCaseNo: 6,
    feature: 'chatPanel',
    state: 'hidden',
    value: {
      initial_state: 'CHAT_STATE_CLOSE',
      is_overlay: true,
      allow_pinning_messages: true,
    },
    assert: 'text=Chat',
  },
];
testdata.forEach(data => {
  test(` ${data.testCaseNo} ${data.feature} should be ${data.state}`, async ({ page: nativePage }) => {
    page = await PageWrapper.openMeetingPage(nativePage);
    await page.interceptAndMockLayoutApi(data);
    console.log(data.assert);
    if (data.state === 'visible') {
      await page.assertVisible(`${data.assert}`);
      await page.click(`${data.assert}`);
    } else if (data.state === 'hidden') {
      await page.assertNotVisible(`${data.assert}`);
    }
    await page.delay(4000);
  });
});
