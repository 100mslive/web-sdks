import { ILevel } from './ILevel';
interface IHMSHLSController {
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
}

export default IHMSHLSController;
