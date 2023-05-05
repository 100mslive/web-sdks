import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

test.beforeEach(async () => {});

test.afterEach(async () => {});

test(`Remove Peer`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, 2, {
    mic: true,
    cam: true,
  });
  await pages[0].hover(pages[0].center.participant_tile.replace("?", pages[1].localName));
  await pages[0].click(pages[0].center.participant_tile_menu_btn.replace("?", pages[1].localName));
  await pages[0].click(pages[0].center.tile_menu_remove_participant);

  await pages[0].assertNotVisible(
    pages[0].center.participant_tile.replace("?", pages[1].localName)
  );
  await pages[1].assertVisible(pages[1].center.join_again_btn);
  //add verify and the other peer is still in the room

  await pages[0].endRoom();
  await context.close();
});
