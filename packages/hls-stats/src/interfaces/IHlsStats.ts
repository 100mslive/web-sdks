import { HlsPlayerStats } from '.';

export interface IHlsStats {
  subscribe(callback: (state: HlsPlayerStats) => void, interval: number): () => void;
  getState(): HlsPlayerStats;
}
