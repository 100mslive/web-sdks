import { PageWrapper } from '../../PageWrapper';
import { test } from '@playwright/test';

const peersCount = Number(process.env.multi_peer_count);
let pages: PageWrapper[];
test.beforeEach(async ({ context }) => {
  pages = await PageWrapper.openPages(context, peersCount);
});

test.afterEach(async () => {
  pages[0].endRoom();
});

test(`Send msg to everyone`, async () => {
  const msg = 'Hello, how are you ?';
  await pages[0].sendMessage(msg, 'all');
  for (let i = 1; i < peersCount; i++) {
    await pages[i].click(pages[i].footer.chat_btn);
    await pages[i].hasText(pages[i].footer.first_chat_msg, msg);
  }
});

// to be fixed
test.skip(`Send msg to particular peer`, async () => {
  const msg = 'Hello, how are you ?';
  const peerName = pages[1].localName;
  await pages[0].sendMessage(msg, peerName);
  for (let i = 1; i < peersCount; i++) {
    await pages[i].click(pages[i].footer.chat_btn);
  }
  await pages[1].hasText(pages[1].footer.first_chat_msg, msg);
});

test(`Send msg to peers with specific role`, async () => {
  const msg = 'Hello, how are you ?';
  const roleName = 'audio-video-sshare';
  await pages[0].sendMessage(msg, roleName);
  for (let i = 1; i < peersCount; i++) {
    await pages[i].click(pages[i].footer.chat_btn);
    await pages[i].hasText(pages[i].footer.first_chat_msg, msg);
    await pages[i].hasText(pages[i].footer.first_chat_msg, 'TOaudio-video-sshare');
  }
});
