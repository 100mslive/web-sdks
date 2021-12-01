import { HMSPeer, HMSPeerID, HMSTrack, HMSTrackID } from '../../schema';

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
) => {
  const peerIDs = union(Object.keys(draftPeers), Object.keys(newPeers));
  for (const peerID of peerIDs) {
    const oldPeer = draftPeers[peerID];
    const newPeer = newPeers[peerID];
    if (isEntityUpdated(oldPeer, newPeer)) {
      if (areArraysEqual(oldPeer.auxiliaryTracks, newPeer.auxiliaryTracks)) {
        newPeer.auxiliaryTracks = oldPeer.auxiliaryTracks;
      }
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
  for (const trackID of trackIDs) {
    const oldTrack = draftTracks[trackID];
    const newTrack = newTracks[trackID];
    if (isEntityUpdated(oldTrack, newTrack)) {
      mergeTrackArrayFields(oldTrack, newTrack);
      Object.assign(oldTrack, newTrack);
    } else if (isEntityRemoved(oldTrack, newTrack)) {
      delete draftTracks[trackID];
    } else if (isEntityAdded(oldTrack, newTrack)) {
      draftTracks[trackID] = newTrack as HMSTrack;
    }
  }
};

export const mergeNewTrackStatsInDraft = (
  tracks: Record<HMSTrackID, HMSTrack>,
  draftTrackStats: Record<HMSTrackID, RTCStats | undefined>,
  newTrackStats: Record<HMSTrackID, Partial<RTCStats | undefined>>,
) => {
  const trackIDs = Object.keys(tracks);
  for (const trackID of trackIDs) {
    const oldTrackStat = draftTrackStats[trackID];
    const newTrackStat = newTrackStats[trackID];
    if (isEntityUpdated(oldTrackStat, newTrackStat)) {
      Object.assign(oldTrackStat, newTrackStat);
    } else if (isEntityRemoved(oldTrackStat, newTrackStat)) {
      delete draftTrackStats[trackID];
    } else if (isEntityAdded(oldTrackStat, newTrackStat)) {
      draftTrackStats[trackID] = newTrackStat as RTCStats;
    }
  }
};

/**
 * array's are usually created with new reference, avoid that update if both arrays are same
 */
const mergeTrackArrayFields = (oldTrack: HMSTrack, newTrack: Partial<HMSTrack>) => {
  if (oldTrack.plugins && areArraysEqual(oldTrack.plugins, newTrack.plugins)) {
    newTrack.plugins = oldTrack.plugins;
  }
  if (oldTrack.layerDefinitions && areArraysEqual(oldTrack.layerDefinitions, newTrack.layerDefinitions)) {
    newTrack.layerDefinitions = oldTrack.layerDefinitions;
  }
};

const isEntityUpdated = <T>(oldItem: T, newItem: T) => oldItem && newItem;
const isEntityRemoved = <T>(oldItem: T, newItem: T) => oldItem && !newItem;
const isEntityAdded = <T>(oldItem: T, newItem: T) => !oldItem && newItem;

// eslint-disable-next-line complexity
export const areArraysEqual = <T>(arr1: T[], arr2?: T[]): boolean => {
  if (arr1 === arr2 || (arr1.length === 0 && arr2?.length === 0)) {
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
  for (const elem of arr1) {
    set.add(elem);
  }
  for (const elem of arr2) {
    set.add(elem);
  }
  return Array.from(set);
};
