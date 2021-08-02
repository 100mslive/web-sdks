import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { HMSAudioTrack } from '../media/tracks/HMSAudioTrack';
import { DeviceManager } from '../device-manager';
import NotificationManager from '../sdk/NotificationManager';
import HMSLogger from '../utils/logger';
import { IStore } from '../sdk/store';
import { HMSException } from '../error/HMSException';
import { playSilentAudio } from '../utils/autoplay';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';

export interface AutoplayEvent {
  error: HMSException;
}

export const AutoplayError = 'autoplay-error';
export class AudioSinkManager {
  private audioSink?: HTMLElement;
  private autoPausedTracks: Set<string> = new Set();
  private playInProgress = false;
  private TAG = '[AudioSinkManager]:';
  private initialized = false;
  private volume: number = 100;
  private silentAudio?: HTMLAudioElement;
  private eventEmitter: EventEmitter = new EventEmitter();
  private autoplayFailed: boolean | undefined;
  private tracksToAdd = new Set<HMSAudioTrack>();

  constructor(
    private store: IStore,
    private notificationManager: NotificationManager,
    private deviceManager: DeviceManager,
  ) {
    this.notificationManager.addEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.addEventListener('track-removed', this.handleTrackRemove as EventListener);
    this.deviceManager.addEventListener('audio-device-change', this.handleAudioDeviceChange);
  }

  addEventListener(event: string, listener: (event: AutoplayEvent) => void) {
    this.eventEmitter.addListener(event, listener);
  }

  removeEventListener(event: string, listener: (event: AutoplayEvent) => void) {
    this.eventEmitter.removeListener(event, listener);
  }

  private get outputDevice() {
    return this.deviceManager.outputDevice;
  }

  getVolume() {
    return this.volume;
  }

  setVolume(value: number) {
    this.store.updateAudioOutputVolume(value);
    this.volume = value;
  }

  async unblockAutoplay() {
    if (!this.autoplayFailed) {
      return;
    }
    try {
      await this.silentAudio?.play();
      this.autoplayFailed = false;
    } catch (error) {
      this.autoplayFailed = true;
      HMSLogger.e(this.TAG, error);
    }
    this.addPendingTracks();
  }

  init(elementId?: string) {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const audioSink = document.createElement('div');
    audioSink.id = `HMS-SDK-audio-sink-${uuid()}`;
    const userElement = elementId && document.getElementById(elementId);
    const audioSinkParent = userElement || document.body;
    audioSinkParent.append(audioSink);

    this.audioSink = audioSink;
    this.addSilentAudio();
  }

  cleanUp() {
    this.notificationManager.removeEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.removeEventListener('track-removed', this.handleTrackRemove as EventListener);
    this.deviceManager.removeEventListener('audio-device-change', this.handleAudioDeviceChange);
    this.audioSink?.remove();
    this.autoPausedTracks = new Set();
    this.playInProgress = false;
    this.initialized = false;
    this.autoplayFailed = false;
  }

  private addSilentAudio() {
    return playSilentAudio().then(({ audio, error }: { audio: HTMLAudioElement; error?: Error }) => {
      if (error) {
        this.autoplayFailed = true;
        const ex = ErrorFactory.TracksErrors.AutoplayBlocked(HMSAction.AUTOPLAY, '');
        this.eventEmitter.emit(AutoplayError, { error: ex });
      } else {
        this.autoplayFailed = false;
        this.addPendingTracks();
      }
      this.silentAudio = audio;
    });
  }

  private handleAudioPaused = (event: any) => {
    const audioEl = event.target as HTMLAudioElement;
    //@ts-ignore
    const track = audioEl.srcObject?.getAudioTracks()[0];
    if (!track?.enabled) {
      // No need to play if already disabled
      return;
    }
    // this means the audio paused because of external factors(headset removal)
    HMSLogger.d(this.TAG, 'Audio Paused', event.target.id);
    this.autoPausedTracks.add(event.target.id);
    if (!this.playInProgress) {
      this.handleAudioDeviceChange();
    }
  };

  private handleTrackAdd = (event: CustomEvent<HMSAudioTrack>) => {
    const track = event.detail;
    // undefined is necessary to handle a case where trackAdd is called before autoplay
    if (this.autoplayFailed === undefined || this.autoplayFailed === true) {
      this.tracksToAdd.add(track);
    } else {
      this.addToDOM(track);
    }
  };

  private addPendingTracks() {
    for (let track of Array.from(this.tracksToAdd)) {
      this.addToDOM(track);
      this.tracksToAdd.delete(track);
    }
  }

  private addToDOM = (track: HMSAudioTrack) => {
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.style.display = 'none';
    audioEl.id = track.trackId;
    audioEl.srcObject = new MediaStream([track.nativeTrack]);
    audioEl.addEventListener('pause', this.handleAudioPaused);
    HMSLogger.d(this.TAG, 'Audio track added', track.trackId);
    this.audioSink?.append(audioEl);
    track.setAudioElement(audioEl);
    this.outputDevice && track.setOutputDevice(this.outputDevice);
    track.setVolume(this.volume);
  };

  private handleTrackRemove = (event: CustomEvent<HMSAudioTrack>) => {
    const track = event.detail;
    HMSLogger.d(this.TAG, 'Audio track removed', track.trackId);
    const audioEl = document.getElementById(track.trackId);
    this.autoPausedTracks.delete(track.trackId);
    if (audioEl) {
      audioEl.removeEventListener('pause', this.handleAudioPaused);
      audioEl.remove();
      track.setAudioElement(null);
    }
  };

  private handleAudioDeviceChange = async () => {
    if (this.playInProgress) {
      return;
    }
    this.playInProgress = true;
    for (let trackId of Array.from(this.autoPausedTracks)) {
      const audioEl = document.getElementById(trackId);
      if (audioEl) {
        try {
          await (audioEl as HTMLAudioElement).play();
          HMSLogger.d(this.TAG, 'Audio Resumed', trackId);
          this.autoPausedTracks.delete(trackId);
        } catch (error) {
          HMSLogger.e(this.TAG, 'Failed to play track', trackId);
        }
      }
    }
    this.playInProgress = false;
  };
}
