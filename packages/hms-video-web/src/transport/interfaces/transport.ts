import HMSTrack, { HMSTrackSettings } from './hms-track';

type Json = {
  [key: string]: string | number | boolean | null | Json | any[];
};

export type JoiningParams = {
  roomId: string;
  token: string;
  endpoint?: string
};

export type MsgParams = {
  [method: string]: any;
};

export type HMSError = {
  code: number;
  reason: string;
};

export type Callback = (error: HMSError | null, result: any) => void;

export default interface Transport {
  join(joiningParams: JoiningParams, callback: Callback): void;

  leave(roomId: string, callback: Callback): void;

  getLocalTracks(settings: HMSTrackSettings, callback: Callback): HMSTrack[];

  publish(tracks: HMSTrack[], callback: Callback): void;

  unpublish(tracks: HMSTrack[], callback: Callback): void;

  call(msgParams: MsgParams, callback: Callback): void;

  notify(method: string, params: any): void;

  on(event: string, listener: Function): void;
}

export { HMSTrack, HMSTrackSettings };
