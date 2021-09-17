import HMSLogger from '../utils/logger';
import { TypedEventEmitter } from '../utils/typed-event-emitter';
import { AudioContextManager } from './AudioContextManager';

/**
 * This class handles audio playlist management
 * - An audio element and audio context which processes audio from audio element is created
 *   in the constructor
 * It handles playback in the following steps
 *  - set's the url on the audio element created in the constructor
 *  - oncanplaythrough event of the audio element
 *    - resume the audio context if it is suspended
 *    - play the audio element
 *    - Get audio track from the audio context manager
 *    - The track is passed to playlist manager to publish
 */
export class PlaylistAudioManager extends TypedEventEmitter<{ ended: null; progress: Event }> {
  private audioElement: HTMLAudioElement;
  private track?: MediaStreamTrack;
  private audioContextManager: AudioContextManager;

  constructor() {
    super();
    this.audioElement = document.createElement('audio');
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.addEventListener('timeupdate', (event) => this.emit('progress', event));
    this.audioElement.addEventListener('ended', () => {
      this.emit('ended', null);
    });
    this.audioContextManager = new AudioContextManager(this.audioElement);
  }

  async play(url: string) {
    return new Promise<MediaStreamTrack[]>((resolve, reject) => {
      this.audioElement.src = url;
      this.audioElement.onerror = (error) => {
        HMSLogger.e(this.TAG, error);
        this.stop();
        reject(error);
      };
      this.audioElement.oncanplaythrough = async () => {
        try {
          this.audioContextManager.resumeContext();
          // Create audio track only once and reuse, it will be updated with current content
          if (!this.track) {
            await this.audioElement.play();
            let audioTrack = this.audioContextManager.getAudioTrack();
            this.track = audioTrack;
            resolve([audioTrack]);
          } else {
            await this.audioElement.play();
            resolve([this.track]);
          }
        } catch (err) {
          HMSLogger.e(this.TAG, 'Error playing audio', url, (err as ErrorEvent).message);
          reject(err);
        }
      };
    });
  }

  getTracks() {
    return this.track ? [this.track.id] : [];
  }

  getElement(): HTMLAudioElement {
    return this.audioElement;
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.removeAttribute('src');
    this.track = undefined;
  }

  private get TAG() {
    return 'PlaylistAudioManager';
  }
}
