import { Level } from 'hls.js';
interface IHLSController {
  /**
   *
   * @returns returns a Number which represents current
   * quality level. -1 if currentlevel is set to "Auto"
   */
  getCurrentLevel(): number;
  /**
   *
   * @param { Hls.Level } currentLevel - currentLevel we want to
   * set the stream to. -1 for Auto
   */
  setCurrentLevel(currentLevel: Level): void;
  /**
   * move the video to Live
   */
  jumpToLive(): void;
}

export default IHLSController;
