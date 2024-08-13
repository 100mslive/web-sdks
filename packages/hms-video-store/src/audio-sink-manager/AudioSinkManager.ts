import { v4 as uuid } from 'uuid';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { DeviceManager } from '../device-manager';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { EventBus } from '../events/EventBus';
import { HMSDeviceChangeEvent, HMSTrackUpdate, HMSUpdateListener } from '../interfaces';
import { isMobile } from '../internal';
import { HMSRemoteAudioTrack } from '../media/tracks';
import { HMSRemotePeer } from '../sdk/models/peer';
import { Store } from '../sdk/store';
import HMSLogger from '../utils/logger';
import { sleep } from '../utils/timer-utils';

/**
 * Following are the errors thrown when autoplay is blocked in different browsers
 * Firefox - DOMException: The play method is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.
 * Safari - NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.
 * Chrome - DOMException: play() failed because the user didn't interact with the document first.
 * Brave - DOMException: play() can only be initiated by a user gesture.
 */
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
  private autoPausedTracks: Set<HMSRemoteAudioTrack> = new Set();
  private readonly TAG = '[AudioSinkManager]:';
  private volume = 100;
  private state = { ...INITIAL_STATE };
  private listener?: HMSUpdateListener;
  private timer: ReturnType<typeof setInterval> | null = null;
  private autoUnpauseTimer: ReturnType<typeof setInterval> | null = null;
  private earpieceSelected = false;

  constructor(private store: Store, private deviceManager: DeviceManager, private eventBus: EventBus) {
    this.eventBus.audioTrackAdded.subscribe(this.handleTrackAdd);
    this.eventBus.audioTrackRemoved.subscribe(this.handleTrackRemove);
    this.eventBus.audioTrackUpdate.subscribe(this.handleTrackUpdate);
    this.eventBus.deviceChange.subscribe(this.handleAudioDeviceChange);
    this.autoSelectAudioOutput(false);
    this.startPollingForDevices();
    this.startPollingToCheckPausedAudio();
  }

  setListener(listener?: HMSUpdateListener) {
    this.listener = listener;
  }

  private get outputDevice() {
    return this.deviceManager.outputDevice;
  }

  getVolume() {
    return this.volume;
  }

  async setVolume(value: number) {
    await this.store.updateAudioOutputVolume(value);
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
    if (this.state.initialized || this.audioSink) {
      return;
    }
    this.state.initialized = true;
    const audioSink = document.createElement('div');
    audioSink.id = `HMS-SDK-audio-sink-${uuid()}`;
    const userElement = elementId && document.getElementById(elementId);
    const audioSinkParent = userElement || document.body;
    audioSinkParent.append(audioSink);

    this.audioSink = audioSink;
    HMSLogger.d(this.TAG, 'audio sink created', this.audioSink);
  }

  cleanup() {
    this.audioSink?.remove();
    this.audioSink = undefined;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.autoUnpauseTimer) {
      clearInterval(this.autoUnpauseTimer);
      this.autoUnpauseTimer = null;
    }
    this.earpieceSelected = false;
    this.eventBus.audioTrackAdded.unsubscribe(this.handleTrackAdd);
    this.eventBus.audioTrackRemoved.unsubscribe(this.handleTrackRemove);
    this.eventBus.audioTrackUpdate.unsubscribe(this.handleTrackUpdate);
    this.eventBus.deviceChange.unsubscribe(this.handleAudioDeviceChange);
    this.autoPausedTracks = new Set();
    this.state = { ...INITIAL_STATE };
  }

  private handleAudioPaused = async (event: any) => {
    // this means the audio paused because of external factors(headset removal, incoming phone call)
    HMSLogger.d(this.TAG, 'Audio Paused', event.target.id);
    const audioTrack = this.store.getTrackById(event.target.id);
    if (audioTrack) {
      this.autoPausedTracks.add(audioTrack as HMSRemoteAudioTrack);
    }
  };

  private handleTrackUpdate = ({ track }: { track: HMSRemoteAudioTrack; enabled: boolean }) => {
    HMSLogger.d(this.TAG, 'Track updated', `${track}`);
  };

  private handleTrackAdd = async ({
    track,
    peer,
    callListener = true,
  }: {
    track: HMSRemoteAudioTrack;
    peer: HMSRemotePeer;
    callListener?: boolean;
  }) => {
    const audioEl = document.createElement('audio');
    audioEl.style.display = 'none';
    audioEl.id = track.trackId;
    audioEl.addEventListener('pause', this.handleAudioPaused);

    audioEl.onerror = async () => {
      HMSLogger.e(this.TAG, 'error on audio element', audioEl.error);
      const ex = ErrorFactory.TracksErrors.AudioPlaybackError(
        `Audio playback error for track - ${track.trackId} code - ${audioEl?.error?.code}`,
      );
      this.eventBus.analytics.publish(AnalyticsEventFactory.audioPlaybackError(ex));
      if (audioEl?.error?.code === MediaError.MEDIA_ERR_DECODE) {
        this.removeAudioElement(audioEl, track);
        await sleep(500);
        await this.handleTrackAdd({ track, peer, callListener: false });
      }
    };
    track.setAudioElement(audioEl);
    track.setVolume(this.volume);
    HMSLogger.d(this.TAG, 'Audio track added', `${track}`);
    this.init(); // call to create sink element if not already created
    this.audioSink?.append(audioEl);
    this.outputDevice && (await track.setOutputDevice(this.outputDevice));
    audioEl.srcObject = new MediaStream([track.nativeTrack]);
    callListener && this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, peer);
    await this.handleAutoplayError(track);
  };

  private handleAutoplayError = async (track: HMSRemoteAudioTrack) => {
    /**
     * if it's not known whether autoplay will succeed, wait for it to be known
     */
    if (this.state.autoplayFailed === undefined) {
      if (!this.state.autoplayCheckPromise) {
        // it's the first track, try to play it, that'll tell us whether autoplay is allowed
        this.state.autoplayCheckPromise = new Promise<void>(resolve => {
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
    // this means the initial load
    if (!event.selection) {
      HMSLogger.d(this.TAG, 'device change called');
      this.autoSelectAudioOutput();
    }
    // if there is no selection that means this is an init request. No need to do anything
    if (event.isUserSelection || event.error || !event.selection || event.type === 'video') {
      return;
    }
    this.unpauseAudioTracks();
  };

  /**
   * try to play audio for the passed in track, assume autoplay error happened if play fails
   * @param track
   * @private
   */
  private async playAudioFor(track: HMSRemoteAudioTrack) {
    const audioEl = track.getAudioElement();
    if (!audioEl) {
      HMSLogger.w(this.TAG, 'No audio element found on track', track.trackId);
      return;
    }
    try {
      await audioEl.play();
      this.state.autoplayFailed = false;
      this.autoPausedTracks.delete(track);
      HMSLogger.d(this.TAG, 'Played track', `${track}`);
    } catch (err) {
      this.autoPausedTracks.add(track);
      HMSLogger.w(this.TAG, 'Failed to play track', `${track}`, err as Error);
      const error = err as Error;
      if (!this.state.autoplayFailed && error.name === 'NotAllowedError') {
        this.state.autoplayFailed = true;
        const ex = ErrorFactory.TracksErrors.AutoplayBlocked(HMSAction.AUTOPLAY, '');
        ex.addNativeError(error);
        this.eventBus.analytics.publish(AnalyticsEventFactory.autoplayError());
        this.eventBus.autoplayError.publish(ex);
      }
    }
  }

  private handleTrackRemove = (track: HMSRemoteAudioTrack) => {
    this.autoPausedTracks.delete(track);
    const audioEl = document.getElementById(track.trackId) as HTMLAudioElement;
    if (audioEl) {
      this.removeAudioElement(audioEl, track);
    }
    // Reset autoplay error thrown because if all tracks are removed and a new track is added
    // Autoplay error is thrown in safari
    if (this.audioSink && this.audioSink.childElementCount === 0) {
      this.state.autoplayCheckPromise = undefined;
      this.state.autoplayFailed = undefined;
    }
    HMSLogger.d(this.TAG, 'Audio track removed', `${track}`);
  };

  private unpauseAudioTracks = async () => {
    const promises: Promise<void>[] = [];
    this.autoPausedTracks.forEach(track => {
      promises.push(this.playAudioFor(track));
    });
    // Return after all pending tracks are played
    await Promise.all(promises);
  };

  private removeAudioElement = (audioEl: HTMLAudioElement, track: HMSRemoteAudioTrack) => {
    if (audioEl) {
      HMSLogger.d(this.TAG, 'removing audio element', `${track}`);
      audioEl.removeEventListener('pause', this.handleAudioPaused);
      audioEl.srcObject = null;
      audioEl.remove();
      track.setAudioElement(null);
    }
  };

  private startPollingToCheckPausedAudio = () => {
    if (isMobile()) {
      this.autoUnpauseTimer = setInterval(() => {
        this.unpauseAudioTracks();
      }, 5000);
    }
  };

  private startPollingForDevices = () => {
    // device change supported, no polling needed
    if ('ondevicechange' in navigator.mediaDevices) {
      return;
    }
    this.timer = setInterval(() => {
      (async () => {
        await this.deviceManager.init(true, false);
        await this.autoSelectAudioOutput();
        this.unpauseAudioTracks();
      })();
    }, 5000);
  };

  public setEarpieceSelected(value = false) {
    this.earpieceSelected = value;
  }
  /**
   * Mweb is not able to play via call channel by default, this is to switch from media channel to call channel
   */
  // eslint-disable-next-line complexity
  private autoSelectAudioOutput = async (shouldMarkSelected = true) => {
    if ('ondevicechange' in navigator.mediaDevices) {
      return;
    }
    const { bluetoothDevice, earpiece, speakerPhone, wired } = this.deviceManager.categorizeAudioInputDevices();
    const localAudioTrack = this.store.getLocalPeer()?.audioTrack;
    if (localAudioTrack && earpiece) {
      const manualSelection = this.deviceManager.getManuallySelectedAudioDevice();
      const externalDeviceID =
        manualSelection?.deviceId || bluetoothDevice?.deviceId || wired?.deviceId || speakerPhone?.deviceId;
      HMSLogger.d(
        this.TAG,
        'externalDeviceID',
        externalDeviceID,
        this.earpieceSelected,
        localAudioTrack.settings.deviceId,
      );
      // already selected appropriate device
      if (localAudioTrack.settings.deviceId === externalDeviceID && this.earpieceSelected) {
        return;
      }
      if (!this.earpieceSelected) {
        await localAudioTrack.setSettings({ deviceId: earpiece?.deviceId }, true);
        this.earpieceSelected = shouldMarkSelected;
      }
      await localAudioTrack.setSettings(
        {
          deviceId: externalDeviceID,
        },
        true,
      );
    }
  };
}
