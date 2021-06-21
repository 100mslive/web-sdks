import { createSelector } from 'reselect';
import { selectPeersMap, selectTracksMap } from './selectors';
import { HMSPeerID, HMSStore, HMSTrack } from '../schema';
import { isAudio, isScreenShare, isScreenSharing, isTrackEnabled } from './selectorUtils';

type byIDSelector<T> = (store: HMSStore, id?: string) => T;

/**
 * takes in a normal selector which has store and id as input and curries it to make it easier to use.
 * Before: store.getState((store) => normalSelector(store, peerID))
 * After: store.getState(curriedSelector(peerID))
 */
function byIDCurry<T>(selector: byIDSelector<T>): (id?: string) => (store: HMSStore) => T {
  return (id?: string) => {
    return (store: HMSStore) => selector(store, id);
  };
}

const selectPeerID = (_store: HMSStore, peerID: HMSPeerID | undefined) => peerID;

const selectPeerByIDBare = createSelector([selectPeersMap, selectPeerID], (storePeers, peerID) =>
  peerID ? storePeers[peerID] : null,
);

const selectTrackByIDBare = createSelector(
  [selectTracksMap, selectPeerID],
  (storeTracks, trackID) => (trackID ? storeTracks[trackID] : null),
);

export const selectPeerByID = byIDCurry(selectPeerByIDBare);

export const selectPeerNameByID = byIDCurry(createSelector(selectPeerByIDBare, peer => peer?.name));

export const selectTrackByID = byIDCurry(selectTrackByIDBare);

const selectSpeakerByID = (store: HMSStore, peerID: HMSPeerID | undefined) => {
  return peerID ? store.speakers[peerID] : null;
};

export const selectPeerAudioByID = byIDCurry(
  createSelector(selectSpeakerByID, speaker => speaker?.audioLevel || 0),
);

export const selectAuxiliaryAudioByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer) {
    const trackID = peer?.auxiliaryTracks.find(trackID => isAudio(store.tracks[trackID]));
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
});

export const selectScreenShareByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && isScreenSharing(store, peer)) {
    const trackID = peer?.auxiliaryTracks.find(trackID => isScreenShare(store.tracks[trackID]));
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
});

export const selectCameraStreamByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.videoTrack && peer.videoTrack !== '') {
    return store.tracks[peer.videoTrack];
  }
  return undefined;
});

export const selectIsPeerAudioEnabled = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return isTrackEnabled(store, peer?.audioTrack);
});

export const selectIsPeerVideoEnabled = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return isTrackEnabled(store, peer?.videoTrack);
});
