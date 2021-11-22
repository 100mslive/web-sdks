import { HMSPeer, HMSStore, HMSTrack, HMSTrackID } from '../schema';

type trackCheck = (track: HMSTrack | undefined) => boolean | undefined;

export function getPeerTracksByCondition(
  tracks: Record<HMSTrackID, HMSTrack>,
  peer: HMSPeer | null,
  trackCheckFn: trackCheck = isScreenShare,
) {
  let videoTrack = undefined;
  let audioTrack = undefined;
  if (peer) {
    for (const trackID of peer.auxiliaryTracks) {
      const track = tracks[trackID];
      if (trackCheckFn(track)) {
        audioTrack = isAudio(track) ? track : audioTrack;
        videoTrack = isVideo(track) ? track : videoTrack;
      }
    }
  }
  return { video: videoTrack, audio: audioTrack };
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

export function isAudioPlaylist(track: HMSTrack | undefined) {
  return track && track.source === 'audioplaylist';
}

export function isVideoPlaylist(track: HMSTrack | undefined) {
  return track && track.source === 'videoplaylist';
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
