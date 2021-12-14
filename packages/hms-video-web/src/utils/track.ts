import { IStore } from '../sdk/store';
import { BuildGetMediaError, HMSGetMediaActions } from '../error/utils';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../media/settings';
import { HMSLocalVideoTrack, HMSRemoteAudioTrack, HMSRemoteVideoTrack, HMSTrackType } from '../media/tracks';

export async function getAudioTrack(settings: HMSAudioTrackSettings): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: settings ? settings.toConstraints() : false,
    });
    return stream.getAudioTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSGetMediaActions.AUDIO);
  }
}

export async function getVideoTrack(settings: HMSVideoTrackSettings): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: settings ? settings.toConstraints() : false,
    });
    return stream.getVideoTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSGetMediaActions.VIDEO);
  }
}

// To differentiate between normal track and empty track.
export function isEmptyTrack(track: MediaStreamTrack) {
  // Firefox gives '' as label for empty track(created from audio context)
  return 'canvas' in track || track.label === 'MediaStreamAudioDestinationNode' || track.label === '';
}

export const getTrackIDBeingSent = (store: IStore, trackID: string) => {
  const track = store.getTrackById(trackID);
  if (track) {
    if (track instanceof HMSRemoteAudioTrack || track instanceof HMSRemoteVideoTrack) {
      return track.trackId;
    }
    if (track.type === HMSTrackType.VIDEO) {
      return (track as HMSLocalVideoTrack).getTrackIDBeingSent();
    } else {
      return track.trackId;
    }
  } else {
    return;
  }
};
