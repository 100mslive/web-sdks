import { PageWrapper } from "../../PageWrapper";
import { expect, test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async () => {});

test.afterEach(async () => {});

test(`Verify greeting tile for first participant`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.assertVisible(page.center.first_person_img);
  await page.endRoom();
  await page.close();
});

test(`Verify room URL`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  const currentURL = await page.getUrl();
  const meetingURL = currentURL.replace("preview", "meeting");
  expect(meetingURL).toContain(process.env.audio_video_screenshare_url);
  await page.endRoom();
});

const peersCount = Number(process.env.multi_peer_count);

//publishing role and non publishing roll
test(`Verify Join peers`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, peersCount);

  for (let i = 0; i < peersCount; i++) {
    await pages[i].click(pages[i].header.participant_list);
    for (let j = 0; j < peersCount; j++) {
      const participantName = pages[i].header.participant_name.replace("?", pages[j].localName);
      await pages[i].assertVisible(participantName);
      await pages[i].hasText(participantName, process.env.peer_name + j);
    }
    await pages[i].click("html");
  }
  // await pages[0].click(pages[0].header.participant_number.replace("?","0"))
  await pages[0].endRoom();
  await context.close();
});

test(`Verify network on tile and peerlist`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, 2, { mic: true, cam: true });
  for (let i = 0; i < 2; i++) {
    await pages[i].click(
      pages[i].header.participant_list,
      pages[i].header.peerlist_network.replace("?", pages[i].localName)
    );
    await pages[i].assertVisible(pages[i].center.network_ontile.replace("?", pages[i].localName));
  }
  await pages[0].endRoom();
  await context.close();
});


test(`Verify emoji container text and is clickable`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.assertVisible(page.footer.emoji_btn);
  await page.click(page.footer.emoji_btn)
  await page.assertVisible(page.footer.emoji_container);

  //verify emoji container text
  await page.hasText(page.footer.emoji_container_text, page.footer.expected_emoji_container_text);
  await page.hasText(page.footer.emoji_container_href, page.footer.expected_emoji_container_href_text);
  await page.hasLink(page.footer.emoji_container_href, page.footer.expected_emoji_href_link);

  //verify emojis are clickable through iteration
  let emojis = page.locator(page.footer.emoji_container);
  let emojiCount = await emojis.count();
  for (let emoji = 0; emoji < emojiCount; emoji++) {
   await emojis.nth(emoji).click();
  }  
  // close emoji container
  await page.click("html");
  await page.endRoom();
  await page.close();
});

test(`Verify SFN cta in advanced settings`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.click(page.footer.more_settings_btn, page.footer.stats_for_nreds_btn)
  await page.hasText(page.center.sfn_onText, page.center.expected_sfn_header)
  let SFNDialogText = page.locator(page.center.sfn_dialog_texts)
  expect(await SFNDialogText.count()).not.toEqual(0);
  await page.click(page.footer.enable_sfn, page.footer.close_sfn_modal)
  await page.assertVisible(page.center.sfn_onTile)
  let SFNContent = page.locator(page.center.sfn_onTile);
  expect(await SFNContent.count()).not.toEqual(0);
  await page.endRoom();
  await page.close();
});


test(`Verify full screen page`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  // switch to full screen mode
  await page.click(page.footer.more_settings_btn, page.footer.full_screen_btn);
  let isFullScreen = await page.checkScreenMode(); 
  expect(isFullScreen).toBeTruthy();
  // switch to normal screen mode
  await page.click(page.footer.more_settings_btn, page.footer.full_screen_btn);
  isFullScreen = await page.checkScreenMode(); 
  expect(isFullScreen).not.toBeTruthy();
  await page.endRoom();
  await page.close();
});

test(`Verify valid embed url and stop embed`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.click(page.footer.more_settings_btn, page.footer.embed_url_cta);
  await page.sendText(page.footer.embed_url_text_field, page.footer.valid_embed_url)
  await page.click(page.footer.embed_cta)
  await page.assertNotVisible(page.center.first_person_img)
  await page.click(page.footer.more_settings_btn, page.footer.embed_url_cta, page.footer.stop_embed_cta);
  await page.endRoom();
  await page.close();
});

test(`Verify invalid embed url`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.click(page.footer.more_settings_btn, page.footer.embed_url_cta);
  await page.sendText(page.footer.embed_url_text_field, page.footer.invalid_embed_url)
  await page.click(page.footer.embed_cta)
  await page.assertNotVisible(page.center.first_person_img)
  expect(page.locator(page.footer.invalid_embed_link_header).isVisible).toBeTruthy();
  expect(page.locator(page.footer.inavlid_embed_link_subject).isVisible).toBeTruthy();
  await page.endRoom();
  await page.close();
});

test(`Update embed url`, async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
  await page.click(page.footer.more_settings_btn, page.footer.embed_url_cta);
  await page.sendText(page.footer.embed_url_text_field, page.footer.valid_embed_url);
  await page.click(page.footer.embed_cta);
  await page.assertNotVisible(page.center.first_person_img);
  await page.click(page.footer.more_settings_btn, page.footer.embed_url_cta);
  await page.sendText(page.footer.embed_url_text_field, page.footer.invalid_embed_url);
  await page.click(page.footer.update_embed_cta);
  await page.click(page.footer.more_settings_btn, page.footer.embed_url_cta);
  await page.hasValue(page.footer.embed_url_text_field, page.footer.invalid_embed_url);
  await page.click(page.footer.stop_embed_cta);
  await page.endRoom();
  await page.close();
});

test(`Verify PIP mode button is displayed and visible`, async({page: nativePage}) => {
  await expect(page.locator(page.header.pip_btn)).toBeEnabled();
});