import HMSTrack from "./interfaces/hms-track";

export default interface ITransport {
  join(authToken: string, roomId: string, peerId: string, customData: Object): Promise<void>;

  leave(): Promise<void>;

  publish(tracks: Array<HMSTrack>): Promise<void>;

  unpublish(tracks: Array<HMSTrack>): Promise<void>;
}