import HMSTrack from '../media/tracks/HMSTrack';

export default interface HMSPeer {
  peerId: string;
  name: string;
  isLocal: boolean;
  customerUserId?: string;
  customerDescription: string;
  videoTrack?: HMSTrack | null;
  audioTrack?: HMSTrack | null;
  auxiliaryTracks: HMSTrack[];
  role?: string;
}
