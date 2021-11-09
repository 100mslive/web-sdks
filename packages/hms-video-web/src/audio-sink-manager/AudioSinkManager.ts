import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { v4 as uuid } from 'uuid';
import { HMSAudioTrack } from '../media/tracks';
import { DeviceManager } from '../device-manager';
import { NotificationManager } from '../notification-manager/NotificationManager';
import HMSLogger from '../utils/logger';
import { IStore } from '../sdk/store';
import { HMSException } from '../error/HMSException';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { HMSDeviceChangeEvent, HMSUpdateListener, HMSTrackUpdate } from '../interfaces';
import { HMSRemotePeer } from '../sdk/models/peer';
import { isMobile } from '../utils/support';
import { EventBus } from '../events/EventBus';

export interface AutoplayEvent {
  error: HMSException;
}

export const AutoplayError = 'autoplay-error';

type AudioSinkState = {
  autoplayFailed?: boolean;
  initialized: boolean;
  // this promise will be set for the first track. remaining tracks will be processed once it's know whether
  // autoplay is allowed or not
  autoplayCheckPromise?: Promise<void>;
};

const INITIAL_STATE: AudioSinkState = {
  autoplayFailed: undefined,
  initialized: false,
  autoplayCheckPromise: undefined,
};

export class AudioSinkManager {
  private audioSink?: HTMLElement;
  private autoPausedTracks: Set<HMSAudioTrack> = new Set();
  private TAG = '[AudioSinkManager]:';
  private volume: number = 100;
  private eventEmitter: EventEmitter = new EventEmitter();
  private state = { ...INITIAL_STATE };
  private audioContext?: AudioContext;
  private listener?: HMSUpdateListener;

  constructor(
    private store: IStore,
    private notificationManager: NotificationManager,
    private deviceManager: DeviceManager,
    private eventBus: EventBus,
  ) {
    this.notificationManager.addEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.addEventListener('track-removed', this.handleTrackRemove as EventListener);
    this.notificationManager.addEventListener('track-updated', this.handleTrackUpdate as EventListener);
    this.eventBus.deviceChange.subscribe(this.handleAudioDeviceChange);
    // Initiate a Audio Context so safari will play audio on speaker instead of earpiece
    this.audioContext = new AudioContext();
  }

