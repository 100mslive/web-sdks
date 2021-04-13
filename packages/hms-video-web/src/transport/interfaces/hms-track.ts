export type HMSTrackSettings = {};

export default interface HMSTrack {
  layer: 1; // @TODO: Define this
  trackId: string;
  isEnabled: boolean;
  isLocal: boolean;
  hmsTrackSettings: HMSTrackSettings;

  addSink(): void;
  removeSink(): void;
  setLayer(): void;
}
