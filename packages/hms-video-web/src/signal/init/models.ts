export type ScoreMap = Record<
  number,
  {
    low: number;
    high?: number;
  }
>;

export interface NetworkHealth {
  url: string;
  timeout: number;
  scoreMap: ScoreMap;
}
export interface InitConfig {
  readonly endpoint: string;
  readonly log_level: string;
  readonly policy: string;
  readonly rtcConfiguration: RTCConfiguration;
  readonly pingTimeout?: number;
  readonly config: {
    readonly enabledFlags?: string[];
    readonly networkHealth: NetworkHealth;
  };
}
