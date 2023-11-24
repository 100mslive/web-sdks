import { test } from "@playwright/test";
import { PageWrapper } from "../../PageWrapper";

test(`Beam skip preview Url check`, async ({ page: nativePage }) => {
  let url = `${process.env.audio_video_screenshare_url}?skip_preview=true`;
  url = url.replace("meeting", "preview");
  console.log("beam url", url);
  const page = new PageWrapper(nativePage);
  await page.goto({ url });
  await assertCommonBeam(page, "Beam");
  await page.assertVisible(page.center.first_person_img);
  await page.close();
});

test(`Beam skip preview + name + active speaker url check`, async ({ page: nativePage }) => {
  const peerName = `name_${Math.random()}`;
  let url = `${process.env.audio_video_screenshare_url}?skip_preview=true&name=${peerName}&ui_mode=activespeaker`;
  url = url.replace("meeting", "preview");
  console.log("beam url", url);
  const page = new PageWrapper(nativePage);
  await page.goto({ url });
  await assertCommonBeam(page, peerName);
  await page.assertNotVisible(page.center.first_person_img);
  await page.close();
});

async function assertCommonBeam(page: PageWrapper, peerName: string) {
  await page.center.assertTilePresence(peerName, true);
  await page.assertNotVisible(page.header.header);
  await page.assertNotVisible(page.footer.footer);
  await page.assertVisible(page.center.conferencing);
}
