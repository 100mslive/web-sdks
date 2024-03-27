import { DeviceStorageManager } from './DeviceStorage';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSException } from '../error/HMSException';
import { EventBus } from '../events/EventBus';
import { DeviceMap, HMSDeviceChangeEvent, SelectedDevices } from '../interfaces';
import { HMSAudioTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack } from '../media/tracks';
import { Store } from '../sdk/store';
import HMSLogger from '../utils/logger';
import { debounce } from '../utils/timer-utils';

type DeviceAndGroup = Partial<MediaTrackSettings>;

interface HMSDeviceManager extends DeviceMap {
  outputDevice?: MediaDeviceInfo;
  hasWebcamPermission: boolean;
  hasMicrophonePermission: boolean;
}

export class DeviceManager implements HMSDeviceManager {
  audioInput: InputDeviceInfo[] = [];
  audioOutput: MediaDeviceInfo[] = [];
  videoInput: InputDeviceInfo[] = [];
  outputDevice?: MediaDeviceInfo;
  // true if user has allowed the permission
  // false if user has denied the permission or prompt was never shown or ignored
  // or if the camera/mic is not available in the device
  hasWebcamPermission = false;
  hasMicrophonePermission = false;

  private readonly TAG = '[Device Manager]:';
  private initialized = false;
  private videoInputChanged = false;
  private audioInputChanged = false;

  constructor(private store: Store, private eventBus: EventBus) {
    const isLocalTrackEnabled = ({ enabled, track }: { enabled: boolean; track: HMSLocalTrack }) =>
      enabled && track.source === 'regular';
    this.eventBus.localVideoEnabled.waitFor(isLocalTrackEnabled).then(async () => {
      await this.enumerateDevices();
      if (this.videoInputChanged) {
        this.eventBus.deviceChange.publish({ devices: this.getDevices() } as HMSDeviceChangeEvent);
      }
    });
    this.eventBus.localAudioEnabled.waitFor(isLocalTrackEnabled).then(async () => {
      await this.enumerateDevices();
      if (this.audioInputChanged) {
        this.eventBus.deviceChange.publish({ devices: this.getDevices() } as HMSDeviceChangeEvent);
      }
    });

    this.eventBus.deviceChange.subscribe(({ type, isUserSelection, selection }) => {
      if (isUserSelection) {
        const inputType = type === 'video' ? 'videoInput' : type;
        const newSelection = this[inputType].find(
          device => this.createIdentifier(device) === this.createIdentifier(selection),
        );
        this.eventBus.analytics.publish(
          AnalyticsEventFactory.deviceChange({
            selection: { [inputType]: newSelection },
            devices: this.getDevices(),
            type,
            isUserSelection,
          }),
        );
      }
    });
  }

