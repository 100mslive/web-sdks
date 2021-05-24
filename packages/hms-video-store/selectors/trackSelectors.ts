import { HMSPeer, HMSPeerID, HMSStore, HMSTrack, HMSTrackID } from '../schema';
import { selectLocalPeer, selectPeerByID, selectPeers } from './peerSelectors';
import { createSelector } from 'reselect';

export const selectTracksMap = (store: HMSStore) => store.tracks;
export const trackIDSelector = (store: HMSStore, trackID: HMSTrackID) =>
  trackID;

export const selectLocalAudioTrackID = createSelector(
  selectLocalPeer,
  peer => peer?.audioTrack,
);

export const selectLocalVideoTrackID = createSelector(
  selectLocalPeer,
  peer => peer?.videoTrack,
);

export const selectIsLocalAudioEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackEnabled(store, localPeer?.audioTrack);
};

export const selectIsLocalVideoEnabled = (store: HMSStore) => {
  const localPeer = selectLocalPeer(store);
  return isTrackEnabled(store, localPeer?.videoTrack);
};

export const selectIsPeerAudioEnabled = (store: HMSStore, peerID: string) => {
  const peer = selectPeerByID(store, peerID);
  return isTrackEnabled(store, peer?.audioTrack);
};

export const selectIsPeerVideoEnabled = (store: HMSStore, peerID: string) => {
  const peer = selectPeerByID(store, peerID);
  return isTrackEnabled(store, peer?.videoTrack);
};

export const selectIsLocalScreenShared = (store: HMSStore): boolean => {
  const localPeer = selectLocalPeer(store);
  return isScreenSharing(store, localPeer);
};

export const selectIsSomeoneScreenSharing = (store: HMSStore): boolean => {
  const peers = selectPeers(store);
  return peers.some(peer => isScreenSharing(store, peer))
};

export const selectPeerScreenSharing = (store: HMSStore): HMSPeer | undefined => {
  const peers = selectPeers(store);
  return peers.find(peer => isScreenSharing(store, peer));
}

export const selectScreenShareByPeerID = (store: HMSStore, peerID: HMSPeerID): HMSTrack | undefined => {
  const peer = selectPeerByID(store, peerID);
  if (peer && isScreenSharing(store, peer)) {
    const trackID = peer?.auxiliaryTracks.find(trackID => isScreenShare(store.tracks[trackID]));
    return trackID ? store.tracks[trackID] : undefined;
  }
  return undefined;
}

export const selectCameraStreamByPeerID = (store: HMSStore, peerID: HMSPeerID): HMSTrack | undefined => {
  const peer = selectPeerByID(store, peerID);
  if (peer && peer.videoTrack && (peer.videoTrack !== "")){
    return store.tracks[peer.videoTrack];
  }
  return undefined;
}

function isScreenSharing(store: HMSStore, peer: HMSPeer) {
  return peer && peer.auxiliaryTracks.some(trackID => {
    if (trackID && store.tracks[trackID]) {
      const track = store.tracks[trackID];
      return isScreenShare(track);
    }
    return false;
  })
}

function isScreenShare(track: HMSTrack | undefined) {
  return track && track.type === 'video' && track.source === 'screen';
}

function isTrackEnabled(store: HMSStore, trackID?: string) {
  if (trackID && store.tracks[trackID]) {
    return store.tracks[trackID].enabled;
  }
  return false;
}