  setListener(listener?: HMSUpdateListener) {
    this.listener = listener;
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

  /**
   *  This function is to be called only on user interaction when
   *  autoplay error is received.
   */
  async unblockAutoplay() {
    if (this.autoPausedTracks.size > 0) {
      this.unpauseAudioTracks();
    }
  }

  init(elementId?: string) {
    if (this.state.initialized) {
      return;
    }
    this.state.initialized = true;
    const audioSink = document.createElement('div');
    audioSink.id = `HMS-SDK-audio-sink-${uuid()}`;
    const userElement = elementId && document.getElementById(elementId);
    const audioSinkParent = userElement || document.body;
    audioSinkParent.append(audioSink);

    this.audioSink = audioSink;
  }

  cleanUp() {
    this.audioSink?.remove();
    this.audioSink = undefined;
    this.audioContext?.close();
    this.audioContext = undefined;
    this.notificationManager.removeEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.removeEventListener('track-removed', this.handleTrackRemove as EventListener);
    this.notificationManager.removeEventListener('track-updated', this.handleTrackUpdate as EventListener);
    this.eventBus.deviceChange.unsubscribe(this.handleAudioDeviceChange);
    this.autoPausedTracks = new Set();
    this.state = { ...INITIAL_STATE };
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
    const audioTrack = this.store.getTrackById(event.target.id);
    if (audioTrack) {
      if (isMobile()) {
        // Play after a delay since mobile devices don't call onDevice change event
        setTimeout(async () => {
          if (audioTrack) {
            await this.playAudioFor(audioTrack as HMSAudioTrack);
          }
        }, 500);
      } else {
        this.autoPausedTracks.add(audioTrack as HMSAudioTrack);
      }
    }
  };

  private handleTrackUpdate = (event: CustomEvent<{ track: HMSAudioTrack; enabled: boolean }>) => {
    // @ts-ignore
    if (window.HMS?.AUDIO_SINK) {
      const { track, enabled } = event.detail;
      if (enabled) {
        track.addSink();
        this.playAudioFor(track);
      } else {
        track.removeSink();
      }
    }
  };

  private handleTrackAdd = (event: CustomEvent<{ track: HMSAudioTrack; peer: HMSRemotePeer }>) => {
    this.handleTrackAddAsync(event);
  };

  private handleTrackAddAsync = async (event: CustomEvent<{ track: HMSAudioTrack; peer: HMSRemotePeer }>) => {
    const { track, peer } = event.detail;

    const audioEl = document.createElement('audio');
    audioEl.style.display = 'none';
    audioEl.id = track.trackId;
    audioEl.addEventListener('pause', this.handleAudioPaused);

    track.setAudioElement(audioEl);
    track.setVolume(this.volume);
    HMSLogger.d(this.TAG, 'Audio track added', track.trackId);
    this.audioSink?.append(audioEl);
    this.outputDevice && (await track.setOutputDevice(this.outputDevice));
    // @ts-ignore
    if (window.HMS?.AUDIO_SINK) {
      // No need to play if track is not enabled
      if (!track.enabled) {
        track.removeSink();
        this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, peer);
        return;
      }
      track.addSink();
    } else {
      audioEl.srcObject = new MediaStream([track.nativeTrack]);
    }
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, peer);
    /**
     * if it's not known whether autoplay will succeed, wait for it to be known
     */
    if (this.state.autoplayFailed === undefined) {
      if (!this.state.autoplayCheckPromise) {
        // it's the first track, try to play it, that'll tell us whether autoplay is allowed
        this.state.autoplayCheckPromise = new Promise<void>((resolve) => {
          this.playAudioFor(track).then(resolve);
        });
      }
      // and wait for the result to be known
      await this.state.autoplayCheckPromise;
    }
    /**
     * Don't play the track if autoplay failed, add to paused list
     */
    if (this.state.autoplayFailed) {
      this.autoPausedTracks.add(track);
      return;
    }
    await this.playAudioFor(track);
  };

  private handleAudioDeviceChange = (event: HMSDeviceChangeEvent) => {
    // if there is no selection that means this is an init request. No need to do anything
    if (event.error || !event.selection || event.type === 'video') {
      return;
    }
    this.unpauseAudioTracks();
  };

  /**
   * try to play audio for the passed in track, assume autoplay error happened if play fails
   * @param track
   * @private
   */
  private async playAudioFor(track: HMSAudioTrack) {
    const audioEl = track.getAudioElement();
    if (!audioEl) {
      HMSLogger.w(this.TAG, 'No audio element found on track', track.trackId);
      return;
    }
    try {
      if (this.audioContext?.state === 'suspended') {
        this.audioContext?.resume();
      }
      await audioEl.play();
      this.state.autoplayFailed = false;
      this.autoPausedTracks.delete(track);
      HMSLogger.d(this.TAG, 'Played track', track.trackId);
    } catch (error) {
      this.autoPausedTracks.add(track);
      HMSLogger.e(this.TAG, 'Failed to play track', track.trackId, error);
      if (!this.state.autoplayFailed) {
        this.state.autoplayFailed = true;
        const ex = ErrorFactory.TracksErrors.AutoplayBlocked(HMSAction.AUTOPLAY, '');
        this.eventEmitter.emit(AutoplayError, { error: ex });
      }
    }
  }

  private handleTrackRemove = (event: CustomEvent<HMSAudioTrack>) => {
    const track = event.detail;
    this.autoPausedTracks.delete(track);
    const audioEl = document.getElementById(track.trackId) as HTMLAudioElement;
    if (audioEl) {
      audioEl.removeEventListener('pause', this.handleAudioPaused);
      audioEl.srcObject = null;
      audioEl.remove();
      track.setAudioElement(null);
    }
    // Reset autoplay error thrown because if all tracks are removed and a new track is added
    // Autoplay error is thrown in safari
    if (this.audioSink && this.audioSink.childElementCount === 0) {
      this.state.autoplayCheckPromise = undefined;
      this.state.autoplayFailed = undefined;
    }
    HMSLogger.d(this.TAG, 'Audio track removed', track.trackId);
  };

  private unpauseAudioTracks = async () => {
    const promises: Promise<void>[] = [];
    this.autoPausedTracks.forEach((track) => {
      promises.push(this.playAudioFor(track));
    });
    // Return after all pending tracks are played
    await Promise.all(promises);
  };
}
