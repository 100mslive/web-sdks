import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

test.beforeEach(async () => {});

test.afterEach(async () => {});

const peersCount = Number(process.env.multi_peer_count);

test(`Verify Peerlist in Preview Page`, async ({ context }) => {
  const pages = await PageWrapper.openPages(context, peersCount);

  const newPage = new PageWrapper(await context.newPage());
  await newPage.gotoPreviewPage();
  await newPage.header.openParticipantList();

  for (let i = 0; i < peersCount; i++) {
    await newPage.header.assertPeerInOpenPeerList(pages[i].localName, true);
  }
  await pages[0].endRoom();
  await context.close();
});
