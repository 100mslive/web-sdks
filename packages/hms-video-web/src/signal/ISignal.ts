import { IAnalyticsTransportProvider } from '../analytics/IAnalyticsTransportProvider';
import { HMSConnectionRole } from '../connection/model';

export interface Track {
  mute: boolean;
  type: 'audio' | 'video';
  source: 'regular' | 'screen' | 'plugin';
  description: string;
  track_id: string;
  stream_id: string;
}

export interface ISignal extends IAnalyticsTransportProvider {
  isConnected: boolean;

  open(uri: string): Promise<void>;

  join(
    name: string,
    data: string,
    offer: RTCSessionDescriptionInit,
    disableVidAutoSub: boolean,
  ): Promise<RTCSessionDescriptionInit>;

  trickle(target: HMSConnectionRole, candidate: RTCIceCandidateInit): void;

  offer(desc: RTCSessionDescriptionInit, tracks: Map<string, Track>): Promise<RTCSessionDescriptionInit>;

  answer(desc: RTCSessionDescriptionInit): void;

  trackUpdate(tracks: Map<string, Track>): void;

  broadcast(info: any): void;

  recordStart(): void;

  recordEnd(): void;

  leave(): void;

  ping(timeout: number): Promise<number>;

  close(): Promise<void>;
}
