import {
  HMSPeer,
  HMSPublishAllowed,
  HMSRole,
  HMSScreenAudioTrack,
  HMSScreenVideoTrack,
  HMSStore,
  HMSTrack,
  HMSTrackID,
  HMSVideoTrack,
} from '../schema';

export function getScreenSharesByPeer(tracks: Record<HMSTrackID, HMSTrack>, peer?: HMSPeer | null) {
  let videoTrack = undefined;
  let audioTrack = undefined;
  if (peer) {
    for (const trackID of peer.auxiliaryTracks) {
      const track = tracks[trackID];
      if (isScreenShare(track)) {
        audioTrack = isAudio(track) ? track : audioTrack;
        videoTrack = isVideo(track) ? track : videoTrack;
      }
    }
  }
  // to use the proper type, right now it is only used for screenshare.
  return { video: videoTrack as HMSScreenVideoTrack, audio: audioTrack as HMSScreenAudioTrack };
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

export function isDegraded(track: HMSVideoTrack) {
  if (track) {
    return Boolean(track?.degraded);
  }
  return false;
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

export function isRoleAllowedToPublish(role?: HMSRole | null): HMSPublishAllowed {
  let video = false,
    audio = false,
    screen = false;
  if (role?.publishParams?.allowed) {
    video = role.publishParams.allowed.includes('video');
    audio = role.publishParams.allowed.includes('audio');
    screen = role.publishParams.allowed.includes('screen');
  }
  return {
    video,
    audio,
    screen,
  };
}
