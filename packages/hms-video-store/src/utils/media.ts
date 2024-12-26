import HMSLogger from './logger';
import { isFirefox } from './support';
import { BuildGetMediaError } from '../error/utils';
import { HMSTrackExceptionTrackType } from '../media/tracks/HMSTrackExceptionTrackType';

// discussed with krisp team and this is their recommendation for the sample rate
const DEFAULT_SAMPLE_RATE = 32000;

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
  getAudioContext: () => AudioContext;
  resumeContext: () => Promise<void>;
}

export const HMSAudioContextHandler: HMSAudioContext = {
  audioContext: null,
  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = isFirefox ? new AudioContext() : new AudioContext({ sampleRate: DEFAULT_SAMPLE_RATE });
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
