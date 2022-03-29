/**
 * Thresholds for the network quality scores in kbps.
 * ex: { 1: { low: 300, high: 400 }}
 */
export type ScoreMap = Record<
  number,
  {
    low: number;
    high?: number;
  }
>;

/**
 * Informantion necessary to test network quality. it provides a url to be
 * downloaded and timeout for the url download. And also the scores to be
 * assigned based on the downloaded data and time.
 */
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
    readonly enabledFlags?: Array<'subscribeDegradation' | 'simulcast'>;
    readonly networkHealth: NetworkHealth;
  };
}
