import { HMSPeer, HMSPeerID, HMSTrack, HMSTrackID } from '../../schema';
import SDKHMSTrack from '@100mslive/hms-video/dist/media/tracks/HMSTrack';

/**
 * updates draftPeers with newPeers ensuring minimal reference changes
 * @remarks
 * This is mutable and impure function, it modifies the passed in data to ensure
 * minimal reference changes
 * @param draftPeers the current peers object in store, an immer draft object
 * @param newPeers the latest update which needs to be stored
 * @param newHmsTracks this will be update if required
 * @param newHmsSDkTracks this is future value of local hms tacks map
 */
export const mergeNewPeersInDraft = (
  draftPeers: Record<HMSPeerID, HMSPeer>,
  newPeers: Record<HMSPeerID, Partial<HMSPeer>>,
  newHmsTracks: Record<HMSTrackID, Partial<HMSTrack>>,
  newHmsSDkTracks: Record<HMSTrackID, SDKHMSTrack>,
) => {
  const peerIDs = union(Object.keys(draftPeers), Object.keys(newPeers));
  for (let peerID of peerIDs) {
    const oldPeer = draftPeers[peerID];
    const newPeer = newPeers[peerID];
    if (isEntityUpdated(oldPeer, newPeer)) {
      if (areArraysEqual(oldPeer.auxiliaryTracks, newPeer.auxiliaryTracks)) {
        newPeer.auxiliaryTracks = oldPeer.auxiliaryTracks;
      }
      handleLocalVideoReplaceTrack(oldPeer, newPeer, newHmsTracks, newHmsSDkTracks);
      Object.assign(oldPeer, newPeer);
    } else if (isEntityRemoved(oldPeer, newPeer)) {
      delete draftPeers[peerID];
    } else if (isEntityAdded(oldPeer, newPeer)) {
      draftPeers[peerID] = newPeer as HMSPeer;
    }
  }
};

export const mergeNewTracksInDraft = (
  draftTracks: Record<HMSTrackID, HMSTrack>,
  newTracks: Record<HMSTrackID, Partial<HMSTrack>>,
) => {
  const trackIDs = union(Object.keys(draftTracks), Object.keys(newTracks));
  for (let trackID of trackIDs) {
    const oldTrack = draftTracks[trackID];
    const newTrack = newTracks[trackID];
    if (isEntityUpdated(oldTrack, newTrack)) {
      Object.assign(oldTrack, newTrack);
    } else if (isEntityRemoved(oldTrack, newTrack)) {
      delete draftTracks[trackID];
    } else if (isEntityAdded(oldTrack, newTrack)) {
      draftTracks[trackID] = newTrack as HMSTrack;
    }
  }
};

const isEntityUpdated = <T>(oldItem: T, newItem: T) => oldItem && newItem;
const isEntityRemoved = <T>(oldItem: T, newItem: T) => oldItem && !newItem;
const isEntityAdded = <T>(oldItem: T, newItem: T) => !oldItem && newItem;

// eslint-disable-next-line complexity
const areArraysEqual = <T>(arr1: T[], arr2?: T[]): boolean => {
  if (arr1 === arr2) {
    // reference check
    return true;
  }
  if (!arr1 || !arr2 || !(arr1.length === arr2.length)) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};

const union = <T>(arr1: T[], arr2: T[]): T[] => {
  const set: Set<T> = new Set();
  for (let elem of arr1) {
    set.add(elem);
  }
  for (let elem of arr2) {
    set.add(elem);
  }
  return Array.from(set);
};

/**
 * on replace track, use prev video track id in peer object, this is because we
 * don't want the peer or peers object reference to change, the fact that the video
 * track is changed on mute/unmute because of replace track is abstracted
 */
function handleLocalVideoReplaceTrack(
  oldPeer: HMSPeer,
  newPeer: Partial<HMSPeer>,
  newHmsTracks: Record<HMSTrackID, Partial<HMSTrack>>,
  newHmsSDkTracks: Record<HMSTrackID, SDKHMSTrack>,
) {
  if (
    oldPeer.isLocal &&
    oldPeer.videoTrack &&
    newPeer.videoTrack &&
    oldPeer.videoTrack !== newPeer.videoTrack
  ) {
    newHmsSDkTracks[oldPeer.videoTrack] = newHmsSDkTracks[newPeer.videoTrack];
    delete newHmsSDkTracks[newPeer.videoTrack];
    newHmsTracks[oldPeer.videoTrack] = newHmsTracks[newPeer.videoTrack];
    newHmsTracks[oldPeer.videoTrack].id = oldPeer.videoTrack;
    delete newHmsTracks[newPeer.videoTrack];
    newPeer.videoTrack = oldPeer.videoTrack;
  }
}
