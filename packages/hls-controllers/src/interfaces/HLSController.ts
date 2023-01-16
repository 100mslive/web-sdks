import { ControllerConfig } from './ControllerConfig';

export interface HLSController {
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
  setCurrentLevel(currentLevel: number): void;
  /**
   * Provide the instance of HLS Controller
   */
  getControllerInstance(): HLSController;
  /**
   * move the video to Live
   */
  jumpToLive(): void;

  handleHLSTimeMetadataParsing(): void;
  getControllerConfig(isOptimized: boolean): ControllerConfig;
}
