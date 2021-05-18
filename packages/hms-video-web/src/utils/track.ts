import { HMSAction } from '../error/HMSAction';
import { BuildGetMediaError } from '../error/HMSErrorFactory';
import HMSAudioTrackSettings from '../media/settings/HMSAudioTrackSettings';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';

export async function getAudioTrack(settings: HMSAudioTrackSettings): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: settings.toConstraints(),
    });
    return stream.getAudioTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err, HMSAction.SwitchDevice);
  }
}

export async function getVideoTrack(settings: HMSVideoTrackSettings): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: settings.toConstraints(),
    });
    return stream.getVideoTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err, HMSAction.SwitchDevice);
  }
}

// the dimensions of the passed in track are used to create the empty video track
export function getEmptyVideoTrack(prevTrack?: MediaStreamTrack) {
  const width = prevTrack?.getSettings()?.width || 640;
  const height = prevTrack?.getSettings()?.height || 360;
  const canvas = Object.assign(document.createElement('canvas'), { width, height }) as any;
  canvas.getContext('2d')?.fillRect(0, 0, width, height);
  const stream = canvas.captureStream();
  const emptyTrack = stream.getVideoTracks()[0];
  emptyTrack.enabled = false;
  return emptyTrack;
}
