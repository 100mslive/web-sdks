import { BuildGetMediaError, HMSGetMediaActions } from '@100mslive/hms-video';
import { iceConnectionTypes } from './interfaces';

export const DEFAULT_DIAGNOSTICS_USERNAME = 'diagnostics_user';
export const PROD_INIT_ENDPOINT = 'https://prod-init.100ms.live/';

export function getIceCandidateType(candidate: RTCIceCandidate): iceConnectionTypes | null {
  if (candidate.type === 'srflx') {
    return candidate.protocol === 'udp' ? iceConnectionTypes.stunUDP : iceConnectionTypes.stunTCP;
  }

  if (candidate.type === 'relay') {
    return candidate.protocol === 'udp' ? iceConnectionTypes.turnUDP : iceConnectionTypes.turnTCP;
  }
  return null;
}

export const checkCamera = async () => {
  const result = {
    success: false,
    info: {},
    errorMessage: '',
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    result.info = {
      deviceId: settings.deviceId,
      groupId: settings.groupId,
      label: videoTrack.label,
    };
    result.success = true;
    result.errorMessage = '';
    videoTrack.stop();
  } catch (error) {
    const exception = BuildGetMediaError(error as Error, HMSGetMediaActions.VIDEO);
    result.success = false;
    result.errorMessage = exception.message;
    result.info = exception;
  }
  return result;
};

export const checkMicrophone = async () => {
  const result = {
    success: false,
    info: {},
    errorMessage: '',
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = stream.getAudioTracks()[0];
    const settings = audioTrack.getSettings();
    result.info = {
      deviceId: settings.deviceId,
      groupId: settings.groupId,
      label: audioTrack.label,
    };
    result.success = true;
    result.errorMessage = '';
    audioTrack.stop();
  } catch (error) {
    const exception = BuildGetMediaError(error as Error, HMSGetMediaActions.AUDIO);
    result.success = false;
    result.errorMessage = exception.message;
    result.info = exception;
  }
  return result;
};
