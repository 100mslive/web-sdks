import { HMSPeer, HMSStore, HMSTrack, HMSTrackID } from '../schema';

export function isScreenSharing(tracks: Record<HMSTrackID, HMSTrack>, peer: HMSPeer) {
  const [videoTrack] = getScreenshareTracks(tracks, peer);
  return !!videoTrack;
}

export function getScreenshareTracks(tracks: Record<HMSTrackID, HMSTrack>, peer: HMSPeer) {
  let videoScreenShare = undefined;
  let audioScreenShare = undefined;
  if (!peer) {
    return [videoScreenShare, audioScreenShare];
  }

  for (let trackID of peer.auxiliaryTracks) {
    const track = tracks[trackID];
    if (isScreenShare(track)) {
      audioScreenShare = isAudio(track) ? track : audioScreenShare;
      videoScreenShare = isVideo(track) ? track : videoScreenShare;
    }
  }
  return [videoScreenShare, audioScreenShare];
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
