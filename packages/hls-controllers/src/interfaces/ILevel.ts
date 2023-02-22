import { AttrList, LevelParsed } from 'hls.js';

export declare interface ILevel extends Partial<LevelParsed> {
  readonly attrs: LevelAttributes;
  readonly bitrate: number;
  readonly height?: number;
  readonly id?: number;
  readonly name: string | undefined;
  readonly width?: number;
  readonly level?: number;
  readonly videoCodec: string | undefined;
  readonly audioCodec: string | undefined;
  readonly unknownCodecs: string[] | undefined;
  url: string;
}

export declare interface LevelAttributes extends AttrList {
  'ALLOWED-CPC'?: string;
  AUDIO?: string;
  AUTOSELECT?: string;
  'AVERAGE-BANDWIDTH'?: string;
  BANDWIDTH?: string;
  BYTERANGE?: string;
  'CLOSED-CAPTIONS'?: string;
  CHARACTERISTICS?: string;
  CODECS?: string;
  DEFAULT?: string;
  FORCED?: string;
  'FRAME-RATE'?: string;
  'HDCP-LEVEL'?: string;
  LANGUAGE?: string;
  NAME?: string;
  'PATHWAY-ID'?: string;
  'PROGRAM-ID'?: string;
  RESOLUTION?: string;
  SCORE?: string;
  SUBTITLES?: string;
  TYPE?: string;
  URI?: string;
  'VIDEO-RANGE'?: string;
}
