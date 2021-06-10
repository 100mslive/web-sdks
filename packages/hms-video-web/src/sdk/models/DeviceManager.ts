import HMSPeer from '../../interfaces/hms-peer';
import HMSDeviceManager from '../../interfaces/HMSDeviceManager';
import HMSLogger from '../../utils/logger';
import HMSLocalAudioTrack from '../../media/tracks/HMSLocalAudioTrack';
import HMSLocalVideoTrack from '../../media/tracks/HMSLocalVideoTrack';
import { HMSAudioTrackSettingsBuilder } from '../../media/settings/HMSAudioTrackSettings';
import { HMSVideoTrackSettingsBuilder } from '../../media/settings/HMSVideoTrackSettings';

export default class DeviceManager implements HMSDeviceManager {
  audioInput: InputDeviceInfo[] = [];
  audioOutput: MediaDeviceInfo[] = [];
  videoInput: InputDeviceInfo[] = [];

  selected!: {
    audioInput: InputDeviceInfo;
    audioOutput: MediaDeviceInfo;
    videoInput: InputDeviceInfo;
  };

  localPeer!: HMSPeer | null;

  private TAG: string = '[Device Manager]:';

  constructor() {
    navigator.mediaDevices.ondevicechange = () => this.handleDeviceChange();
    this.enumerateDevices();
  }

  private enumerateDevices = () => {
    navigator.mediaDevices
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

  handleDeviceChange = async () => {
    const prevSelectedAudioInput = this.selected.audioInput;
    const prevSelectedVideoInput = this.selected.videoInput;
    this.enumerateDevices();

    if (
      this.localPeer &&
      this.localPeer.audioTrack &&
      prevSelectedAudioInput.deviceId !== this.selected.audioInput.deviceId
    ) {
      const prevAudioTrackSettings = (this.localPeer.audioTrack as HMSLocalAudioTrack).settings;
      const prevAudioEnabled = this.localPeer.audioTrack.enabled;
      const newAudioTrackSettings = new HMSAudioTrackSettingsBuilder()
        .codec(prevAudioTrackSettings.codec)
        .maxBitrate(prevAudioTrackSettings.maxBitrate)
        .deviceId(this.selected.audioInput.deviceId)
        .build();
      await (this.localPeer.audioTrack as HMSLocalAudioTrack).setSettings(newAudioTrackSettings);
      if (!prevAudioEnabled) {
        this.localPeer.audioTrack.setEnabled(prevAudioEnabled);
      }
    }

    if (
      this.localPeer &&
      this.localPeer.videoTrack &&
      prevSelectedVideoInput.deviceId !== this.selected.videoInput.deviceId
    ) {
      const prevVideoTrackSettings = (this.localPeer.videoTrack as HMSLocalVideoTrack).settings;
      const prevVideoEnabled = this.localPeer.videoTrack.enabled;
      const newVideoTrackSettings = new HMSVideoTrackSettingsBuilder()
        .codec(prevVideoTrackSettings.codec)
        .maxBitrate(prevVideoTrackSettings.maxBitrate)
        .maxFramerate(prevVideoTrackSettings.maxFramerate)
        .setWidth(prevVideoTrackSettings.width)
        .setHeight(prevVideoTrackSettings.height)
        .deviceId(this.selected.videoInput.deviceId)
        .build();
      await (this.localPeer.videoTrack as HMSLocalVideoTrack).setSettings(newVideoTrackSettings);
      if (!prevVideoEnabled) {
        this.localPeer.videoTrack.setEnabled(prevVideoEnabled);
      }
    }
  };
}