  updateOutputDevice = async (deviceId?: string, isUserSelection?: boolean) => {
    const newDevice = this.audioOutput.find(device => device.deviceId === deviceId);
    if (newDevice) {
      this.outputDevice = newDevice;
      await this.store.updateAudioOutputDevice(newDevice);
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          isUserSelection,
          selection: { audioOutput: newDevice },
          devices: this.getDevices(),
          type: 'audioOutput',
        }),
      );
      DeviceStorageManager.updateSelection('audioOutput', { deviceId: newDevice.deviceId, groupId: newDevice.groupId });
    }
    return newDevice;
  };

  async init(force = false, logAnalytics = true) {
    if (this.initialized && !force) {
      return;
    }
    !this.initialized && navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
    this.initialized = true;
    await this.enumerateDevices();
    this.logDevices('Init');
    await this.setOutputDevice();
    this.eventBus.deviceChange.publish({
      devices: this.getDevices(),
    } as HMSDeviceChangeEvent);
    if (logAnalytics) {
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          selection: this.getCurrentSelection(),
          type: 'list',
          devices: this.getDevices(),
        }),
      );
    }
  }

  getDevices(): DeviceMap {
    return {
      audioInput: this.audioInput,
      audioOutput: this.audioOutput,
      videoInput: this.videoInput,
    };
  }

  cleanup() {
    this.initialized = false;
    this.audioInput = [];
    this.audioOutput = [];
    this.videoInput = [];
    this.outputDevice = undefined;
    navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
  }

  getCurrentSelection = (): SelectedDevices => {
    const localPeer = this.store.getLocalPeer();
    const audioDevice = this.createIdentifier(localPeer?.audioTrack?.getMediaTrackSettings());
    const videoDevice = this.createIdentifier(localPeer?.videoTrack?.getMediaTrackSettings());
    const audioSelection = this.audioInput.find(device => {
      const id = this.createIdentifier(device);
      return id === audioDevice;
    });
    const videoSelection = this.videoInput.find(device => this.createIdentifier(device) === videoDevice);
    return {
      audioInput: audioSelection,
      videoInput: videoSelection,
      audioOutput: this.outputDevice,
    };
  };

  private createIdentifier(deviceInfo?: DeviceAndGroup) {
    if (!deviceInfo) {
      return '';
    }
    return `${deviceInfo.deviceId}${deviceInfo.groupId}`;
  }

  private computeChange = (prevDevices: string[], currentDevices: MediaDeviceInfo[]) => {
    if (prevDevices.length !== currentDevices.length) {
      return true;
    }
    return currentDevices.some(device => !prevDevices.includes(this.createIdentifier(device)));
  };

  private enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const prevVideoInput = this.videoInput.map(this.createIdentifier);
      const prevAudioInput = this.audioInput.map(this.createIdentifier);
      this.audioInput = [];
      this.audioOutput = [];
      this.videoInput = [];
      devices.forEach(device => {
        if (device.kind === 'audioinput' && device.label) {
          this.hasMicrophonePermission = true;
          this.audioInput.push(device as InputDeviceInfo);
        } else if (device.kind === 'audiooutput') {
          this.audioOutput.push(device);
        } else if (device.kind === 'videoinput' && device.label) {
          this.hasWebcamPermission = true;
          this.videoInput.push(device as InputDeviceInfo);
        }
      });
      this.videoInputChanged = this.computeChange(prevVideoInput, this.videoInput);
      this.audioInputChanged = this.computeChange(prevAudioInput, this.audioInput);
      DeviceStorageManager.setDevices({
        videoInput: [...this.videoInput],
        audioInput: [...this.audioInput],
        audioOutput: [...this.audioOutput],
      });
      this.logDevices('Enumerate Devices');
    } catch (error) {
      HMSLogger.e(this.TAG, 'Failed enumerating devices', error);
    }
  };

  private handleDeviceChange = debounce(async () => {
    await this.enumerateDevices();
    this.logDevices('After Device Change');
    const localPeer = this.store.getLocalPeer();
    await this.setOutputDevice(true);
    await this.handleAudioInputDeviceChange(localPeer?.audioTrack);
    await this.handleVideoInputDeviceChange(localPeer?.videoTrack);
    this.eventBus.analytics.publish(
      AnalyticsEventFactory.deviceChange({
        selection: this.getCurrentSelection(),
        type: 'change',
        devices: this.getDevices(),
      }),
    );
  }, 500).bind(this);

  /**
   * Function to get the device after device change
   * Chrome and Edge provide a default device from which we select the actual device
   * Firefox and safari give 0th device as system default
   * @returns {MediaDeviceInfo}
   */
  getNewAudioInputDevice() {
    const localPeer = this.store.getLocalPeer();
    const audioTrack = localPeer?.audioTrack;
    const manualSelection = this.audioInput.find(
      device => device.deviceId === audioTrack?.getManuallySelectedDeviceId(),
    );
    if (manualSelection) {
      return manualSelection;
    }
    // if manually selected device is not available, reset on the track
    audioTrack?.resetManuallySelectedDeviceId();
    const defaultDevice = this.audioInput.find(device => device.deviceId === 'default');
    if (defaultDevice) {
      // Selecting a non-default device so that the deviceId comparision does not give
      // false positives when device is removed, because the other available device
      // get's the deviceId as default once this device is removed
      const nextDevice = this.audioInput.find(device => {
        return device.deviceId !== 'default' && defaultDevice.label.includes(device.label);
      });
      return nextDevice;
    }
    return this.audioInput[0];
  }

  /**
   * This method is to select the input/output from same group
   * same group meaning both input/output are of same device
   * This method might override the default coming from browser and system so as to select options from same
   * device type. This is required in certain cases where browser's default is not correct.
   * Algo:
   * 1. find the non default input device if selected one is default by matching device label
   * 2. find the corresponding output device which has the same group id or same label
   * 3. select the previous selected device if nothing was found
   * 4. select the default one if no matching device was found and previous device doesn't exist anymore
   * 5. select the first option if there is no default
   */
  async setOutputDevice(deviceChange = false) {
    const inputDevice = this.getNewAudioInputDevice();
    const prevSelection = this.createIdentifier(this.outputDevice);
    this.outputDevice = this.getAudioOutputDeviceMatchingInput(inputDevice);
    if (!this.outputDevice) {
      // there is no matching device, let's revert back to the prev selected device
      this.outputDevice = this.audioOutput.find(device => this.createIdentifier(device) === prevSelection);
      if (!this.outputDevice) {
        // prev device doesn't exist as well, select default deviceId device if available, otherwise select 0th device
        this.outputDevice = this.audioOutput.find(device => device.deviceId === 'default') || this.audioOutput[0];
      }
    }
    await this.store.updateAudioOutputDevice(this.outputDevice);
    // send event only on device change and device is not same as previous
    if (deviceChange && prevSelection !== this.createIdentifier(this.outputDevice)) {
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          selection: { audioOutput: this.outputDevice },
          devices: this.getDevices(),
          type: 'audioOutput',
        }),
      );
      this.eventBus.deviceChange.publish({
        selection: this.outputDevice,
        type: 'audioOutput',
        devices: this.getDevices(),
      } as HMSDeviceChangeEvent);
    }
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
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          selection: { audioInput: newSelection },
          error: ErrorFactory.TracksErrors.SelectedDeviceMissing('audio'),
          devices: this.getDevices(),
          type: 'audioInput',
        }),
      );

      HMSLogger.e(this.TAG, 'Audio device not found');
      return;
    }
    const { settings } = audioTrack;
    const newAudioTrackSettings = new HMSAudioTrackSettingsBuilder()
      .codec(settings.codec)
      .maxBitrate(settings.maxBitrate)
      .deviceId(newSelection.deviceId)
      .build();
    try {
      await audioTrack.setSettings(newAudioTrackSettings, true);
      this.eventBus.deviceChange.publish({
        devices: this.getDevices(),
        selection: newSelection,
        type: 'audioInput',
      } as HMSDeviceChangeEvent);
      this.logDevices('Audio Device Change Success');
    } catch (error) {
      HMSLogger.e(this.TAG, '[Audio Device Change]', error);
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          selection: { audioInput: newSelection },
          devices: this.getDevices(),
          type: 'audioInput',
          error: error as HMSException,
        }),
      );
      this.eventBus.deviceChange.publish({
        error,
        selection: newSelection,
        type: 'audioInput',
        devices: this.getDevices(),
      } as HMSDeviceChangeEvent);
    }
  };

  private handleVideoInputDeviceChange = async (videoTrack?: HMSLocalVideoTrack) => {
    if (!videoTrack) {
      HMSLogger.d(this.TAG, 'No video track on local peer');
      return;
    }
    // no need to proceed further if input has not changed
    if (!this.videoInputChanged) {
      HMSLogger.d(this.TAG, 'No Change in VideoInput Device');
      return;
    }
    const newSelection = this.videoInput[0];
    if (!newSelection || !newSelection.deviceId) {
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          selection: { videoInput: newSelection },
          error: ErrorFactory.TracksErrors.SelectedDeviceMissing('video'),
          devices: this.getDevices(),
          type: 'video',
        }),
      );
      HMSLogger.e(this.TAG, 'Video device not found');
      return;
    }
    const { settings } = videoTrack;
    const newVideoTrackSettings = new HMSVideoTrackSettingsBuilder()
      .codec(settings.codec)
      .maxBitrate(settings.maxBitrate)
      .maxFramerate(settings.maxFramerate)
      .setWidth(settings.width)
      .setHeight(settings.height)
      .deviceId(newSelection.deviceId)
      .build();
    try {
      await (videoTrack as HMSLocalVideoTrack).setSettings(newVideoTrackSettings, true);
      // On replace track, enabled will be true. Need to be set to previous state
      // videoTrack.setEnabled(enabled); // TODO: remove this once verified on qa.
      this.eventBus.deviceChange.publish({
        devices: this.getDevices(),
        selection: newSelection,
        type: 'video',
      } as HMSDeviceChangeEvent);
      this.logDevices('Video Device Change Success');
    } catch (error) {
      HMSLogger.e(this.TAG, '[Video Device Change]', error);
      this.eventBus.analytics.publish(
        AnalyticsEventFactory.deviceChange({
          selection: { videoInput: newSelection },
          devices: this.getDevices(),
          type: 'video',
          error: error as HMSException,
        }),
      );
      this.eventBus.deviceChange.publish({
        error: error as HMSException,
        type: 'video',
        selection: newSelection,
        devices: this.getDevices(),
      } as HMSDeviceChangeEvent);
    }
  };

  // eslint-disable-next-line complexity
  private getAudioOutputDeviceMatchingInput(inputDevice?: MediaDeviceInfo) {
    const blacklist = this.store.getConfig()?.settings?.speakerAutoSelectionBlacklist || [];
    if (blacklist === 'all' || !inputDevice) {
      return;
    }

    const inputLabel = inputDevice.label.toLowerCase() || '';
    if (blacklist.some(label => inputLabel.includes(label.toLowerCase()))) {
      return;
    }

    const matchingLabel = this.audioOutput.find(
      device => inputDevice.deviceId !== 'default' && device.label === inputDevice.label,
    );

    if (matchingLabel) {
      return matchingLabel;
    }

    const matchingGroupId = this.audioOutput.find(device => device.groupId === inputDevice.groupId);

    // Select the device with matching group only when it is the default device
    // if a earphone without mic is connected, the above would pick system speakers instead of the earphone
    if (
      matchingGroupId &&
      this.audioOutput[0].deviceId === 'default' &&
      matchingGroupId.groupId === this.audioOutput[0].groupId
    ) {
      return matchingGroupId;
    }

    return;
  }

  private logDevices(label = '') {
    HMSLogger.d(
      this.TAG,
      label,
      JSON.stringify(
        {
          videoInput: [...this.videoInput],
          audioInput: [...this.audioInput],
          audioOutput: [...this.audioOutput],
          selected: this.getCurrentSelection(),
        },
        null,
        4,
      ),
    );
  }
}
