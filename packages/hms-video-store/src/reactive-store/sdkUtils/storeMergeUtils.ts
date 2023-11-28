import { HMSPeerStats, HMSTrackStats } from '../../interfaces';
import { HMSLocalTrack as SDKHMSLocalTrack, HMSPoll } from '../../internal';
import { HMSPeer, HMSPeerID, HMSScreenVideoTrack, HMSTrack, HMSTrackID, HMSVideoTrack } from '../../schema';

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
// eslint-disable-next-line complexity
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
      if (oldPeer.groups && areArraysEqual(oldPeer.groups, newPeer.groups)) {
        newPeer.groups = oldPeer.groups;
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

export const mergeNewPollsInDraft = (
  draftPolls: Record<string, HMSPoll>,
  newPolls: Record<string, Partial<HMSPoll>>,
) => {
  const pollIDs = union(Object.keys(draftPolls), Object.keys(newPolls));
  for (const pollID of pollIDs) {
    const oldPoll = draftPolls[pollID];
    const newPoll = newPolls[pollID];
    if (isEntityUpdated(oldPoll, newPoll)) {
      if (oldPoll.questions && areArraysEqual(oldPoll.questions, newPoll.questions)) {
        newPoll.questions = oldPoll.questions;
      }
      Object.assign(oldPoll, newPoll);
    } else if (isEntityAdded(oldPoll, newPoll)) {
      draftPolls[pollID] = newPoll as HMSPoll;
    }
  }
};

export const mergeNewIndividualStatsInDraft = <TID extends string, T extends HMSPeerStats | HMSTrackStats>(
  draftStats: Record<TID, T | undefined>,
  newStats: Record<TID, Partial<T | undefined>>,
) => {
  const IDs = union(Object.keys(draftStats), Object.keys(newStats)) as TID[];
  for (const trackID of IDs) {
    const oldStat = draftStats[trackID];
    const newStat = newStats[trackID];
    if (isEntityUpdated(oldStat, newStat)) {
      Object.assign(oldStat!, newStat);
    } else if (isEntityRemoved(oldStat, newStat)) {
      delete draftStats[trackID];
    } else if (isEntityAdded(oldStat, newStat)) {
      draftStats[trackID] = newStat as T;
    }
  }
};

export const mergeLocalTrackStats = (
  draftStats: Record<HMSTrackID, HMSTrackStats[] | undefined>,
  newStats: Record<HMSTrackID, Record<string, HMSTrackStats>>,
  tracks: SDKHMSLocalTrack[],
) => {
  const trackMap: Record<string, HMSTrackStats[]> = tracks.reduce((acc, track) => {
    // @ts-ignore
    acc[track.firstTrackId] = Object.values(newStats[track.getTrackIDBeingSent()] || {}).sort((a, b) => {
      if (!a.rid || !b.rid) {
        return 0;
      }
      return a.rid < b.rid ? -1 : 1;
    });
    return acc;
  }, {});
  const IDs = union(Object.keys(draftStats), Object.keys(trackMap));
  for (const trackID of IDs) {
    if (!trackMap[trackID]) {
      delete draftStats[trackID];
      continue;
    }
    draftStats[trackID] = trackMap[trackID];
  }
};

/**
 * array's are usually created with new reference, avoid that update if both arrays are same
 */
export const mergeTrackArrayFields = (oldTrack: HMSTrack, newTrack: Partial<HMSTrack>) => {
  if (oldTrack.plugins && areArraysEqual(oldTrack.plugins, newTrack.plugins)) {
    newTrack.plugins = oldTrack.plugins;
  }
  if (
    oldTrack.type === 'video' &&
    oldTrack.layerDefinitions &&
    areArraysEqual(oldTrack.layerDefinitions, (newTrack as HMSVideoTrack | HMSScreenVideoTrack).layerDefinitions)
  ) {
    (newTrack as HMSVideoTrack | HMSScreenVideoTrack).layerDefinitions = oldTrack.layerDefinitions;
  }
};

export const isEntityUpdated = <T>(oldItem: T, newItem: T) => oldItem && newItem;
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
