import { ILevel } from './ILevel';
interface IHMSHLSPlayer {
  /**
   * @returns get html video element
   */
  getVideoElement(): HTMLVideoElement;

  /**
   * set video volumne
   * @param { volume } - define volume in range [1,100]
   */
  setVolume(volume: number): void;
  /**
   *
   * @returns returns a ILevel which represents current
   * quality level. -1 if currentlevel is set to "Auto"
   */
  getCurrentLevel(): ILevel | null;
  /**
   *
   * @param { ILevel } currentLevel - currentLevel we want to
   * set the stream to. -1 for Auto
   */
  setCurrentLevel(currentLevel: ILevel): void;
  /**
   * move the video to Live
   */
  seekToLivePosition(): void;
  /**
   * play stream
   */
  play(): void;
  /**
   * pause stream
   */
  pause(): void;

  /**
   * It will update the video element current time
   * @param seekValue Pass currentTime in second
   */
  seekTo(seekValue: number): void;
  /**
   * unblock autoplay
   */
  unblockAutoPlay(): void;
}

export default IHMSHLSPlayer;
