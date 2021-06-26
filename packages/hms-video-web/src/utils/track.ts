import { BuildGetMediaError, HMSGetMediaActions } from '../error/utils';
import HMSAudioTrackSettings from '../media/settings/HMSAudioTrackSettings';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';

export async function getAudioTrack(settings: HMSAudioTrackSettings | null): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: settings ? settings.toConstraints() : false,
    });
    return stream.getAudioTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err, HMSGetMediaActions.AUDIO);
  }
}

export async function getVideoTrack(settings: HMSVideoTrackSettings | null): Promise<MediaStreamTrack> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: settings ? settings.toConstraints() : false,
    });
    return stream.getVideoTracks()[0];
  } catch (err) {
    throw BuildGetMediaError(err, HMSGetMediaActions.VIDEO);
  }
}

// To differentiate between normal track and empty track.
export function isEmptyTrack(track: MediaStreamTrack) {
  return 'canvas' in track || track.label === 'MediaStreamAudioDestinationNode';
}

let blankCanvas: any;

// the dimensions of the passed in track are used to create the empty video track
// a dummy change(toggling a pixel value) is done periodically to keep on sending bytes
export function getEmptyVideoTrack(prevTrack?: MediaStreamTrack) {
  const width = prevTrack?.getSettings()?.width || 640;
  const height = prevTrack?.getSettings()?.height || 360;
  const frameRate = 1; // fps
  if (!blankCanvas) {
    blankCanvas = Object.assign(document.createElement('canvas'), { width, height });
    blankCanvas.getContext('2d')?.fillRect(0, 0, width, height);
  }
  const stream = blankCanvas.captureStream(frameRate);
  const emptyTrack = stream.getVideoTracks()[0];
  const intervalID = setInterval(() => {
    if (emptyTrack.readyState === 'ended') {
      clearInterval(intervalID);
      return;
    }
    const ctx = blankCanvas.getContext('2d');
    if (ctx) {
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      const red = pixel[0] === 0 ? 1 : 0; // toggle red in pixel
      ctx.fillStyle = `rgb(${red}, 0, 0)`;
      ctx.fillRect(0, 0, 1, 1);
    }
  }, 1000 / frameRate);
  emptyTrack.onended = () => {
    clearInterval(intervalID);
  };
  emptyTrack.enabled = false;
  return emptyTrack;
}

export function getEmptyAudioTrack() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  // @ts-expect-error
  const emptyTrack = dst.stream.getAudioTracks()[0];
  emptyTrack.enabled = false;
  return emptyTrack;
}
