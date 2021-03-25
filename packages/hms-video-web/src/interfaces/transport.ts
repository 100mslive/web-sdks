type JoiningParams = {
  roomId: string;
  token: string;
  endpoint?: string;
};
type SuccessCallback = () => void;

type ErrorCallback = () => void;

type HMSTrack = {};

type HMSTrackSettings = {};

export interface Transport {
  join(joiningParams: JoiningParams, onSucess: SuccessCallback, onError: ErrorCallback): void;

  leave(roomId: string, onSucess: SuccessCallback, onError: ErrorCallback): void;

  getLocalTracks(settings: HMSTrackSettings, onError: ErrorCallback): HMSTrack[];

  publish(tracks: HMSTrack[], onSucess: SuccessCallback, onError: ErrorCallback): void;

  unpublish(tracks: HMSTrack[], onSucess: SuccessCallback, onError: ErrorCallback): void;

  sendMessage(onSucess: SuccessCallback, onError: ErrorCallback): void;
}
