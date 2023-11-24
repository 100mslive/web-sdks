import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

let page: PageWrapper;
const name = `${process.env.peer_name}1`;
test.beforeEach(async ({ page: nativePage }) => {
  page = new PageWrapper(nativePage);
  await page.prepreview.gotoPreviewPage(name);
});

test.afterEach(async () => {
  await page.close();
});

test(`Verify Network Btn`, async () => {
  await page.assertVisible(page.preview.preview_tile_network);
});

test(`Verify Preview Settings Btn`, async () => {
  await page.click(page.preview.preview_audio_btn, page.preview.preview_setting_btn);

  for (let i = 0; i < page.preview.preview_setting_btn_list.length; i++) {
    await page.assertVisible(
      page.preview.dialoge_select_settings.replace('?', page.preview.preview_setting_btn_list[i]),
    );
  }
  await page.click(page.preview.dialoge_cross_icon);
});
