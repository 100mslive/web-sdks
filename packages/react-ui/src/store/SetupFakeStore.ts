import create from 'zustand';
import { createDefaultStoreState, HMSReactiveStore, HMSRole, HMSStore } from '@100mslive/react-sdk';
import { StoryBookNotifications } from './StorybookNotifications';
import { StoryBookSDK } from './StorybookSDK';
import { fakeMessages } from '../fixtures/chats';
import { fakeParticipants } from '../fixtures/peers';

const store = HMSReactiveStore.createNewHMSStore('HMSStore', createDefaultStoreState);

export const storyBookStore = create<HMSStore>(store);
export const storyBookNotifications = new StoryBookNotifications(store);
export const storyBookSDK = new StoryBookSDK(store, storyBookNotifications);

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
  storyBookSDK.setRoles({
    Teacher: {
      name: 'Teacher',
      publishParams: { allowed: ['audio', 'video', 'screen'] },
      subscribeParams: {},
      permissions: { changeRole: true, unmute: true, mute: true },
    } as HMSRole,
  });
  storyBookSDK.addDevices({
    audioInput: [],
    audioOutput: [
      createMediaDeviceInfoStub({ deviceId: '1', groupId: '1', kind: 'audiooutput', label: 'Stub Audio Output 1' }),
      createMediaDeviceInfoStub({ deviceId: '2', groupId: '2', kind: 'audiooutput', label: 'Stub Audio Output 2' }),
    ],
    videoInput: [],
  });
}

function createMediaDeviceInfoStub(data: any) {
  data.__proto__ = MediaDeviceInfo.prototype;
  return data as MediaDeviceInfo;
}
