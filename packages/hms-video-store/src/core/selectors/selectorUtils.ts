import { HMSPeer, HMSStore, HMSTrack } from '../schema';

export function isScreenSharing(store: HMSStore, peer: HMSPeer) {
  return (
    peer &&
    peer.auxiliaryTracks.some(trackID => {
      if (trackID && store.tracks[trackID]) {
        const track = store.tracks[trackID];
        return isScreenShare(track);
      }
      return false;
    })
  );
}

export function isAudio(track: HMSTrack | undefined) {
  return track && track.type === 'audio';
}

export function isVideo(track: HMSTrack | undefined) {
  return track && track.type === 'video';
}

export function isScreenShare(track: HMSTrack | undefined) {
  return track && track.source === 'screen';
}

export function isDegraded(track: HMSTrack | undefined) {
  return Boolean(track?.degraded);
}

export function isTrackEnabled(store: HMSStore, trackID?: string) {
  if (trackID && store.tracks[trackID]) {
    return store.tracks[trackID].enabled;
  }
  return false;
}

/**
 * Should UI show the video track as enabled
 */
export function isTrackDisplayEnabled(store: HMSStore, trackID?: string) {
  if (trackID && store.tracks[trackID]) {
    return store.tracks[trackID].displayEnabled;
  }
  return false;
}
