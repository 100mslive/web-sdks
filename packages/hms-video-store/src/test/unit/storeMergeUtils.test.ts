import { HMSPeer, HMSPeerID, HMSTrack, HMSTrack as SDKTrack, HMSTrackID, HMSVideoTrack } from '../../';
import { mergeNewPeersInDraft, mergeNewTracksInDraft } from '../../reactive-store/sdkUtils/storeMergeUtils';
import { makeFakePeer, makeFakeTrack } from '../fixtures';

type trackMap = Record<HMSTrackID, HMSTrack>;
type peerMap = Record<HMSTrackID, HMSPeer>;
let newTracks: Record<HMSTrackID, Partial<HMSTrack>>;

describe('tracks merge is happening properly', () => {
  let fakeTrack: HMSVideoTrack;
  let draftTracksCopy: Record<HMSTrackID, Partial<HMSTrack>>;
  let draftTracks: Record<HMSTrackID, Partial<HMSTrack>>;
  beforeEach(() => {
    draftTracks = {};
    newTracks = {};
    draftTracksCopy = draftTracks;
    fakeTrack = makeFakeTrack('video');
  });

  const expectNoReferenceChange = () => {
    expect(draftTracks).toBe(draftTracksCopy);
  };

  test('no errors with empty tracks', () => {
    mergeNewTracksInDraft(draftTracks as trackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks).toEqual({});
  });

  test('track is deleted from draft if gone', () => {
    draftTracks[fakeTrack.id] = fakeTrack;
    mergeNewTracksInDraft(draftTracks as trackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks).toEqual({});
  });

  test('new track is added to draft', () => {
    newTracks[fakeTrack.id] = fakeTrack;
    mergeNewTracksInDraft(draftTracks as trackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks).toEqual(newTracks);
  });

  test('old track update maintains reference on update', () => {
    const clonedTrack = { ...fakeTrack, enabled: true, height: 357 };
    draftTracks[fakeTrack.id] = fakeTrack;
    newTracks[clonedTrack.id] = clonedTrack;
    mergeNewTracksInDraft(draftTracks as trackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks[fakeTrack.id]).toBe(fakeTrack);
    expect(fakeTrack.enabled).toBe(true);
    expect(fakeTrack.height).toBe(357);
    expect(fakeTrack).not.toBe(clonedTrack);
  });

  test('partial update does not override older data', () => {
    const clonedTrack = { ...fakeTrack };
    fakeTrack.height = 450;
    draftTracks[fakeTrack.id] = fakeTrack;
    newTracks[clonedTrack.id] = clonedTrack;
    mergeNewTracksInDraft(draftTracks as trackMap, newTracks);
    expectNoReferenceChange();
    expect(fakeTrack.height).toBe(450);
    expect(clonedTrack.height).toBeUndefined();
  });
});

describe('peers merge is happening properly', () => {
  let fakePeer: HMSPeer;
  let draftPeersCopy: Record<HMSPeerID, Partial<HMSPeer>>;
  const draftPeers: Record<HMSPeerID, Partial<HMSPeer>> = {};
  const newPeers: Record<HMSPeerID, Partial<HMSPeer>> = {};
  const newSDKTracks: Record<HMSTrackID, SDKTrack> = {};
  beforeEach(() => {
    newTracks = {};
    draftPeersCopy = draftPeers;
    fakePeer = makeFakePeer();
    const audio = makeFakeTrack('audio');
    const video = makeFakeTrack('video');
    const screenshare = makeFakeTrack('video');
    newTracks[audio.id] = audio;
    newTracks[video.id] = video;
    newTracks[screenshare.id] = screenshare;
    fakePeer.audioTrack = audio.id;
    fakePeer.videoTrack = video.id;
    fakePeer.auxiliaryTracks = [screenshare.id];
    newSDKTracks[audio.id] = {} as SDKTrack;
    newSDKTracks[video.id] = {} as SDKTrack;
    newSDKTracks[screenshare.id] = {} as SDKTrack;
  });

  const expectNoReferenceChange = () => {
    expect(draftPeers).toBe(draftPeersCopy);
  };

  test('no errors with empty peers', () => {
    mergeNewPeersInDraft(draftPeers as peerMap, newPeers);
    expectNoReferenceChange();
    expect(draftPeers).toEqual({});
  });

  test('peer is deleted from draft if gone', () => {
    draftPeers[fakePeer.id] = fakePeer;
    mergeNewPeersInDraft(draftPeers as peerMap, newPeers);
    expectNoReferenceChange();
    expect(draftPeers).toEqual({});
  });

  test('new peer is added to draft', () => {
    newPeers[fakePeer.id] = fakePeer;
    mergeNewPeersInDraft(draftPeers as peerMap, newPeers);
    expectNoReferenceChange();
    expect(draftPeers).toEqual(newPeers);
  });

  test('old peer update maintains reference on update', () => {
    const clonedPeer = {
      ...fakePeer,
      roleName: 'host',
      auxiliaryTracks: [...fakePeer.auxiliaryTracks],
    };
    draftPeers[fakePeer.id] = fakePeer;
    newPeers[clonedPeer.id] = clonedPeer;
    mergeNewPeersInDraft(draftPeers as peerMap, newPeers);
    expectNoReferenceChange();
    expect(draftPeers[fakePeer.id]).toBe(fakePeer);
    expect(draftPeers[fakePeer.id].auxiliaryTracks).toBe(fakePeer.auxiliaryTracks);
    expect(fakePeer.name).toBe('test');
    expect(fakePeer.roleName).toBe('host');
    expect(fakePeer).not.toBe(clonedPeer); // test object.assign happened properly
  });

  test('partial update does not override older data', () => {
    const clonedPeer = { ...fakePeer };
    fakePeer.roleName = 'random';
    draftPeers[fakePeer.id] = fakePeer;
    newPeers[clonedPeer.id] = clonedPeer;
    mergeNewPeersInDraft(draftPeers as peerMap, newPeers);
    expectNoReferenceChange();
    expect(fakePeer.roleName).toBe('random');
    expect(clonedPeer.roleName).toBeUndefined();
  });

  test('replace track does not change peer.videoTrack', () => {
    fakePeer.isLocal = true;
    draftPeers[fakePeer.id] = fakePeer;
    const newVideo = makeFakeTrack('video');
    const clonedPeer = { ...fakePeer, videoTrack: newVideo.id };
    const newSDKTrack = {} as SDKTrack;
    newSDKTracks[newVideo.id] = newSDKTrack;
    if (fakePeer.videoTrack) {
      // remove older one
      delete newTracks[fakePeer.videoTrack];
      delete newSDKTracks[fakePeer.videoTrack];
    }
    newTracks[newVideo.id] = newVideo;
    newPeers[clonedPeer.id] = clonedPeer;
    mergeNewPeersInDraft(draftPeers as peerMap, newPeers);
    expect(draftPeers[fakePeer.id]).toBe(fakePeer);
    expect(draftPeers[fakePeer.id].videoTrack).toBe(fakePeer.videoTrack);
    // ensure the unchanged video track id can be used to get the new sdk track
    expect(newSDKTrack).toBe(fakePeer.videoTrack && newSDKTracks[fakePeer.videoTrack]);
  });
});
