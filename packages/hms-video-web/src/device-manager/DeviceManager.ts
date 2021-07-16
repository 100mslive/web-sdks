import EventEmitter from 'events';
import HMSDeviceManager from '../interfaces/HMSDeviceManager';
import HMSLogger from '../utils/logger';
import { HMSLocalAudioTrack } from '../media/tracks/HMSLocalAudioTrack';
import { HMSLocalVideoTrack } from '../media/tracks/HMSLocalVideoTrack';
import { HMSAudioTrackSettingsBuilder } from '../media/settings/HMSAudioTrackSettings';
import { HMSVideoTrackSettingsBuilder } from '../media/settings/HMSVideoTrackSettings';
import { HMSLocalPeer } from '../sdk/models/peer';
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
  localPeer!: HMSLocalPeer | null;

  private eventEmitter: EventEmitter = new EventEmitter();
  private TAG: string = '[Device Manager]:';
  private initialized = false;

  constructor(private store: IStore) {}

  updateOutputDevice = (newDevice: MediaDeviceInfo | undefined) => {
    this.selected.audioOutput = newDevice;
    this.selected.audioOutput && this.store.updateAudioOutputDevice(this.selected.audioOutput);
  };

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    navigator.mediaDevices.ondevicechange = () => this.handleDeviceChange();
    await this.enumerateDevices();
    HMSLogger.d(this.TAG, '[DeviceList]', JSON.stringify(this.selected, null, 2));
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
      })
      .catch((error) => {
        HMSLogger.e(this.TAG, 'Failed enumerating devices', error);
      });
  };

  private handleDeviceChange = async () => {
    const prevSelectedAudioInput = this.selected.audioInput;
    const prevSelectedVideoInput = this.selected.videoInput;
    const prevSelectedAudioOutput = this.selected.audioOutput;
    await this.enumerateDevices();
    analyticsEventsService
      .queue(AnalyticsEventFactory.deviceChange({ selection: this.selected, type: 'list', devices: this.getDevices() }))
      .flush();
    HMSLogger.d(this.TAG, '[After Device Change]', JSON.stringify(this.selected, null, 2));

    if (prevSelectedAudioOutput?.deviceId !== this.selected.audioOutput?.deviceId) {
      this.updateOutputDevice(this.selected.audioOutput);
    }

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
}
