import { createSelector } from 'reselect';
import { selectPeersMap, selectTracksMap } from './selectors';
import { HMSPeerID, HMSStore, HMSTrack, HMSTrackID } from '../schema';
import { isAudio, isScreenShare, isScreenSharing, isTrackEnabled, isVideo } from './selectorUtils';
import { HMSLogger } from '../../common/ui-logger';

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

export const selectVideoTrackByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.videoTrack && peer.videoTrack !== '') {
    return store.tracks[peer.videoTrack];
  }
  return undefined;
});

export const selectAudioTrackByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && peer.audioTrack && peer.audioTrack !== '') {
    return store.tracks[peer.audioTrack];
  }
  return undefined;
});

export const selectCameraStreamByPeerID = selectVideoTrackByPeerID;

export const selectAuxiliaryTracksByPeerID = byIDCurry(
  (store: HMSStore, peerID?: HMSPeerID): HMSTrack[] => {
    const peer = selectPeerByIDBare(store, peerID);
    return peer?.auxiliaryTracks.map(trackID => store.tracks[trackID]) || [];
  },
);

const selectSpeakerByTrackID = (store: HMSStore, trackID: HMSTrackID | undefined) => {
  return trackID ? store.speakers[trackID] : null;
};

/**
 * Selects audio level of a track
 */
export const selectTrackAudioByID = byIDCurry(
  createSelector(selectSpeakerByTrackID, speaker => speaker?.audioLevel || 0),
);

/**
 * Selects speaker object of audioTrack of a peer.
 */
const selectSpeakerByPeerID = (store: HMSStore, peerID: HMSPeerID | undefined) => {
  const peerAudioTrack = selectAudioTrackByPeerID(peerID)(store);
  return selectSpeakerByTrackID(store, peerAudioTrack?.id);
};

/**
 * Selects audio level of audioTrack of a peer.
 */
export const selectPeerAudioByID = byIDCurry(
  createSelector(selectSpeakerByPeerID, speaker => speaker?.audioLevel || 0),
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
    const trackID = peer?.auxiliaryTracks.find(trackId => {
      const track = store.tracks[trackId];
      return isVideo(track) && isScreenShare(track);
    });
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
});

export const selectScreenShareAudioByPeerID = byIDCurry((store: HMSStore, peerID?: HMSPeerID):
  | HMSTrack
  | undefined => {
  const peer = selectPeerByIDBare(store, peerID);
  if (peer && isScreenSharing(store, peer)) {
    const trackID = peer?.auxiliaryTracks.find(trackId => {
      const track = store.tracks[trackId];
      return isAudio(track) && isScreenShare(track);
    });
    return trackID ? store.tracks[trackID] : undefined;
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

export const selectIsAudioLocallyMuted = byIDCurry((store: HMSStore, trackID?: string) => {
  if (trackID && store.tracks[trackID]) {
    return store.tracks[trackID].volume === 0;
  }
  HMSLogger.w('Track not found', trackID);
  return undefined;
});

export const selectIsLocallyMutedByPeerID = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return selectIsAudioLocallyMuted(peer?.audioTrack)(store);
});

export const selectIsScreenShareLocallyMutedByPeerID = byIDCurry(
  (store: HMSStore, peerID?: string) => {
    const track = selectScreenShareAudioByPeerID(peerID)(store);
    return selectIsAudioLocallyMuted(track?.id)(store);
  },
);

export const selectAudioTrackVolume = byIDCurry((store: HMSStore, trackID?: string) => {
  const track = selectTrackByIDBare(store, trackID);
  if (track) {
    if (track.type !== 'audio') {
      HMSLogger.w('Please pass audio track here');
      return undefined;
    }
    return track.volume;
  }
  return undefined;
});

export const selectAudioVolumeByPeerID = byIDCurry((store: HMSStore, peerID?: string) => {
  const peer = selectPeerByIDBare(store, peerID);
  return selectAudioTrackVolume(peer?.audioTrack)(store);
});

export const selectScreenshareAudioVolumeByPeerID = byIDCurry(
  (store: HMSStore, peerID?: string) => {
    const track = selectScreenShareAudioByPeerID(peerID)(store);
    return selectAudioTrackVolume(track?.id)(store);
  },
);

export const selectSimulcastLayerByTrack = byIDCurry((store: HMSStore, trackID?: string) => {
  const track = selectTrackByIDBare(store, trackID);
  if (track) {
    if (track.type !== 'video') {
      HMSLogger.w('Please pass video track here');
      return undefined;
    }
    return track.layer;
  }
  return undefined;
});
