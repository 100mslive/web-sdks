import { AudioContextManager } from './AudioContextManager';
import HMSLogger from '../utils/logger';
import { TypedEventEmitter } from '../utils/typed-event-emitter';

/**
 * This class handles video playlist management
 * - An video element, canvas and audio context which processes audio from video element is created
 *   in the constructor
 * It handles playback in the following steps
 *  - set's the url on the video element created in the constructor
 *  - oncanplaythrough event of the video element
 *    - resume the audio context if it is suspended
 *    - set width/height on canvas
 *    - captureStream on canvas element if not already captured
 *    - play the video element
 *    - on video element is played, it is drawn to canvas
 *    - Get audio track from the audio context manager
 *    - add audioTrack to canvas stream
 *    - The audio and video tracks are passed to playlist manager to publish
 */
export class PlaylistVideoManager extends TypedEventEmitter<{ ended: null; progress: Event }> {
  private readonly TAG = '[PlaylistVideoManager]';
  private videoElement: HTMLVideoElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private canvas!: HTMLCanvasElement;
  private timer: any;
  private tracks: MediaStreamTrack[] = [];
  private audioContextManager!: AudioContextManager;
  private DEFAUL_FPS = 24;
  // This is to handle video playing when seekTo is called when video is paused
  private seeked = false;

  play(url: string) {
    this.videoElement = this.getVideoElement();
    this.createCanvas();
    return new Promise<MediaStreamTrack[]>((resolve, reject) => {
      this.videoElement = this.getVideoElement();
      this.videoElement.src = url;
      this.seeked = false;
      this.videoElement.onerror = () => {
        const error = `Error loading ${url}`;
        HMSLogger.e(this.TAG, error);
        this.stop();
        reject(error);
      };
      // oncanplaythrough is called when enough media is loaded for play to be possible in two cases -
      //    * when play is called for the first time
      //    * when user jumps to any mid track timestamp using seekTo
      this.videoElement.oncanplaythrough = async () => {
        try {
          if (!this.videoElement) {
            return;
          }
          this.canvas.width = this.videoElement.videoWidth;
          this.canvas.height = this.videoElement.videoHeight;
          // Capture stream only once and reuse the same tracks. it will be autoupdated with the selected video
          if (this.tracks.length === 0) {
            this.clearCanvasAndTracks();
            //@ts-ignore
            const stream = this.canvas.captureStream();
            if (!stream) {
              HMSLogger.e(this.TAG, 'Browser does not support captureStream');
              return;
            }
            this.videoElement.onplay = this.drawImage;
            await this.audioContextManager.resumeContext();
            await this.videoElement.play();
            const audioTrack = this.audioContextManager.getAudioTrack();
            stream.addTrack(audioTrack);
            stream.getTracks().forEach((track: MediaStreamTrack) => {
              this.tracks.push(track);
            });
            resolve(this.tracks);
          } else {
            // No need to capture canvas stream/get audio track. They wull be auto updated
            if (!this.seeked) {
              // if this was called in response to a play call
              await this.videoElement.play();
              resolve(this.tracks);
            } else {
              // if seek happened, there is no play call/promise to be resolved, just reset seeked
              this.seeked = false;
              // This event will be called on seekTo when paused. Just draw the one frame on canvas.
              this.canvasContext?.drawImage(this.videoElement, 0, 0, this.canvas?.width, this.canvas?.height);
            }
          }
        } catch (err) {
          HMSLogger.e(this.TAG, 'Error playing video', url, (err as ErrorEvent).message);
          reject(err);
        }
      };
      this.videoElement.onseeked = () => {
        this.seeked = true;
      };
    });
  }

  getTracks() {
    return this.tracks.map(track => track.id);
  }

  getElement() {
    if (!this.videoElement) {
      this.videoElement = this.getVideoElement();
    }
    return this.videoElement;
  }

  stop() {
    this.videoElement?.pause();
    this.videoElement?.removeAttribute('src');
    this.videoElement = null;
    this.audioContextManager?.cleanup();
    this.clearCanvasAndTracks();
  }

  private clearCanvasAndTracks() {
    this.tracks = [];
    // clear canvas before playing new video
    this.canvasContext?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    clearTimeout(this.timer);
  }

  private drawImage = () => {
    if (this.videoElement && !this.videoElement.paused && !this.videoElement.ended) {
      this.canvasContext?.drawImage(this.videoElement, 0, 0, this.canvas?.width, this.canvas?.height);
      this.timer = setTimeout(() => {
        this.drawImage();
      }, 1000 / this.DEFAUL_FPS);
    }
  };

  private getVideoElement() {
    if (this.videoElement) {
      return this.videoElement;
    }
    const videoElement = document.createElement('video');
    videoElement.crossOrigin = 'anonymous';
    videoElement.addEventListener('timeupdate', event => this.emit('progress', event));
    videoElement.addEventListener('ended', () => {
      this.emit('ended', null);
    });
    this.audioContextManager = new AudioContextManager(videoElement);
    return videoElement;
  }

  private createCanvas() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvasContext = this.canvas.getContext('2d');
    }
  }
}
