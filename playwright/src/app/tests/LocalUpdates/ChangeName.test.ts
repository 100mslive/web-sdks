import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

let page: PageWrapper;

test.beforeEach(async ({ page: nativePage }) => {
  page = await PageWrapper.openMeetingPage(nativePage);
});

test.afterEach(async () => {
  await page.endRoom();
  await page.close();
});

test(`Change name check`, async () => {
  const oldName = page.localName;
  const newName = "peer_new_name";

  await page.center.assertTilePresence(oldName, true);
  await page.header.assertPeerInPeerList(oldName, true);

  await page.footer.changeName(newName);

  // name changed for both tile and participant list
  await page.header.assertPeerInPeerList(oldName, false);
  await page.center.assertTilePresence(oldName, false);

  await page.header.assertPeerInPeerList(newName, true);
  await page.center.assertTilePresence(newName, true);

  // const peerTileName = page.center.getNameOnTile(0);
  // await page.hasText(peerTileName, "peer_2");
});
