export type TrackSettings = {};

export default interface Track {
  layer: 1; // @TODO: Define this
  trackId: string;
  isEnabled: boolean;
  isLocal: boolean;
  hmsTrackSettings: TrackSettings;

  addSink(): void;
  removeSink(): void;
  setLayer(): void;
}
