import { HlsPlayerStats } from '.';

export interface IStatsForNerdsController {
  subscribe(callback: (state: HlsPlayerStats) => void, interval: number): void;
  unsubscribe(): void;
  getState(): HlsPlayerStats;
}
