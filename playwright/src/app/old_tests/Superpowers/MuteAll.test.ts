import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

test.beforeEach(async () => {});

test.afterEach(async () => {});

const peersCount = Number(process.env.multi_peer_count);

test(`Mute All`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, peersCount, {
    mic: true,
    cam: true,
  });
  await pages[0].timeout(5000);
  await pages[0].footer.muteAll();

  // peer tile has muted
  for (let i = 1; i < peersCount; i++) {
    // my footer is showing me muted
    await pages[i].assertLocalAudioState(false);
    await pages[i].assertLocalVideoState(false);

    // others are seeing me as muted on video tile
    for (let j = 0; j < peersCount; j++) {
      await pages[j].center.assertAudioState(pages[i].localName, false);
    }
  }

  await pages[0].endRoom();
  await context.close();
});
