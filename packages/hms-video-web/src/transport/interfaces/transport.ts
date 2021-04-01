import Track, { TrackSettings } from './track';

type Json = {
  [key: string]: string | number | boolean | null | Json | any[];
};

export type JoiningParams = {
  roomId: string;
  token: string;
  endpoint?: string;
};

export type MsgParams = {
  [method: string]: any;
};

export type HMSError = {
  code: number;
  reason: string;
};

export type Callback = (error: HMSError, isSuccess: boolean) => void;

export default interface Transport {
  join(joiningParams: JoiningParams, callback: Callback): void;

  leave(roomId: string, callback: Callback): void;

  getLocalTracks(settings: TrackSettings, callback: Callback): Track[];

  publish(tracks: Track[], callback: Callback): void;

  unpublish(tracks: Track[], callback: Callback): void;

  call(msgParams: MsgParams, callback: Callback): void;

  notify(method: string, params: any): void;

  on(event: string, listener: Function): void;
}

export { Track, TrackSettings };
