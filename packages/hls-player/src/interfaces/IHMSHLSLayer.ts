import { LevelParsed } from 'hls.js';

export declare interface HMSHLSLayer extends Partial<LevelParsed> {
  readonly bitrate: number;
  readonly height?: number;
  readonly id?: number;
  readonly width?: number;
  url: string;
  resolution?: string;
}
