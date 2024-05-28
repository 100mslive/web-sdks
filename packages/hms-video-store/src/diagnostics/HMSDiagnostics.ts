import { HMSDiagnosticsInterface } from './interfaces';
import { DeviceManager } from '../device-manager';
import { EventBus } from '../events/EventBus';
import { HMSLocalAudioTrack, HMSLocalVideoTrack, HMSPeerType, HMSRole } from '../internal';
import { HMSAudioTrackSettingsBuilder, HMSTrackSettingsBuilder, HMSVideoTrackSettingsBuilder } from '../media/settings';
import { LocalTrackManager } from '../sdk/LocalTrackManager';
import { HMSLocalPeer } from '../sdk/models/peer';
import { Store } from '../sdk/store';
import { sleep } from '../utils/timer-utils';

const baseRole: HMSRole = {
  name: 'diagnostics-role',
  priority: 1,
  publishParams: {
    allowed: ['audio', 'video'],
    audio: { bitRate: 32, codec: 'opus' },
    video: {
      bitRate: 100,
      codec: 'vp8',
      frameRate: 30,
      height: 720,
      width: 1280,
    },
    screen: {
      bitRate: 100,
      codec: 'vp8',
      frameRate: 10,
      height: 1080,
      width: 1920,
    },
  },
  subscribeParams: {
    subscribeToRoles: [],
    maxSubsBitRate: 3200,
  },
  permissions: {
    browserRecording: false,
    changeRole: false,
    endRoom: false,
    hlsStreaming: false,
    mute: false,
    pollRead: false,
    pollWrite: false,
    removeOthers: false,
    rtmpStreaming: false,
    unmute: false,
  },
};

const DEFAULT_TEST_AUDIO_URL = 'https://100ms.live/test-audio.wav';

export class Diagnostics implements HMSDiagnosticsInterface {
  private store: Store;
  private eventBus: EventBus;
  private deviceManager: DeviceManager;
  private recordedAudio?: string = DEFAULT_TEST_AUDIO_URL;

  constructor(private customerUserID?: string) {
    this.store = new Store();
    this.eventBus = new EventBus(false);
    this.deviceManager = new DeviceManager(this.store, this.eventBus, false);

    const localPeer = new HMSLocalPeer({
      name: 'diagnostics-peer',
      role: baseRole,
      type: HMSPeerType.REGULAR,
    });

    this.store.addPeer(localPeer);
  }

  get localPeer() {
    return this.store.getLocalPeer();
  }

  async startCameraCheck(inputDevice?: string) {
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }

    const localTrackManager = new LocalTrackManager(
      this.store,
      {
        onFailure: exception => {
          throw exception;
        },
      },
      this.deviceManager,
      this.eventBus,
    );

    this.localPeer.role = {
      ...baseRole,
      publishParams: { ...baseRole.publishParams, allowed: ['video'] },
    };
    this.deviceManager.init();
    const settings = new HMSTrackSettingsBuilder()
      .video(new HMSVideoTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await localTrackManager.getLocalTracks({ audio: false, video: true }, settings);
    const track = tracks.find(track => track.type === 'video') as HMSLocalVideoTrack;

    if (!track) {
      throw new Error('No video track found');
    }

    this.localPeer.videoTrack = track;

    return {
      track,
      stop: () => {
        track.cleanup();
        if (this.localPeer) {
          this.localPeer.videoTrack = undefined;
        }
      },
    };
  }

  async startMicCheck(inputDevice?: string, time = 10000) {
    const track = await this.getLocalAudioTrack(inputDevice);
    if (!this.localPeer) {
      throw new Error('Local peer not found');
    }
    if (!track) {
      throw new Error('No audio track found');
    }

    this.localPeer.audioTrack = track;

    const mediaRecorder = new MediaRecorder(track.stream.nativeStream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      this.recordedAudio = URL.createObjectURL(blob);
    };

    const stop = () => {
      mediaRecorder.stop();
      track.cleanup();
      if (this.localPeer) {
        this.localPeer.audioTrack = undefined;
      }
    };

    mediaRecorder.start();
    sleep(time).then(stop);

    return { track, stop };
  }

  getRecordedAudio() {
    return this.recordedAudio;
  }

  private async getLocalAudioTrack(inputDevice?: string) {
    if (!this.localPeer) {
      return;
    }

    const localTrackManager = new LocalTrackManager(
      this.store,
      {
        onFailure: exception => {
          throw exception;
        },
      },
      this.deviceManager,
      this.eventBus,
    );

    this.localPeer.role = {
      ...baseRole,
      publishParams: { ...baseRole.publishParams, allowed: ['audio'] },
    };
    this.deviceManager.init();
    const settings = new HMSTrackSettingsBuilder()
      .audio(new HMSAudioTrackSettingsBuilder().deviceId(inputDevice || 'default').build())
      .build();
    const tracks = await localTrackManager.getLocalTracks({ audio: true, video: false }, settings);
    return tracks.find(track => track.type === 'audio') as HMSLocalAudioTrack;
  }
}
