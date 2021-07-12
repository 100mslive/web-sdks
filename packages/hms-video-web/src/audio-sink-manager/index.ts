import { v4 as uuid } from 'uuid';
import { HMSAudioTrack } from '../media/tracks/HMSAudioTrack';
import DeviceManager from '../sdk/models/DeviceManager';
import NotificationManager from '../sdk/NotificationManager';
import HMSLogger from '../utils/logger';

const SILENT_AUDIO_URL = 'https://100ms.live/silence.mp3';
export default class HMSAudioSinkManager {
  private audioSink: HTMLElement;
  private notificationManager: NotificationManager;
  private deviceManager: DeviceManager;
  private autoPausedTracks: Set<string> = new Set();
  private playInProgress = false;
  private TAG = '[AudioSinkManager]:';

  constructor(notificationManager: NotificationManager, deviceManager: DeviceManager, elementId?: string) {
    const audioSink = document.createElement('div');
    audioSink.id = `HMS-SDK-audio-sink-${uuid()}`;
    const userElement = elementId && document.getElementById(elementId);
    const audioSinkParent = userElement || document.body;
    audioSinkParent.append(audioSink);

    this.audioSink = audioSink;
    this.addSilentAudio();
    this.notificationManager = notificationManager;
    this.notificationManager.addEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.addEventListener('track-removed', this.handleTrackRemove as EventListener);
    this.deviceManager = deviceManager;
    this.deviceManager.addEventListener('audio-device-change', this.handleAudioDeviceChange);
  }

  cleanUp() {
    this.notificationManager.removeEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.removeEventListener('track-removed', this.handleTrackRemove as EventListener);
    this.deviceManager.removeEventListener('audio-device-change', this.handleAudioDeviceChange);
    this.audioSink.remove();
  }

  private addSilentAudio() {
    const silentAudio = document.createElement('audio');
    silentAudio.autoplay = true;
    silentAudio.style.display = 'none';
    silentAudio.id = `HMS-SDK-silent-audio-track-${uuid()}`;
    silentAudio.src = SILENT_AUDIO_URL;

    this.audioSink.append(silentAudio);
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
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.style.display = 'none';
    audioEl.id = track.trackId;
    audioEl.srcObject = new MediaStream([track.nativeTrack]);
    audioEl.addEventListener('pause', this.handleAudioPaused);
    HMSLogger.d(this.TAG, 'Audio track added', track.trackId);
    this.audioSink.append(audioEl);
    track.setAudioElement(audioEl);
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
