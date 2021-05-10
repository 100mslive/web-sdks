import { v4 as uuid } from 'uuid';
import HMSAudioTrack from '../media/tracks/HMSAudioTrack';
import NotificationManager from '../sdk/NotificationManager';

const SILENT_AUDIO_URL = 'https://res.cloudinary.com/dlzh3j8em/video/upload/v1619210717/silence_xko7fm.mp3';

export default class HMSAudioSinkManager {
  private audioSink: HTMLElement;
  private notificationManager: NotificationManager;

  constructor(notificationManager: NotificationManager, elementId?: string) {
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
  }

  cleanUp() {
    this.notificationManager.removeEventListener('track-added', this.handleTrackAdd as EventListener);
    this.notificationManager.removeEventListener('track-removed', this.handleTrackRemove as EventListener);
  }

  private addSilentAudio() {
    const silentAudio = document.createElement('audio');
    silentAudio.autoplay = true;
    silentAudio.style.display = 'none';
    silentAudio.id = `HMS-SDK-silent-audio-track-${uuid()}`;
    silentAudio.src = SILENT_AUDIO_URL;

    this.audioSink.append(silentAudio);
  }

  private handleTrackAdd = (event: CustomEvent<HMSAudioTrack>) => {
    const track = event.detail;
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    audioEl.style.display = 'none';
    audioEl.id = track.trackId;
    audioEl.srcObject = new MediaStream([track.nativeTrack]);

    this.audioSink.append(audioEl);
  };

  private handleTrackRemove = (event: CustomEvent<HMSAudioTrack>) => {
    const track = event.detail;
    document.getElementById(track.trackId)?.remove();
  };
}
