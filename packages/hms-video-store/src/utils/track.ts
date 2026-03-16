import HMSLogger from './logger';
import { BuildGetMediaError } from '../error/utils';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../media/settings';
import { HMSTrackExceptionTrackType } from '../media/tracks/HMSTrackExceptionTrackType';

export async function getAudioTrack(settings: HMSAudioTrackSettings): Promise<MediaStreamTrack> {
  try {
    const audioConstraints = settings ? settings.toConstraints() : false;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });
    return stream.getAudioTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackExceptionTrackType.AUDIO);
  }
}

export async function getVideoTrack(settings: HMSVideoTrackSettings): Promise<MediaStreamTrack> {
  try {
    const videoConstraints = settings ? settings.toConstraints() : false;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
    });
    return stream.getVideoTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackExceptionTrackType.VIDEO);
  }
}

// To differentiate between normal track and empty track.
export function isEmptyTrack(track: MediaStreamTrack) {
  // Firefox gives '' as label for empty track(created from audio context)
  return 'canvas' in track || track.label === 'MediaStreamAudioDestinationNode' || track.label === '';
}

export const listenToPermissionChange = (
  permissionName: 'camera' | 'microphone',
  onChange: (state: PermissionState) => any,
) => {
  if (!navigator.permissions) {
    HMSLogger.d('Permissions API not supported');
    return;
  }
  navigator.permissions
    // @ts-ignore
    .query({ name: permissionName })
    .then(permission => {
      onChange(permission.state);
      permission.onchange = () => {
        HMSLogger.d(`${permissionName} permission changed`, permission.state);
        onChange(permission.state);
      };
    })
    .catch(error => {
      HMSLogger.e(`${permissionName} not supported`, error.message);
    });
};
