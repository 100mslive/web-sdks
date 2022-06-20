import { PageWrapper } from "../../PageWrapper";
import { expect, test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async () => {});

test.afterEach(async () => {
  console.log("aftereach");
  await page.endRoom();
  await page.close();
});

test.describe("verify join", () => {
  test(`Verify Join Mic-On Cam-On`, async ({ page: nativePage }) => {
    page = await PageWrapper.openMeetingPage(nativePage, {
      mic: true,
      cam: true,
    });

    await page.assertVisible(page.footer.meeting_audio_on_btn);
    await page.click(page.footer.meeting_audio_btn);
    await page.assertVisible(page.footer.meeting_audio_off_btn);
    await page.click(page.footer.meeting_audio_btn);

    await page.assertVisible(page.footer.meeting_video_on_btn);
    await page.click(page.footer.meeting_video_btn);
    await page.assertVisible(page.footer.meeting_video_off_btn);
    await page.click(page.footer.meeting_video_btn);
  });

  test(`Verify Join Mic-On Cam-Off`, async ({ page: nativePage }) => {
    page = await PageWrapper.openMeetingPage(nativePage, {
      mic: true,
      cam: false,
    });

    await page.assertVisible(page.footer.meeting_audio_on_btn);
    await page.click(page.footer.meeting_audio_btn);
    await page.assertVisible(page.footer.meeting_audio_off_btn);
    await page.click(page.footer.meeting_audio_btn);

    await page.assertVisible(page.footer.meeting_video_off_btn);
    await page.click(page.footer.meeting_video_btn);
    await page.assertVisible(page.footer.meeting_video_on_btn);
    await page.click(page.footer.meeting_video_btn);
  });

  test(`Verify Join Mic-Off Cam-On`, async ({ page: nativePage }) => {
    page = await PageWrapper.openMeetingPage(nativePage, {
      mic: false,
      cam: true,
    });

    await page.assertVisible(page.footer.meeting_audio_off_btn);
    await page.click(page.footer.meeting_audio_btn);
    await page.assertVisible(page.footer.meeting_audio_on_btn);
    await page.click(page.footer.meeting_audio_btn);

    await page.assertVisible(page.footer.meeting_video_on_btn);
    await page.click(page.footer.meeting_video_btn);
    await page.assertVisible(page.footer.meeting_video_off_btn);
    await page.click(page.footer.meeting_video_btn);
  });

  test(`Verify Join Mic-Off Cam-Off`, async ({ page: nativePage }) => {
    page = await PageWrapper.openMeetingPage(nativePage, {
      mic: false,
      cam: false,
    });
    await page.assertVisible(page.footer.meeting_audio_off_btn);
    await page.click(page.footer.meeting_audio_btn);
    await page.assertVisible(page.footer.meeting_audio_on_btn);
    await page.click(page.footer.meeting_audio_btn);

    await page.assertVisible(page.footer.meeting_video_off_btn);
    await page.click(page.footer.meeting_video_btn);
    await page.assertVisible(page.footer.meeting_video_on_btn);
    await page.click(page.footer.meeting_video_btn);
  });

  test(`Measure Join Time`, async ({ page: nativePage }) => {
    const url = process.env.audio_video_screenshare_url.replace("meeting", "leave");
    page = new PageWrapper(nativePage);
    await page.goto({ url });

    await page.click(page.center.join_again_btn);
    console.log("Calculating Join Time");
    const start = performance.now();
    await page.gotoMeetingRoom();
    const diff = performance.now() - start;
    console.log(`Join Time Difference = ${diff}`);
    expect(diff).toBeLessThan(10000);
  });
});
