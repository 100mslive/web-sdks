import { v4 as uuid } from 'uuid';
import AnalyticsEventFactory from '../analytics/AnalyticsEventFactory';
import { ErrorFactory, HMSAction } from '../error/ErrorFactory';
import { EventBus } from '../events/EventBus';
import { HMSDeviceChangeEvent, HMSTrackUpdate, HMSUpdateListener } from '../interfaces';
import { HMSRemoteAudioTrack } from '../media/tracks';
import { AudioContextManager } from '../playlist-manager/AudioContextManager';
import { HMSRemotePeer } from '../sdk/models/peer';
import { IStore } from '../sdk/store';
import HMSLogger from '../utils/logger';

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
  private stream?: MediaStream;
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
    this.stream = new MediaStream();
    this.audio = new Audio();
    this.audio.srcObject = this.stream;
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

  private handleTrackUpdate = ({ track }: { track: HMSRemoteAudioTrack; enabled: boolean }) => {
    HMSLogger.d(this.TAG, 'Track updated', `${track}`);
  };

  private handleTrackAdd = async ({ track, peer }: { track: HMSRemoteAudioTrack; peer: HMSRemotePeer }) => {
    track.setVolume(this.volume);
    const context = this.audioContextManager.getContext();
    this.stream?.addTrack(track.nativeTrack);
    const source = context.createMediaStreamSource(new MediaStream([track.nativeTrack]));
    const gainNode = context.createGain();
    track.setAudioSource(source, gainNode);
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
    this.stream?.removeTrack(track.nativeTrack);
    HMSLogger.d(this.TAG, 'Audio track removed', `${track}`);
  };
}
