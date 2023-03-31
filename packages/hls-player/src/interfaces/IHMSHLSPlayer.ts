import { HMSHLSLayer } from './IHMSHLSLayer';
interface IHMSHLSPlayer {
  /**
   * @returns get html video element
   */
  getVideoElement(): HTMLVideoElement;

  /**
   * set video volumne
   * @param { volume } - in range [0,100]
   */
  setVolume(volume: number): void;
  /**
   *
   * @returns returns HMSHLSLayer which represents current
   * quality.
   */
  getLayer(): HMSHLSLayer | null;
  /**
   *
   * @param { HMSHLSLayer } layer - layer we want to set the stream to.
   * set { height: auto } to set the layer to auto
   */
  setLayer(layer: HMSHLSLayer): void;
  /**
   * move the video to Live
   */
  seekToLivePosition(): Promise<void>;
  /**
   * play stream
   * call this when autoplay error is received
   */
  play(): Promise<void>;
  /**
   * pause stream
   */
  pause(): void;

  /**
   * It will update the video element current time
   * @param seekValue Pass currentTime in second
   */
  seekTo(seekValue: number): void;
}

export default IHMSHLSPlayer;
