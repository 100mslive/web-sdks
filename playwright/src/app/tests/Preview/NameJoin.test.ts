import { PageWrapper } from "../../PageWrapper";
import { expect, test } from "@playwright/test";

let page: PageWrapper;

const url = process.env.audio_video_screenshare_url;
const name = `${process.env.peer_name}1`;
test.beforeEach(async ({ page: nativePage }) => {
  page = new PageWrapper(nativePage);
  await page.preview.gotoPreviewPage();
});

test.afterEach(async () => {
  // await page.endRoom();
  await page.close();
});

test(`Verify Name Field and Join Button and Room`, async () => {
  await page.sendText(page.preview.preview_name_field, name);
  await page.click(page.preview.preview_join_btn);
  await page.endRoom();
});

test(`Verify room URL`, async () => {
  const meetingURL = (await page.getUrl()).replace("preview", "meeting");
  console.log(meetingURL);
  expect(meetingURL).toBe(url);
  await page.close();
});
