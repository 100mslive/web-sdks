import { PageWrapper } from "../../PageWrapper";
import { test } from "@playwright/test";

test.beforeEach(async () => {});

test.afterEach(async () => {});

const peersCount = Number(process.env.multi_peer_count);

test(`Send msg to everyone`, async ({ context }) => {
  const msg = 'Hello, how are you ?';
  const pages = await PageWrapper.openPages(context, peersCount);
  await pages[0].sendMessage(msg, 'all', );
  for (let i = 1; i < peersCount; i++) {
    await pages[i].click(pages[i].footer.chat_btn);
    await pages[i].hasText(pages[i].footer.first_chat_msg, msg);
  }
  await context.close();
});

test(`Send msg to particular peer`, async ({ context }) => {
  const msg = 'Hello, how are you ?';
  const pages = await PageWrapper.openPages(context, peersCount);
  const peerName = pages[1].localName;
  await pages[0].sendMessage(msg, peerName);
  for (let i = 1; i < peersCount; i++) {
  await pages[i].click(pages[i].footer.chat_btn);
  }
  await pages[0].hasText(pages[0].footer.first_chat_msg, msg);
  await pages[1].hasText(pages[1].footer.first_chat_msg, msg);
  await pages[2].assertNotVisible(pages[2].footer.first_chat_msg);
  await context.close();
});

test(`Send msg to peers with specific role`, async ({ context }) => {
  const msg = 'Hello, how are you ?';
  const pages = await PageWrapper.openPages(context, peersCount);
  const roleName = 'audio-video-sshare';
  await pages[0].sendMessage(msg, roleName);
  for (let i = 1; i < peersCount; i++) {
  await pages[i].click(pages[i].footer.chat_btn);
  await pages[i].hasText(pages[i].footer.first_chat_msg, msg);
  await pages[i].hasText(pages[i].footer.chat_to_text, "to(audio-video-sshare)");
  } 
  await context.close();
});