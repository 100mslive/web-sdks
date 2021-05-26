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
import { HMSPeer, HMSPeerID, HMSTrack, HMSTrackID } from '../../schema';
import SDKHMSTrack from '@100mslive/100ms-web-sdk/dist/media/tracks/HMSTrack';
import { isEqual, union } from 'lodash';

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
    if (oldPeer && newPeer) {
      // update
      if (isEqual(oldPeer.auxiliaryTracks, newPeer.auxiliaryTracks)) {
        newPeer.auxiliaryTracks = oldPeer.auxiliaryTracks;
      }
      // on replace track, use prev video track id in peer object, this is because we
      // don't want the peer or peers object reference to change
      if (
        oldPeer.isLocal &&
        oldPeer.videoTrack &&
        newPeer.videoTrack &&
        oldPeer.videoTrack !== newPeer.videoTrack
      ) {
        newHmsSDkTracks[oldPeer.videoTrack] =
          newHmsSDkTracks[newPeer.videoTrack];
        delete newHmsSDkTracks[newPeer.videoTrack];
        newHmsTracks[oldPeer.videoTrack] = newHmsTracks[newPeer.videoTrack];
        newHmsTracks[oldPeer.videoTrack].id = oldPeer.videoTrack;
        delete newHmsTracks[newPeer.videoTrack];
        newPeer.videoTrack = oldPeer.videoTrack;
      }
      Object.assign(oldPeer, newPeer);
    } else if (oldPeer && !newPeer) {
      // remove
      delete draftPeers[peerID];
    } else if (!oldPeer && newPeer) {
      // add
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
    if (oldTrack && newTrack) {
      // update
      Object.assign(oldTrack, newTrack);
    } else if (oldTrack && !newTrack) {
      // remove
      delete draftTracks[trackID];
    } else if (!oldTrack && newTrack) {
      // add
      draftTracks[trackID] = newTrack as HMSTrack;
    }
  }
};
