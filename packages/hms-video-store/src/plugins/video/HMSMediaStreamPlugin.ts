export interface HMSMediaStreamPlugin {
  /**
   * The name is meant to uniquely specify a plugin instance. This will be used to track number of plugins
   * added to the track, and same name won't be allowed twice.
   */
  getName(): string;

  apply(stream: MediaStream): MediaStream;

  stop(): void;
}
