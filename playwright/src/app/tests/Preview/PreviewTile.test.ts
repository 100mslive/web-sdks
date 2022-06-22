import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = new PageWrapper(nativePage);
  await page.preview.gotoPreviewPage();
});

test.afterEach(async () => {
  await page.close();
});

// test.afterEach(async ({page}) => {
//     await pageMethods.clickElement(page, previewPage.preview_video_btn, "preview_video_btn")
//     await page.close()
// });

test(`Verify MicBtn on off`, async () => {
  await page.assertVisible(page.preview.preview_audio_on_btn);
  await page.click(page.preview.preview_audio_btn);
  await page.assertVisible(page.preview.preview_audio_off_btn);
  await page.click(page.preview.preview_audio_btn);
  await page.assertVisible(page.preview.preview_audio_on_btn);
});

test(`Verify CamBtn on off`, async () => {
  await page.assertVisible(page.preview.preview_video_on_btn);
  await page.click(page.preview.preview_video_btn);
  await page.assertVisible(page.preview.preview_video_off_btn);
  await page.click(page.preview.preview_video_btn);
  await page.assertVisible(page.preview.preview_video_on_btn);
});

test(`Verify video tile and avatar tile`, async () => {
  // await previewPage.SendName(page, name);
  await page.assertVisible(page.preview.preview_video_on_btn);
  await page.assertVisible(page.preview.preview_tile);
  await page.assertNotVisible(page.preview.preview_avatar_tile);

  await page.click(page.preview.preview_video_btn);
  await page.assertVisible(page.preview.preview_video_off_btn);
  await page.assertVisible(page.preview.preview_avatar_tile);
});
