export interface CaptionData {
  start: number;
  end: number;
  peer_id: string;
  final: boolean;
  caption: string;
}

export interface Captions {
  peerId: string;
  caption: string;
}
