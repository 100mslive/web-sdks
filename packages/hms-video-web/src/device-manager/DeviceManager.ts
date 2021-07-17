import EventEmitter from 'events';
import HMSDeviceManager from '../interfaces/HMSDeviceManager';
import HMSLogger from '../utils/logger';
import { HMSLocalAudioTrack } from '../media/tracks/HMSLocalAudioTrack';
import { HMSLocalVideoTrack } from '../media/tracks/HMSLocalVideoTrack';
import { HMSAudioTrackSettingsBuilder } from '../media/settings/HMSAudioTrackSettings';
import { HMSVideoTrackSettingsBuilder } from '../media/settings/HMSVideoTrackSettings';
import { HMSException } from '../error/HMSException';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import analyticsEventsService from '../analytics/AnalyticsEventsService';
import { IStore } from '../sdk/store';

export type SelectedDevices = HMSDeviceManager['selected'];

export type DeviceList = Omit<HMSDeviceManager, 'selected'>;

export interface DeviceChangeEvent {
  track: HMSLocalAudioTrack | HMSLocalVideoTrack;
  error: HMSException;
}

export class DeviceManager implements HMSDeviceManager {
  audioInput: InputDeviceInfo[] = [];
  audioOutput: MediaDeviceInfo[] = [];
  videoInput: InputDeviceInfo[] = [];
  selected: SelectedDevices = {};

  private eventEmitter: EventEmitter = new EventEmitter();
  private TAG: string = '[Device Manager]:';
  private initialized = false;

  private get localPeer() {
    return this.store.getLocalPeer();
  }

  constructor(private store: IStore) {}

