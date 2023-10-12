import { test } from '@playwright/test';
import { PageWrapper } from '../PageWrapper';

let page: PageWrapper[];

test.beforeEach(async () => {});

test.afterEach(async ({ context }) => {
  await context.close();
});

const viewers = [
  ['co-broadcaster', 'viewer-near-realtime'],
  ['co-broadcaster', 'viewer-realtime'],
];
viewers.forEach(data => {
  test(`${data[1]} is able to join stage.`, async ({ context }) => {
    page = await PageWrapper.openPages(context, data);
    await page[0].delay(5000);
    await page[0].click(page[1].center.participants);
    await page[0].click(`text=?`.replace('?', data[1]));
    await page[0].hover('div[data-testid="participant_Beam"]');
    await page[0].click('div[data-testid="participant_more_actions"]');
    await page[0].click('text=Bring to stage');
    await page[0].delay(2000);
    await page[1].click('text=Accept');
    await page[1].delay(5000);
    await page[0].assertVisible('text=viewer-on-stage');
    await page[0].assertVisible(page[0].center.participant_tile.replace('?', 'Beam'));
  });
});
