import { HMSHLS, HMSRecording, HMSRoom, HMSRTMP } from '../../interfaces/room';

export default class Room implements HMSRoom {
  id: string;
  joinedAt?: Date | undefined;
  templateId?: string | undefined;
  sessionId?: string;
  startedAt?: Date;
  recording: HMSRecording = { server: { running: false }, browser: { running: false }, hls: { running: false } };
  rtmp: HMSRTMP = { running: false };
  hls: HMSHLS = { running: false, variants: [] };
  name?: string;
  peerCount?: number;
  description?: string;
  max_size?: number;
  large_room_optimization?: boolean;

  constructor(id: string) {
    this.id = id;
  }
}