  updateOutputDevice = (deviceId?: string) => {
    const newDevice = this.audioOutput.find((device) => device.deviceId === deviceId);
    if (newDevice) {
      this.selected.audioOutput = newDevice;
      this.store.updateAudioOutputDevice(this.selected.audioOutput);
    }
    return this.selected.audioOutput;
  };

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    navigator.mediaDevices.ondevicechange = () => this.handleDeviceChange();
    await this.enumerateDevices();
    this.logDevices('Init');
    analyticsEventsService
      .queue(AnalyticsEventFactory.deviceChange({ selection: this.selected, type: 'list', devices: this.getDevices() }))
      .flush();
  }

  getDevices() {
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
    this.selected = {};
    navigator.mediaDevices.ondevicechange = () => {};
  }

  private enumerateDevices = async () => {
    return navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const filteredDevices = devices.filter(
          (device) => device.deviceId !== 'default' && device.deviceId !== 'communications' && device.deviceId !== '',
        );

        this.audioInput = [];
        this.audioOutput = [];
        this.videoInput = [];
        filteredDevices.forEach((device) => {
          if (device.kind === 'audioinput') {
            this.audioInput.push(device as InputDeviceInfo);
          } else if (device.kind === 'audiooutput') {
            this.audioOutput.push(device);
          } else if (device.kind === 'videoinput') {
            this.videoInput.push(device as InputDeviceInfo);
          }
        });

        if (this.audioInput.length > 0) {
          this.selected.audioInput = this.audioInput[0];
        }
        if (this.audioOutput.length > 0) {
          this.selected.audioOutput = this.audioOutput[0];
        }
        if (this.videoInput.length > 0) {
          this.selected.videoInput = this.videoInput[0];
        }

        this.logDevices('Enumerate Devices');
      })
      .catch((error) => {
        HMSLogger.e(this.TAG, 'Failed enumerating devices', error);
      });
  };

  private handleDeviceChange = async () => {
    const prevSelectedAudioInput = this.selected.audioInput;
    const prevSelectedVideoInput = this.selected.videoInput;
    await this.enumerateDevices();
    analyticsEventsService
      .queue(AnalyticsEventFactory.deviceChange({ selection: this.selected, type: 'list', devices: this.getDevices() }))
      .flush();
    this.logDevices('After Device Change');

    this.updateOutputDevice(this.selected.audioOutput?.deviceId);

    if (
      this.localPeer &&
      this.localPeer.audioTrack &&
      prevSelectedAudioInput?.deviceId !== this.selected.audioInput?.deviceId
    ) {
      const prevAudioTrackSettings = (this.localPeer.audioTrack as HMSLocalAudioTrack).settings;
      const prevAudioEnabled = this.localPeer.audioTrack.enabled;
      const newAudioDeviceId =
        this.selected.audioInput?.deviceId ||
        prevSelectedAudioInput?.deviceId ||
        this.audioInput[0]?.deviceId ||
        'default';
      const newAudioTrackSettings = new HMSAudioTrackSettingsBuilder()
        .codec(prevAudioTrackSettings.codec)
        .maxBitrate(prevAudioTrackSettings.maxBitrate)
        .deviceId(newAudioDeviceId)
        .build();
      try {
        await (this.localPeer.audioTrack as HMSLocalAudioTrack).setSettings(newAudioTrackSettings);
        this.eventEmitter.emit('audio-device-change');
        if (!prevAudioEnabled) {
          this.localPeer.audioTrack.setEnabled(prevAudioEnabled);
          HMSLogger.e(this.TAG, '[Audio Device Change Success]');
        }
      } catch (error) {
        HMSLogger.e(this.TAG, '[Audio Device Change]', error);
        analyticsEventsService
          .queue(
            AnalyticsEventFactory.deviceChangeFail({
              selection: this.selected.audioInput,
              devices: this.getDevices(),
              error,
            }),
          )
          .flush();
        this.eventEmitter.emit('audio-device-change', { track: this.localPeer.audioTrack, error });
      }
    }

    if (
      this.localPeer &&
      this.localPeer.videoTrack &&
      prevSelectedVideoInput?.deviceId !== this.selected.videoInput?.deviceId
    ) {
      const prevVideoTrackSettings = (this.localPeer.videoTrack as HMSLocalVideoTrack).settings;
      const prevVideoEnabled = this.localPeer.videoTrack.enabled;
      const newVideoDeviceId =
        this.selected.videoInput?.deviceId ||
        prevSelectedVideoInput?.deviceId ||
        this.videoInput[0]?.deviceId ||
        'default';
      const newVideoTrackSettings = new HMSVideoTrackSettingsBuilder()
        .codec(prevVideoTrackSettings.codec)
        .maxBitrate(prevVideoTrackSettings.maxBitrate)
        .maxFramerate(prevVideoTrackSettings.maxFramerate)
        .setWidth(prevVideoTrackSettings.width)
        .setHeight(prevVideoTrackSettings.height)
        .deviceId(newVideoDeviceId)
        .build();
      try {
        await (this.localPeer.videoTrack as HMSLocalVideoTrack).setSettings(newVideoTrackSettings);
        this.eventEmitter.emit('video-device-change');
        if (!prevVideoEnabled) {
          this.localPeer.videoTrack.setEnabled(prevVideoEnabled);
          HMSLogger.e(this.TAG, '[Video Device Change Success]');
        }
      } catch (error) {
        HMSLogger.e(this.TAG, '[Video Device Change]', error);
        analyticsEventsService
          .queue(
            AnalyticsEventFactory.deviceChangeFail({
              selection: this.selected.videoInput,
              devices: this.getDevices(),
              error,
            }),
          )
          .flush();
        this.eventEmitter.emit('video-device-change', { track: this.localPeer.videoTrack, error });
      }
    }
  };

  addEventListener(event: string, listener: (event: DeviceChangeEvent | undefined) => void) {
    this.eventEmitter.addListener(event, listener);
  }

  removeEventListener(event: string, listener: (event: DeviceChangeEvent | undefined) => void) {
    this.eventEmitter.removeListener(event, listener);
  }

  private logDevices(label = '') {
    HMSLogger.d(this.TAG, label, {
      videoInput: [...this.videoInput],
      audioInput: [...this.audioInput],
      audioOutput: [...this.audioOutput],
      selected: { ...this.selected },
    });
  }
}
