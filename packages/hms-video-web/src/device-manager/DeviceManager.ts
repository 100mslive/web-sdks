import EventEmitter from 'events';
import { HMSDeviceManager, DeviceMap } from '../interfaces/HMSDeviceManager';
import { HMSLocalAudioTrack, HMSLocalVideoTrack } from '../media/tracks';
import { HMSAudioTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { HMSException } from '../error/HMSException';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import { IStore } from '../sdk/store';
import { debounce } from '../utils/timer-utils';
import HMSLogger from '../utils/logger';

export type SelectedDevices = {
  audioInput?: InputDeviceInfo;
  videoInput?: InputDeviceInfo;
  audioOutput?: MediaDeviceInfo;
};

export interface DeviceChangeEvent {
  track: HMSLocalAudioTrack | HMSLocalVideoTrack;
  error: HMSException;
  devices: DeviceMap;
}

type DeviceAndGroup = Partial<MediaTrackSettings>;
export class DeviceManager implements HMSDeviceManager {
  audioInput: InputDeviceInfo[] = [];
  audioOutput: MediaDeviceInfo[] = [];
  videoInput: InputDeviceInfo[] = [];
  outputDevice?: MediaDeviceInfo;

  private eventEmitter: EventEmitter = new EventEmitter();
  private TAG: string = '[Device Manager]:';
  private initialized = false;
  private videoInputChanged = false;
  private audioInputChanged = false;

  constructor(private store: IStore) {}

  updateOutputDevice = (deviceId?: string) => {
    const newDevice = this.audioOutput.find((device) => device.deviceId === deviceId);
    if (newDevice) {
      this.outputDevice = newDevice;
      this.store.updateAudioOutputDevice(newDevice);
    }
    return newDevice;
  };

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    navigator.mediaDevices.ondevicechange = debounce(() => this.handleDeviceChange());
    await this.enumerateDevices();
    this.logDevices('Init');
    this.eventEmitter.emit('audio-device-change', { devices: this.getDevices() });
    analyticsEventsService
      .queue(
        AnalyticsEventFactory.deviceChange({
          selection: this.getCurrentSelection(),
          type: 'list',
          devices: this.getDevices(),
        }),
      )
      .flush();
  }

  getDevices(): DeviceMap {
    return {
      audioInput: this.audioInput,
      audioOutput: this.audioOutput,
      videoInput: this.videoInput,
    };
  }

  cleanUp() {
    this.initialized = false;
    this.audioInput = [];
    this.audioOutput = [];
    this.videoInput = [];
    this.outputDevice = undefined;
    navigator.mediaDevices.ondevicechange = () => {};
  }

  private createIdentifier(deviceInfo?: DeviceAndGroup) {
    if (!deviceInfo) {
      return '';
    }
    return `${deviceInfo.deviceId}${deviceInfo.groupId}`;
  }

  private getCurrentSelection = (): SelectedDevices => {
    const localPeer = this.store.getLocalPeer();
    const audioDevice = this.createIdentifier(localPeer?.audioTrack?.getMediaTrackSettings());
    const videoDevice = this.createIdentifier(localPeer?.videoTrack?.getMediaTrackSettings());
    const audioSelection = this.audioInput.find((device) => {
      const id = this.createIdentifier(device);
      return id === audioDevice;
    });
    const videoSelection = this.videoInput.find((device) => this.createIdentifier(device) === videoDevice);
    return {
      audioInput: audioSelection,
      videoInput: videoSelection,
      audioOutput: this.outputDevice,
    };
  };

  private computeChange = (prevDevices: string[], currentDevices: InputDeviceInfo[]) => {
    if (prevDevices.length !== currentDevices.length) {
      return true;
    }
    return currentDevices.some((device) => !prevDevices.includes(this.createIdentifier(device)));
  };

  private enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const prevVideoInput = this.videoInput.map(this.createIdentifier);
      const prevAudioInput = this.audioInput.map(this.createIdentifier);
      this.audioInput = [];
      this.audioOutput = [];
      this.videoInput = [];
      devices.forEach((device) => {
        if (device.kind === 'audioinput') {
          this.audioInput.push(device as InputDeviceInfo);
        } else if (device.kind === 'audiooutput') {
          this.audioOutput.push(device);
        } else if (device.kind === 'videoinput') {
          this.videoInput.push(device as InputDeviceInfo);
        }
      });
      this.videoInputChanged = this.computeChange(prevVideoInput, this.videoInput);
      this.audioInputChanged = this.computeChange(prevAudioInput, this.audioInput);
      if (this.audioOutput.length > 0) {
        this.outputDevice = this.audioOutput[0];
      }
      this.logDevices('Enumerate Devices');
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed enumerating devices', error);
    }
  };

  private handleDeviceChange = async () => {
    await this.enumerateDevices();
    analyticsEventsService
      .queue(
        AnalyticsEventFactory.deviceChange({
          selection: this.getCurrentSelection(),
          type: 'list',
          devices: this.getDevices(),
        }),
      )
      .flush();
    this.logDevices('After Device Change');
    const localPeer = this.store.getLocalPeer();
    this.outputDevice = this.audioOutput.find((device) => device.deviceId === 'default');
    this.handleAudioInputDeviceChange(localPeer?.audioTrack);
    this.handleVideoInputDeviceChange(localPeer?.videoTrack);
  };

  /**
   * Function to get the device after device change
   * Chrome and Edge provide a default device from which we select the actual device
   * Firefox and safari give 0th device as system default
   * @returns {InputDeviceInfo}
   */
  private getNewAudioInputDevice() {
    const defaultDevice = this.audioInput.find((device) => device.deviceId === 'default');
    if (defaultDevice) {
      const nextDevice = this.audioInput.find(
        (device) => device.label === defaultDevice?.label.replace(/Default - /, ''),
      );
      return nextDevice;
    }
    return this.audioInput[0];
  }

  private handleAudioInputDeviceChange = async (audioTrack?: HMSLocalAudioTrack) => {
    if (!audioTrack) {
      HMSLogger.d(this.TAG, 'No Audio track on local peer');
      return;
    }
    // no need to proceed further if input has not changed
    if (!this.audioInputChanged) {
      HMSLogger.d(this.TAG, 'No Change in AudioInput Device');
      return;
    }
    const newSelection = this.getNewAudioInputDevice();
    if (!newSelection || !newSelection.deviceId) {
      HMSLogger.w(this.TAG, 'Audio device not found');
      return;
    }
    const { settings, enabled } = audioTrack;
    const newAudioTrackSettings = new HMSAudioTrackSettingsBuilder()
      .codec(settings.codec)
      .maxBitrate(settings.maxBitrate)
      .deviceId(newSelection.deviceId)
      .build();
    try {
      await audioTrack.setSettings(newAudioTrackSettings);
      if (!enabled) {
        // On replace track, enabled will be true. Need to be set to previous state
        audioTrack.setEnabled(enabled);
      }
      this.eventEmitter.emit('audio-device-change', { devices: this.getDevices() });
      this.logDevices('Audio Device Change Success');
    } catch (error) {
      HMSLogger.e(this.TAG, '[Audio Device Change]', error);
      analyticsEventsService
        .queue(
          AnalyticsEventFactory.deviceChange({
            selection: { audioInput: newSelection },
            devices: this.getDevices(),
            error,
          }),
        )
        .flush();
      this.eventEmitter.emit('audio-device-change', { track: audioTrack, error, devices: this.getDevices() });
    }
  };

  private handleVideoInputDeviceChange = async (videoTrack?: HMSLocalVideoTrack) => {
    if (!videoTrack) {
      HMSLogger.d(this.TAG, 'No Audio track on local peer');
      return;
    }
    // no need to proceed further if input has not changed
    if (!this.videoInputChanged) {
      HMSLogger.d(this.TAG, 'No Change in VideoInput Device');
      return;
    }
    const newSelection = this.videoInput[0];
    if (!newSelection || !newSelection.deviceId) {
      HMSLogger.w(this.TAG, 'Video device not found');
      return;
    }
    const { settings, enabled } = videoTrack;
    const newVideoTrackSettings = new HMSVideoTrackSettingsBuilder()
      .codec(settings.codec)
      .maxBitrate(settings.maxBitrate)
      .maxFramerate(settings.maxFramerate)
      .setWidth(settings.width)
      .setHeight(settings.height)
      .deviceId(newSelection.deviceId)
      .build();
    try {
      await (videoTrack as HMSLocalVideoTrack).setSettings(newVideoTrackSettings);
      if (!enabled) {
        // On replace track, enabled will be true. Need to be set to previous state
        videoTrack.setEnabled(enabled);
      }
      this.eventEmitter.emit('video-device-change', { devices: this.getDevices() });
      this.logDevices('Video Device Change Success');
    } catch (error) {
      HMSLogger.e(this.TAG, '[Video Device Change]', error);
      analyticsEventsService
        .queue(
          AnalyticsEventFactory.deviceChange({
            selection: { videoInput: newSelection },
            devices: this.getDevices(),
            error,
          }),
        )
        .flush();
      this.eventEmitter.emit('video-device-change', { track: videoTrack, error, devices: this.getDevices() });
    }
  };

  addEventListener(event: string, listener: (event: DeviceChangeEvent) => void) {
    this.eventEmitter.addListener(event, listener);
  }

  removeEventListener(event: string, listener: (event: DeviceChangeEvent) => void) {
    this.eventEmitter.removeListener(event, listener);
  }

  private logDevices(label = '') {
    HMSLogger.d(
      this.TAG,
      label,
      JSON.stringify({
        videoInput: [...this.videoInput],
        audioInput: [...this.audioInput],
        audioOutput: [...this.audioOutput],
        selected: this.getCurrentSelection(),
      }),
    );
  }
}
