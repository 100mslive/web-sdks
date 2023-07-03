import create from 'zustand';
import { createDefaultStoreState, HMSReactiveStore, HMSStore } from '@100mslive/react-sdk';
import { StoryBookSDK } from './StorybookSDK';
import { fakeMessages } from '../fixtures/chats';
import { fakeParticipants } from '../fixtures/peers';

const store = HMSReactiveStore.createNewHMSStore('HMSStore', createDefaultStoreState);

// @ts-ignore
export const storyBookStore = create<HMSStore>(store);
export const storyBookSDK = new StoryBookSDK(store);

const videoURLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

export function setUpFakeStore() {
  storyBookSDK.addTestRoom({
    id: '123',
    name: 'storybook room',
    peers: [],
  });
  storyBookSDK.addTestVideoURLs(videoURLS);
  fakeParticipants.forEach(peerWithMute => {
    storyBookSDK.addTestPeerAndSpeaker(peerWithMute.peer);
  });
  fakeMessages.forEach(msg => {
    storyBookSDK.sendBroadcastMessage(msg.message);
  });
}
