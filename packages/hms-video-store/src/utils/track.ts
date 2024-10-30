import { BuildGetMediaError } from '../error/utils';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../media/settings';
import { HMSTrackType } from '../media/tracks/HMSTrackType';

export async function getAudioTrack(settings: HMSAudioTrackSettings): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: settings ? settings.toConstraints() : false,
    });
    return stream.getAudioTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackType.AUDIO);
  }
}

export async function getVideoTrack(settings: HMSVideoTrackSettings): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: settings ? settings.toConstraints() : false,
    });
    return stream.getVideoTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackType.VIDEO);
  }
}

// To differentiate between normal track and empty track.
export function isEmptyTrack(track: MediaStreamTrack) {
  // Firefox gives '' as label for empty track(created from audio context)
  return 'canvas' in track || track.label === 'MediaStreamAudioDestinationNode' || track.label === '';
}
