export type ControllerConfig = {
  enableWorker: boolean;
  maxBufferLength: number;
  backBufferLenght: number;
  liveSyncDuration?: number | null;
  liveMaxLatencyDuration?: number | null;
  liveDurationInfinity?: boolean | null;
  highBufferWatchdogPeriod?: number | null;
};
