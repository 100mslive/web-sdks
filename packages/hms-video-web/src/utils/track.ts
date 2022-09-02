import { BuildGetMediaError, HMSGetMediaActions } from '../error/utils';
import { HMSSimulcastLayer } from '../interfaces';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../media/settings';

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

export function isTrackDegraded(prevLayer: HMSSimulcastLayer, newLayer: HMSSimulcastLayer): boolean {
  const toInt = (layer: HMSSimulcastLayer): number => {
    switch (layer) {
      case HMSSimulcastLayer.HIGH:
        return 3;
      case HMSSimulcastLayer.MEDIUM:
        return 2;
      case HMSSimulcastLayer.LOW:
        return 1;
      case HMSSimulcastLayer.NONE:
        return 0;
    }
  };

  return toInt(newLayer) < toInt(prevLayer);
}
