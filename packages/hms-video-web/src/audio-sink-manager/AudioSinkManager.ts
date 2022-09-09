import { v4 as uuid } from 'uuid';
import { HMSRemoteAudioTrack } from '../media/tracks';
import HMSLogger from '../utils/logger';
import { IStore } from '../sdk/store';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { HMSDeviceChangeEvent, HMSUpdateListener, HMSTrackUpdate } from '../interfaces';
import { HMSRemotePeer } from '../sdk/models/peer';
import { EventBus } from '../events/EventBus';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { AudioContextManager } from '../playlist-manager/AudioContextManager';

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
  private TAG = '[AudioSinkManager]:';
  private volume = 100;
  private state = { ...INITIAL_STATE };
  private listener?: HMSUpdateListener;
  private audio?: HTMLAudioElement;
  // private destination?: MediaStreamAudioDestinationNode;

  constructor(private store: IStore, private audioContextManager: AudioContextManager, private eventBus: EventBus) {
    this.eventBus.audioTrackAdded.subscribe(this.handleTrackAdd);
    this.eventBus.audioTrackRemoved.subscribe(this.handleTrackRemove);
    this.eventBus.audioTrackUpdate.subscribe(this.handleTrackUpdate);
    this.eventBus.deviceChange.subscribe(this.handleAudioDeviceChange);
  }

  setListener(listener?: HMSUpdateListener) {
    this.listener = listener;
  }

  // private get outputDevice() {
  //   return this.deviceManager.outputDevice;
  // }

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
    await this.audioContextManager.resumeContext();
    await this.audio?.play();
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
    this.eventBus.audioTrackAdded.unsubscribe(this.handleTrackAdd);
    this.eventBus.audioTrackRemoved.unsubscribe(this.handleTrackRemove);
    this.eventBus.audioTrackUpdate.unsubscribe(this.handleTrackUpdate);
    this.eventBus.deviceChange.unsubscribe(this.handleAudioDeviceChange);
    this.autoPausedTracks = new Set();
    this.state = { ...INITIAL_STATE };
  }

  /* private handleAudioPaused = (event: any) => {
    const audioEl = event.target as HTMLAudioElement;
    //@ts-ignore
    const track = audioEl.srcObject?.getAudioTracks()[0];
    if (!track?.enabled) {
      // No need to play if already disabled
      return;
    }
    // this means the audio paused because of external factors(headset removal)
    HMSLogger.d(this.TAG, 'Audio Paused', event.target.id);
    if (!this.state.autoplayFailed) {
      this.audio?.play().catch(console.error);
    }
  };
 */
  private handleTrackUpdate = ({ track }: { track: HMSRemoteAudioTrack; enabled: boolean }) => {
    HMSLogger.d(this.TAG, 'Track updated', `${track}`);
  };

  // eslint-disable-next-line complexity
  private handleTrackAdd = async ({ track, peer }: { track: HMSRemoteAudioTrack; peer: HMSRemotePeer }) => {
    track.setVolume(this.volume);
    const context = this.audioContextManager.getContext();
    const source = context.createMediaStreamSource(new MediaStream([track.nativeTrack]));
    const gainNode = context.createGain();
    track.setAudioSource(source, gainNode);
    // let error: Error | null = null;
    /* if (!this.audio) {
      this.destination = context.createMediaStreamDestination();
      this.audio = new Audio();
      this.audio.srcObject = this.destination.stream;
      this.audioSink?.append(this.audio);
      this.audio.addEventListener('pause', this.handleAudioPaused);
      // @ts-ignore
      this.outputDevice && (await this.audio.setSinkId(this.outputDevice.deviceId));
      try {
        await this.audio.play();
      } catch (ex) {
        error = ex as Error;
      }
    } */
    gainNode.connect(context.destination!);
    HMSLogger.d(this.TAG, 'Audio track added', `${track}`, context.state);
    this.listener?.onTrackUpdate(HMSTrackUpdate.TRACK_ADDED, track, peer);
    if (context.state === 'suspended') {
      this.state.autoplayFailed = true;
      const ex = ErrorFactory.TracksErrors.AutoplayBlocked(HMSAction.AUTOPLAY, '');
      this.eventBus.analytics.publish(AnalyticsEventFactory.autoplayError());
      this.eventBus.autoplayError.publish(ex);
    }
  };

  private handleAudioDeviceChange = (event: HMSDeviceChangeEvent) => {
    // if there is no selection that means this is an init request. No need to do anything
    if (event.error || !event.selection || event.type === 'video') {
      return;
    }
    // this.audio?.play().catch(console.error);
  };

  private handleTrackRemove = (track: HMSRemoteAudioTrack) => {
    this.autoPausedTracks.delete(track);
    HMSLogger.d(this.TAG, 'Audio track removed', `${track}`);
  };
}
