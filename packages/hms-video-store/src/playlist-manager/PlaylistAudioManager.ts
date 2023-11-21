import { AudioContextManager } from './AudioContextManager';
import HMSLogger from '../utils/logger';
import { TypedEventEmitter } from '../utils/typed-event-emitter';

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
  private audioElement: HTMLAudioElement | null = null;
  private track?: MediaStreamTrack;
  private audioContextManager!: AudioContextManager;
  private readonly TAG = '[PlaylistAudioManager]';
  // This is to handle audio playing when seekTo is called when audio is paused
  private seeked = false;

  async play(url: string) {
    this.audioElement = this.getAudioElement();
    return new Promise<MediaStreamTrack[]>((resolve, reject) => {
      this.audioElement = this.getAudioElement();
      this.audioElement.src = url;
      this.seeked = false;
      this.audioElement.onerror = () => {
        const error = `Error loading ${url}`;
        HMSLogger.e(this.TAG, error);
        this.stop();
        reject(error);
      };
      // oncanplaythrough is called when enough media is loaded for play to be possible in two cases -
      //    * when play is called for the first time
      //    * when user seeks jumps to any mid track timestamp
      this.audioElement.oncanplaythrough = async () => {
        try {
          if (!this.audioElement) {
            return;
          }
          this.audioContextManager.resumeContext();
          // Create audio track only once and reuse, it will be updated with current content
          if (!this.track) {
            await this.audioElement.play();
            const audioTrack = this.audioContextManager.getAudioTrack();
            this.track = audioTrack;
            resolve([audioTrack]);
          } else {
            if (!this.seeked) {
              // if this was called in response to a play call
              await this.audioElement.play();
              resolve([this.track]);
            } else {
              // if seek happened, there is no play call/promise to be resolved, just reset seeked
              this.seeked = false;
            }
          }
        } catch (err) {
          HMSLogger.e(this.TAG, 'Error playing audio', url, (err as ErrorEvent).message);
          reject(err);
        }
      };
      this.audioElement.onseeked = () => {
        this.seeked = true;
      };
    });
  }

  getTracks() {
    return this.track ? [this.track.id] : [];
  }

  getElement() {
    if (!this.audioElement) {
      this.audioElement = this.getAudioElement();
    }
    return this.audioElement;
  }

  stop() {
    this.audioElement?.pause();
    this.audioElement?.removeAttribute('src');
    this.audioElement = null;
    this.audioContextManager?.cleanup();
    this.track = undefined;
  }

  private getAudioElement() {
    if (this.audioElement) {
      return this.audioElement;
    }
    const audioElement = document.createElement('audio');
    audioElement.crossOrigin = 'anonymous';
    audioElement.addEventListener('timeupdate', event => this.emit('progress', event));
    audioElement.addEventListener('ended', () => {
      this.emit('ended', null);
    });
    this.audioContextManager = new AudioContextManager(audioElement);
    return audioElement;
  }
}
