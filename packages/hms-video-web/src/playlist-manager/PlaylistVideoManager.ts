import HMSLogger from '../utils/logger';
import { TypedEventEmitter } from '../utils/typed-event-emitter';
import { AudioContextManager } from './AudioContextManager';

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
  private videoElement: HTMLVideoElement;
  private canvasContext: CanvasRenderingContext2D | null;
  private canvas!: HTMLCanvasElement;
  private timer: any;
  private tracks: MediaStreamTrack[] = [];
  private audioContextManager: AudioContextManager;
  private DEFAUL_FPS = 24;

  constructor() {
    super();
    this.videoElement = document.createElement('video');
    this.videoElement.crossOrigin = 'anonymous';
    this.videoElement.addEventListener('timeupdate', (event) => this.emit('progress', event));
    this.videoElement.addEventListener('ended', () => {
      this.emit('ended', null);
    });
    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d');
    this.audioContextManager = new AudioContextManager(this.videoElement);
  }

  play(url: string) {
    return new Promise<MediaStreamTrack[]>((resolve, reject) => {
      this.videoElement.src = url;
      this.videoElement.onerror = (error) => {
        HMSLogger.e(this.TAG, error);
        this.stop();
        reject(error);
      };
      this.videoElement.oncanplaythrough = async () => {
        try {
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
            this.audioContextManager.resumeContext();
            await this.videoElement.play();
            const audioTrack = this.audioContextManager.getAudioTrack();
            stream.addTrack(audioTrack);
            stream.getTracks().forEach((track: MediaStreamTrack) => {
              this.tracks.push(track);
            });
            resolve(this.tracks);
          } else {
            // No need to capture canvas stream/get audio track. They wull be auto updated
            await this.videoElement.play();
            resolve(this.tracks);
          }
        } catch (err) {
          HMSLogger.e(this.TAG, 'Error playing video', url, (err as ErrorEvent).message);
          reject(err);
        }
      };
    });
  }

  getTracks() {
    return this.tracks.map((track) => track.id);
  }

  getElement() {
    return this.videoElement;
  }

  stop() {
    this.videoElement.pause();
    this.videoElement.removeAttribute('src');
    this.clearCanvasAndTracks();
  }

  private clearCanvasAndTracks() {
    this.tracks = [];
    // clear canvas before playing new video
    this.canvasContext?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    clearTimeout(this.timer);
  }

  private drawImage = () => {
    this.canvasContext?.drawImage(this.videoElement, 0, 0, this.canvas?.width, this.canvas?.height);
    this.timer = setTimeout(() => {
      this.drawImage();
    }, 1000 / this.DEFAUL_FPS);
  };

  private get TAG() {
    return 'PlaylistVideoManager';
  }
}
