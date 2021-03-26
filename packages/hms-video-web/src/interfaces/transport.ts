import { IHMSTrack } from "./track"

type Json = {
  [key: string] : string | number | boolean | null | Json | any[]
}

type JoiningParams = {
  roomId: string;
  token: string;
  endpoint?: string;
};

type MsgParams = {
  [method: string]: Json
}

type HMSError = {
  code: number;
  reason: string
}

type Callback = (error: HMSError, isSuccess: boolean) => void

type HMSTrackSettings = {};

export interface IHMSTransport {
  join(joiningParams: JoiningParams, callback: Callback): void;

  leave(roomId: string, callback: Callback): void;

  getLocalTracks(settings: HMSTrackSettings, callback: Callback): IHMSTrack[];

  publish(tracks: IHMSTrack[], callback: Callback): void;

  unpublish(tracks: IHMSTrack[], callback: Callback): void;

  sendMessage(msgParams: MsgParams, callback: Callback): void;
}
