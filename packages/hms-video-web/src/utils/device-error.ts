import { getLocalStream } from './media';
import { getAudioTrack, getVideoTrack } from './track';
import { HMSAction } from '../error/HMSAction';
import { HMSException } from '../error/HMSException';
import { HMSAudioTrackSettingsBuilder } from '../media/settings/HMSAudioTrackSettings';
import { HMSVideoTrackSettingsBuilder } from '../media/settings/HMSVideoTrackSettings';

// Errors out when there's any device error, returns false when there are no device errors.
export async function validateDeviceAV() {
  const videoTrackSettings = new HMSVideoTrackSettingsBuilder().build();
  const audioTrackSettings = new HMSAudioTrackSettingsBuilder().build();
  /**
   * Check audio failure.
   * If audio failure - check AV failure.
   * If AV failure - throw AV failure.
   * If AV passed - throw audio failure.
   *
   * If audio passed - check video failure.
   * If video failure - throw video failure.
   * If video passed - no error - return false.
   */
  try {
    const track = await getAudioTrack(audioTrackSettings);
    track.stop();
  } catch (audioError) {
    if (isHMSDeviceError(audioError)) {
      const stream = await getLocalStream({ audio: false, video: true });
      stream.getTracks().forEach(track => track.stop());
      throw audioError;
    }
  }

  const track = await getVideoTrack(videoTrackSettings);
  track.stop();
  return false;
}

function isHMSDeviceError(error: any) {
  return error instanceof HMSException && error.action === HMSAction.TRACK;
}
