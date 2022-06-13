import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

test.beforeEach(async () => {});

test.afterEach(async () => {});

test(`Remote Mute/Unmute Audio`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, 2, {
    mic: true,
    cam: true,
  });

  await pages[0].hover(pages[0].center.participant_tile.replace("?", pages[1].localName));
  await pages[0].click(pages[0].center.participant_tile_menu_btn.replace("?", pages[1].localName));
  await pages[0].click(pages[0].center.tile_menu_mute_audio);
  await pages[1].assertLocalAudioState(false);

  await pages[0].click(pages[0].center.tile_menu_mute_audio);
  await pages[1].timeout(2000);
  await pages[1].click(pages[0].center.dialog_accept);
  await pages[1].assertLocalAudioState(true);

  //add more verify
  await pages[0].endRoom();
  await context.close();
});

test(`Remote Mute/Unmute Video`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, 2, {
    mic: true,
    cam: true,
  });

  await pages[0].hover(pages[0].center.participant_tile.replace("?", pages[1].localName));
  await pages[0].click(pages[0].center.participant_tile_menu_btn.replace("?", pages[1].localName));
  await pages[0].click(pages[0].center.tile_menu_mute_video);
  await pages[1].assertLocalVideoState(false);

  await pages[0].click(pages[0].center.tile_menu_unmute_video);
  await pages[1].timeout(2000);
  await pages[1].click(pages[0].center.dialog_accept);
  await pages[1].assertLocalVideoState(true);

  //add more verify
  await pages[0].endRoom();
  await context.close();
});
