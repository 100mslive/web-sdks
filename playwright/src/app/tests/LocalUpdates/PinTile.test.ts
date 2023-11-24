import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let pages: PageWrapper[];
let local_name: string;
let tile_name: string;

test.beforeEach(async ({ context }) => {
  pages = await PageWrapper.openPages(context, 2, {
    mic: true,
    cam: true,
  });
  await pages[0].delay(2000);
  local_name = pages[0].localName;
  tile_name = pages[0].center.participant_tile.replace('?', local_name);
});

test.afterEach(async ({ context }) => {
  await pages[0].endRoom();
  await context.close();
});

test(`Pin/unpin tile for yourself`, async () => {
  await pages[0].hover(tile_name);
  await pages[0].click(pages[0].center.participant_tile_menu_btn.replace('?', local_name));
  await pages[0].click(pages[0].center.tile_menu_pin_tile);
  await pages[0].delay(1000);
  await pages[0].hover(tile_name);
  await pages[0].click(pages[0].center.participant_tile_menu_btn.replace('?', local_name));
  await pages[0].click(pages[0].center.tile_menu_unpin_tile);
});
