import {
  HMSStore,
  selectConnectionQualityByPeerID,
  selectIsLocalAudioPluginPresent,
  selectIsLocalVideoPluginPresent,
} from '../../';
import { localAudio, localPeer, localVideo, makeFakeStore } from '../fakeStore';

let fakeStore: HMSStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeStore();
});
describe('test selectors by reference', () => {
  test('select is plugin present', () => {
    localVideo.plugins = ['plugin1', 'plugin2'];
    localAudio.plugins = ['plugin1', 'plugin2'];

    expect(selectIsLocalVideoPluginPresent('plugin1')(fakeStore)).toBe(true);
    expect(selectIsLocalVideoPluginPresent('plugin2')(fakeStore)).toBe(true);
    expect(selectIsLocalVideoPluginPresent('plugin3')(fakeStore)).toBe(false);

    expect(selectIsLocalAudioPluginPresent('plugin1')(fakeStore)).toBe(true);
    expect(selectIsLocalAudioPluginPresent('plugin2')(fakeStore)).toBe(true);
    expect(selectIsLocalAudioPluginPresent('plugin3')(fakeStore)).toBe(false);
  });

  test('connection quality', () => {
    const score = 70;
    fakeStore.connectionQualities[localPeer.id] = {
      peerID: localPeer.id,
      downlinkQuality: score,
    };
    expect(selectConnectionQualityByPeerID(localPeer.id)(fakeStore)?.downlinkQuality).toBe(score);
  });
});
