import HMSLogger from './logger';
import { isFirefox } from './support';
import { BuildGetMediaError } from '../error/utils';
import { HMSTrackExceptionTrackType } from '../media/tracks/HMSTrackExceptionTrackType';

export async function getLocalStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackExceptionTrackType.AUDIO_VIDEO);
  }
}

export async function getLocalScreen(constraints: MediaStreamConstraints['video']): Promise<MediaStream> {
  try {
    // @ts-ignore [https://github.com/microsoft/TypeScript/issues/33232]
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: constraints, audio: false });
    return stream;
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackExceptionTrackType.SCREEN);
  }
}

interface MediaDeviceGroups {
  audioinput: MediaDeviceInfo[];
  audiooutput: MediaDeviceInfo[];
  videoinput: MediaDeviceInfo[];
}

export async function getLocalDevices(): Promise<MediaDeviceGroups> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const deviceGroups: MediaDeviceGroups = {
      audioinput: [],
      audiooutput: [],
      videoinput: [],
    };
    devices.forEach(device => deviceGroups[device.kind].push(device));
    return deviceGroups;
  } catch (err) {
    throw BuildGetMediaError(err as Error, HMSTrackExceptionTrackType.AUDIO_VIDEO);
  }
}

export interface HMSAudioContext {
  audioContext: AudioContext | null;
  getAudioContext: (options?: AudioContextOptions) => AudioContext;
  resumeContext: () => Promise<void>;
}

export const HMSAudioContextHandler: HMSAudioContext = {
  audioContext: null,
  getAudioContext(options?: AudioContextOptions) {
    const newAudioContextNeeded =
      !this.audioContext || (options?.sampleRate && this.audioContext.sampleRate !== options.sampleRate);

    if (newAudioContextNeeded) {
      /**
       * Not setting default sample rate for firefox since connecting
       * audio nodes from context with different sample rate is not
       * supported in firefox
       */
      this.audioContext = isFirefox ? new AudioContext() : new AudioContext(options);
    }

    return this.audioContext!;
  },
  async resumeContext() {
    try {
      return await this.getAudioContext().resume();
    } catch (error) {
      HMSLogger.e('AudioContext', error);
    }
  },
};

export enum HMSAudioDeviceCategory {
  SPEAKERPHONE = 'SPEAKERPHONE',
  WIRED = 'WIRED',
  BLUETOOTH = 'BLUETOOTH',
  EARPIECE = 'EARPIECE',
}

export const getAudioDeviceCategory = (deviceLabel?: string) => {
  if (!deviceLabel) {
    HMSLogger.w('[DeviceManager]:', 'No device label provided');
    return HMSAudioDeviceCategory.SPEAKERPHONE;
  }
  const label = deviceLabel.toLowerCase();
  if (label.includes('speakerphone')) {
    return HMSAudioDeviceCategory.SPEAKERPHONE;
  } else if (label.includes('wired')) {
    return HMSAudioDeviceCategory.WIRED;
  } else if (/airpods|buds|wireless|bluetooth/gi.test(label)) {
    return HMSAudioDeviceCategory.BLUETOOTH;
  } else if (label.includes('earpiece')) {
    return HMSAudioDeviceCategory.EARPIECE;
  }
  return HMSAudioDeviceCategory.SPEAKERPHONE;
};
